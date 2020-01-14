# JS to JSONLogic

[![npm](https://img.shields.io/npm/v/js-to-json-logic.svg?style=flat-square)](https://npm.im/js-to-json-logic) [![License:MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](http://opensource.org/licenses/MIT) [![GitHub Workflow Status](https://img.shields.io/github/workflow/status/krismuniz/js-to-json-logic/build?logo=github&logoColor=white&style=flat-square)](https://github.com/krismuniz/js-to-json-logic/actions?query=workflow%3Abuild) ![Type Declarations](https://img.shields.io/npm/types/js-to-json-logic.svg?style=flat-square) [![Try It on RunKit](https://img.shields.io/badge/Try_It_on-RunKit-f55fa6?labelColor=491757&style=flat-square)](https://npm.runkit.com/js-to-json-logic)

Transform JavaScript expressions into [JSONLogic](http://jsonlogic.com) objects. For Node.js.

> NOTICE: This module is still in beta!

### Installing

```shell
npm install --save js-to-json-logic
```

### Usage

```js
const transformJS = require("js-to-json-logic");

transformJS('temp < 110 && pie.filling === "apple"');
```

The `transformJS` function returns a JavaScript object, which can be stringified as a JSON and look like this:

```json
{
  "and": [
    {
      "<": [
        {
          "var": "temp"
        },
        110
      ]
    },
    {
      "===": [
        {
          "var": "pie.filling"
        },
        "apple"
      ]
    }
  ]
}
```

### How it Works

To parse input code, this module uses `@babel/parser` to parse JavaScript code into an [Abstract Syntax Tree (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree). The tree is then transformed into a JSONLogic object.

Said object is can then be used with the [`json-logic-js`](https://npmjs.com/package/json-logic-js) module to apply the interpreted rules to any type of data. [Learn More](http://jsonlogic.com)

### Supported JavaScript Syntax

| expression                     | support | examples                                                 |
| ------------------------------ | ------- | -------------------------------------------------------- |
| Boolean Literals               | full    | `true`, `false`                                          |
| String Literals                | full    | `"banana"`, `"hello world"`                              |
| Template Literals              | full    | <code>\`hello, \${first_name}\`</code>                   |
| Numeric Literals               | full    | `1`, `2.04`, `-10292.64`, `0b01011010`, `0xFF00FF`, etc. |
| Object Expressions / Literals  | full    | `{ a: [1, false, 'string'], b: false, d: 'hello' }`      |
| Array Expressions              | full    | `[1, 2, 3]`                                              |
| Spread Operator in Arrays      | full    | `[1, 2, ...myArr]`                                       |
| Null Literals                  | full    | `null`                                                   |
| Identifiers (variables)        | full    | `myVar`, `deep.property`                                 |
| Comparison Expressions         | full    | `a > b`, `a < b`, `a <= b`, `a === b`, `a !== b`, etc.   |
| Arithmetic Operators           | full    | `a + b`, `a * b`, `a - b`, `a / b`, `a % b`              |
| Call Expressions               | full    | `myFunction(a, b, c)`                                    |
| Unary Expressions              | full    | `!cond`, `!!cond`, `-var`, `+var`                        |
| Conditional (Ternary) Operator | full    | `condition ? a : b`                                      |
| Regex Literal                  | limited | `/[^@]+@[^\.]+\..+/gi`                                   |
| If Statements                  | limited | `if (condA) { a } else if (condB) { b } else { c }`      |
| Call Expressions with Callback | limited | `map(arr, x => x + 1)`                                   |
| Arrow Functions                | limited | `x => x + 1`, `(a, b) => a + b`                          |

Notes:

- Regex Literals: are not supported by the JSON spec. To account for this, they are converted into an array of strings. The first element of the array is the pattern, the second one contains the flags. Example: `[ "\d\d\d\d", "gi" ]`

- If Statements: Multi-line consequentials (block statements in if statements) are not supported. Also, implicit return will always apply.

- Call Expressions with Callback: Only arrow functions are allowed as callbacks in call expressions.

- Arrow Functions: arrow functions can only be single-line expressions or have a one-line block statement

- If a specific syntactic JS feature is not specified in the table above, it's likely that it isn't supported. If you have an idea on how to support said feature, feel free to file a GitHub Issue.

### Unsupported Syntax

The following syntactic features are not supported by this module.

- Class Declarations
- Update Expressions (`i++`, `i--`, etc.)
- Assignment Expressions
- Tagged Template Expressions
- Function Declaration
- While Loops
- For Loops
- Multi-Line Block Statements
- `new` operator
- Destructuring assignment
- Rest operator
- Spread operator (although it works within array expressions)

### Contributing

#### Bug Reports & Feature Requests

Something does not work as expected or perhaps you think this project _needs_ a feature? Please open an issue using GitHub [issue tracker](https://github.com/krismuniz/js-to-json-logic/issues/new).

Make sure that an issue pointing out your specific problem does not exist already. Please be as specific and straightforward as possible.

#### Pull Requests

Pull Requests (PRs) are welcome! You should follow the [same basic stylistic conventions](http://standardjs.com/rules.html) as the original code.

Make sure that a pull request solving your specific problem does not exist already. Your changes must be concise and focus on solving a discrete problem.

### License

[The MIT License (MIT)](/LICENSE)

Copyright (c) 2020 [Kristian Muñiz](https://www.krismuniz.com)
