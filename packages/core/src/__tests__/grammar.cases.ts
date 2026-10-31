// The grammar of messages, as one table for both the runtime and the type of
// the variables: grammar.test.ts runs each message, types.typecheck.ts checks
// the variable names that the type finds in it.
//
// - names: the variables of the message
// - output: the message with each variable `name` replaced by `<name>`

export const grammarCases = [
  { message: 'Hello', names: [], output: 'Hello' },
  { message: 'Hello, {name}!', names: ['name'], output: 'Hello, <name>!' },
  { message: '{greeting}, {name}! {count}', names: ['greeting', 'name', 'count'], output: '<greeting>, <name>! <count>' },
  { message: '{a} and {a}', names: ['a'], output: '<a> and <a>' },
  { message: '{user_1} {A9}', names: ['user_1', 'A9'], output: '<user_1> <A9>' },
  // "{{" is "{" and "}}" is "}"
  { message: '{{', names: [], output: '{' },
  { message: '}}', names: [], output: '}' },
  { message: 'a {{ b }} c', names: [], output: 'a { b } c' },
  { message: '{{name}}', names: [], output: '{name}' },
  { message: '{{name}', names: [], output: '{name}' },
  { message: '{{{name}}}', names: ['name'], output: '{<name>}' },
  { message: '{{{{name}}}}', names: [], output: '{{name}}' },
  { message: '{name}}', names: ['name'], output: '<name>}' },
  { message: '}}}', names: [], output: '}}' },
  // A brace that starts no variable is kept
  { message: '{', names: [], output: '{' },
  { message: '}', names: [], output: '}' },
  { message: '{}', names: [], output: '{}' },
  { message: '{x', names: [], output: '{x' },
  { message: '}{x}{', names: ['x'], output: '}<x>{' },
  { message: '{ name }', names: [], output: '{ name }' },
  { message: '{first-name}', names: [], output: '{first-name}' },
  { message: '{名前}', names: [], output: '{名前}' },
  { message: '{a{b}', names: ['b'], output: '{a<b>' },
  { message: '{a.b}', names: [], output: '{a.b}' }
] as const
