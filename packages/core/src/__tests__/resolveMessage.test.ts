import { describe, expect, it } from 'vitest'
import { resolveMessage } from '../utils'

describe('resolveMessage()', () => {
  const messages = {
    common: {
      title: 'Hello',
      greeting: 'Hello, {name}!',
      multiVar: '{greeting}, {name}! You have {count} messages.',
      nested: {
        deep: 'Deep value'
      }
    },
    errors: {
      notFound: 'Page not found'
    }
  }

  describe('basic resolution', () => {
    it('should resolve simple key', () => {
      const result = resolveMessage(messages, 'common.title')
      expect(result).toBe('Hello')
    })

    it('should resolve nested key', () => {
      const result = resolveMessage(messages, 'common.nested.deep')
      expect(result).toBe('Deep value')
    })

    it('should return key when not found', () => {
      const result = resolveMessage(messages, 'common.missing')
      expect(result).toBe('common.missing')
    })

    it('should work with namespace', () => {
      const result = resolveMessage(messages, 'title', 'common')
      expect(result).toBe('Hello')
    })
  })

  describe('interpolation', () => {
    it('should interpolate single variable', () => {
      const result = resolveMessage(messages, 'common.greeting', undefined, undefined, { name: 'John' })
      expect(result).toBe('Hello, John!')
    })

    it('should interpolate multiple variables', () => {
      const result = resolveMessage(messages, 'common.multiVar', undefined, undefined, {
        greeting: 'Hi',
        name: 'Jane',
        count: 5
      })
      expect(result).toBe('Hi, Jane! You have 5 messages.')
    })

    it('should keep placeholder when variable is missing', () => {
      const result = resolveMessage(messages, 'common.greeting', undefined, undefined, {})
      expect(result).toBe('Hello, {name}!')
    })

    it('should handle number values', () => {
      const result = resolveMessage(messages, 'common.multiVar', undefined, undefined, {
        greeting: 'Hi',
        name: 'User',
        count: 42
      })
      expect(result).toBe('Hi, User! You have 42 messages.')
    })

    it('should return original string when no vars provided', () => {
      const result = resolveMessage(messages, 'common.greeting')
      expect(result).toBe('Hello, {name}!')
    })

    it('should work with namespace and vars', () => {
      const result = resolveMessage(messages, 'greeting', 'common', undefined, { name: 'World' })
      expect(result).toBe('Hello, World!')
    })
  })
})
