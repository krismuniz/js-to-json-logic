const { parse } = require('@babel/parser')

const processOp = (operator) => {
  switch (operator) {
    case '||':
      return 'or'
    case '&&':
      return 'and'
    default:
      return operator
  }
}

const replaceVariable = (name) => (rule) => {
  const entries = Object.entries(rule)

  if (!entries.length) return rule

  for (const [key, value] of Object.entries(rule)) {
    if (key === 'var') return value === name ? { var: '' } : { [key]: value }

    if (Array.isArray(value)) {
      return { [key]: value.map(replaceVariable(name)) }
    } else {
      return rule
    }
  }
}

function processError ({ loc }, message) {
  return {
    parsing_error: {
      message,
      at: loc
    }
  }
}

function processNode (node, valueOnly = false) {
  switch (node.type) {
    case 'File': {
      return processNode(node.program)
    }
    case 'Program': {
      if (node.directives.length > 0) {
        return node.directives.length > 1
          ? processError(node, 'Only one expression statement allowed.')
          : processNode(node.directives[0])
      }

      return node.body.length > 1
        ? processError(node, 'Block statements can only have one expression statement.')
        : processNode(node.body[0])
    }
    case 'TemplateLiteral': {
      const nodes = []
      const expressions = node.expressions

      let index = 0
      for (const elem of (node.quasis)) {
        if (elem.value.cooked) {
          nodes.push(elem.value.cooked)
        }

        if (index < expressions.length) {
          const expr = expressions[index++]
          nodes.push(processNode(expr))
        }
      }

      if (nodes.length === 1) return nodes[0]

      return {
        cat: nodes
      }
    }
    case 'Directive': {
      // directives will be parsed as strings to allow rules to be just a plain string
      return processNode(node.value)
    }
    case 'DirectiveLiteral':
    case 'BooleanLiteral':
    case 'StringLiteral':
    case 'NumericLiteral': {
      return node.value
    }

    case 'NullLiteral': {
      return null
    }

    case 'SpreadElement': {
      return processNode(node.argument)
    }

    case 'RegExpLiteral': {
      return [node.pattern, node.flags]
    }

    case 'ArrayExpression': {
      // handle spread operators [1, 2, ...myArray]
      if (node.elements.some((node) => node.type === 'SpreadElement')) {
        return {
          merge: [
            ...node.elements.map((node) => processNode(node))
          ]
        }
      }

      return node.elements.map((node) => processNode(node))
    }

    case 'ObjectExpression': {
      const result = {}
      for (const prop of node.properties) {
        if (prop.type === 'SpreadElement') continue
        result[processNode(prop.key, true)] = processNode(prop.value)
      }
      return result
    }

    case 'Identifier': {
      return node.name === 'undefined'
        ? null
        : (valueOnly ? node.name : { var: node.name })
    }

    case 'ExpressionStatement': {
      return processNode(node.expression)
    }

    case 'BlockStatement': {
      return node.body.length > 1
        ? processError(node, 'Block statements can only have one expression statement.')
        : processNode(node.body[0])
    }

    case 'CallExpression': {
      const key = node.callee.type !== 'Identifier' ? processNode(node.callee, true) : node.callee.name

      return {
        [key]: node.arguments.map((node) => processNode(node))
      }
    }

    case 'LogicalExpression':
    case 'BinaryExpression': {
      return {
        [processOp(node.operator)]: [processNode(node.left), processNode(node.right)]
      }
    }

    case 'UnaryExpression': {
      if (node.operator === '!' && node.argument.operator === '!') {
        return {
          '!!': [processNode(node.argument.argument)]
        }
      }

      if (node.operator === '-' && node.argument.type === 'NumericLiteral') {
        return node.argument.value * -1
      }

      return {
        [node.operator]: [processNode(node.argument)]
      }
    }

    case 'ConditionalExpression': {
      return {
        if: [
          processNode(node.test),
          processNode(node.consequent),
          processNode(node.alternate)
        ]
      }
    }
    case 'MemberExpression': {
      const object = node.object.type !== 'Identifier' ? processNode(node.object, true) : node.object.name
      const property = node.property.type !== 'Identifier'
        ? processNode(node.property, true)
        : node.property.name

      const value = `${object}.${property}`

      return valueOnly ? value : { var: value }
    }

    case 'IfStatement': {
      return {
        if: [
          processNode(node.test),
          processNode(node.consequent),
          node.alternate
            ? processNode(node.alternate)
            : undefined
        ].filter(Boolean)
      }
    }

    case 'ArrowFunctionExpression': {
      if (node.body.type === 'BlockStatement' && node.body.body.length > 1) {
        return processError(node, 'Only one-line arrow functions with implicit return are supported.')
      }

      const params = node.params.map((node) => processNode(node))
      const body = processNode(node.body)

      return !params.length || params.length > 1
        ? body
        : replaceVariable(params[0].var)(body)
    }

    case 'ReturnStatement': {
      return processNode(node.argument)
    }

    /** unsuported features */
    case 'UpdateExpression': {
      return processError(node, 'Update expressions (x++, ++x, x--, --x, etc.) are not supported.')
    }
    case 'TaggedTemplateExpression': {
      return processError(node, 'Tagged template expressions are not supported.')
    }
    case 'NewExpression': {
      return processError(node, 'Expressions that use the `new` keyword are not supported.')
    }
    case 'ClassDeclaration': {
      return processError(node, 'Classes are not supported.')
    }
    case 'FunctionDeclaration': {
      return processError(node, 'Function declarations are not supported.')
    }
    case 'WhileStatement': {
      return processError(node, 'While-loops are not supported.')
    }
    case 'ForStatement': {
      return processError(node, 'For-loops are not supported.')
    }
    case 'SwitchStatement': {
      return processError(node, 'Switch statements are not supported.')
    }
    case 'VariableDeclaration': {
      return processError(node, 'Variable (var, let, const) declarations are not supported.')
    }
    case 'AssignmentExpression': {
      return processError(node, 'Assignments not supported.')
    }
    /** catch other unsupported features */
    default: {
      return processError(node, `Invalid node '${node.type}'. Not supported.`)
    }
  }
}

const transformJS = (code) => {
  try {
    return processNode(parse(code, { strictMode: true, errorRecovery: true }))
  } catch (e) {
    return processError({
      loc: {
        start: e.loc,
        end: e.loc
      }
    }, `Could not parse code. ${e.message}`)
  }
}

module.exports = transformJS
