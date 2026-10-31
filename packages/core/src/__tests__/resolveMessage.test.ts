import { afterEach, describe, expect, it, vi } from 'vitest'
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

    it('keeps the placeholder of a name that the vars only inherit', () => {
      const inherited = { text: '{constructor} {toString} {hasOwnProperty} {valueOf} {name}' }
      expect(resolveMessage(inherited, 'text', undefined, undefined, { name: 'User' }))
        .toBe('{constructor} {toString} {hasOwnProperty} {valueOf} User')
      expect(resolveMessage(inherited, 'text', undefined, undefined, {}))
        .toBe('{constructor} {toString} {hasOwnProperty} {valueOf} {name}')
    })

    it('interpolates own vars with the names of inherited properties', () => {
      const inherited = { text: '{constructor} {toString}' }
      expect(resolveMessage(inherited, 'text', undefined, undefined, { constructor: 'C', toString: 0 }))
        .toBe('C 0')
      const withoutPrototype = Object.assign(Object.create(null) as Record<string, string>, { constructor: 'C' })
      expect(resolveMessage(inherited, 'text', undefined, undefined, withoutPrototype)).toBe('C {toString}')
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

  describe('warnings in development', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.restoreAllMocks()
    })

    it('warns for a missing key and for a key that points to an object', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(resolveMessage(messages, 'common.missing', undefined, 'en')).toBe('common.missing')
      expect(resolveMessage(messages, 'nested', 'common', 'en')).toBe('common.nested')
      expect(warn.mock.calls).toEqual([
        ['[i18n] Missing key: "common.missing" in locale "en"'],
        ['[i18n] Key "common.nested" points to an object in locale "en". Returning key instead.']
      ])
    })

    it('does not warn in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(resolveMessage(messages, 'common.missing', undefined, 'en')).toBe('common.missing')
      expect(resolveMessage(messages, 'common', undefined, 'en')).toBe('common')
      expect(warn).not.toHaveBeenCalled()
    })

    it('returns the key without a warning where there is no process', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'process')!
      const results: string[] = []
      // As in a runtime without process, where reading it throws a ReferenceError
      delete (globalThis as { process?: unknown }).process
      try {
        results.push(resolveMessage(messages, 'common.missing', undefined, 'en'))
        results.push(resolveMessage(messages, 'common', undefined, 'en'))
        results.push(resolveMessage(messages, 'common.greeting', undefined, 'en', { name: 'John' }))
      } finally {
        Object.defineProperty(globalThis, 'process', descriptor)
      }
      expect(results).toEqual(['common.missing', 'common', 'Hello, John!'])
      expect(warn).not.toHaveBeenCalled()
    })
  })
})
