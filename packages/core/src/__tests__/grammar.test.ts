import { describe, expect, it } from 'vitest'
import { resolveMessage } from '../utils'
import { grammarCases } from './grammar.cases'

// Vars that have every name: each variable the runtime finds becomes <name>
const everyName = new Proxy({}, {
  get: (_, name) => typeof name === 'string' ? `<${name}>` : undefined
}) as Record<string, string>

describe('the grammar of messages', () => {
  it.each(grammarCases)('$message', ({ message, names, output }) => {
    expect(resolveMessage({ message }, 'message', undefined, undefined, everyName)).toBe(output)
    // The table agrees with itself: the variables of the output are the names
    const replaced = new Set([...output.matchAll(/<(\w+)>/g)].map(match => match[1]))
    expect(replaced).toEqual(new Set(names))
  })

  it('shows "{{" and "}}" as "{" and "}" without vars too', () => {
    expect(resolveMessage({ message: 'Use {{name}} for {what}' }, 'message')).toBe('Use {name} for {what}')
    expect(resolveMessage({ message: '{{}}' }, 'message', undefined, undefined, {})).toBe('{}')
  })

  it('keeps a variable without a value, next to the braces', () => {
    expect(resolveMessage({ message: '{{{name}}}' }, 'message', undefined, undefined, {})).toBe('{{name}}')
  })
})
