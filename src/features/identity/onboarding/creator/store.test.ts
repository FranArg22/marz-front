import { describe, it, expect, beforeEach } from 'vitest'
import { useCreatorOnboardingStore } from './store'
import { STEPS } from './steps'

const LEGACY_STORAGE_KEY = 'marz-creator-onboarding'
const STORAGE_KEY = 'marz-creator-onboarding:v1'

beforeEach(() => {
  useCreatorOnboardingStore.setState({
    currentStepIndex: 0,
    display_name: undefined,
    handle: undefined,
  })
  sessionStorage.clear()
})

describe('useCreatorOnboardingStore', () => {
  it('starts at index 0', () => {
    expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
  })

  describe('setField', () => {
    it('sets a field value', () => {
      useCreatorOnboardingStore.getState().setField('display_name', 'Ana')
      expect(useCreatorOnboardingStore.getState().display_name).toBe('Ana')
    })

    it('overwrites existing field', () => {
      const { setField } = useCreatorOnboardingStore.getState()
      setField('handle', 'ana_1')
      setField('handle', 'ana_2')
      expect(useCreatorOnboardingStore.getState().handle).toBe('ana_2')
    })

    it('clears field error on setField', () => {
      useCreatorOnboardingStore
        .getState()
        .setFieldErrors({ handle: 'required' })
      useCreatorOnboardingStore.getState().setField('handle', 'test')
      expect(useCreatorOnboardingStore.getState().fieldErrors.handle).toBe(
        undefined,
      )
    })
  })

  describe('goTo', () => {
    it('navigates to a specific index', () => {
      useCreatorOnboardingStore.getState().goTo(5)
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(5)
    })

    it('clamps to 0 for negative indices', () => {
      useCreatorOnboardingStore.getState().goTo(-3)
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
    })

    it('clamps to last step for out-of-range indices', () => {
      useCreatorOnboardingStore.getState().goTo(100)
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(
        STEPS.length - 1,
      )
    })
  })

  describe('reset', () => {
    it('resets currentStepIndex to 0', () => {
      useCreatorOnboardingStore.getState().goTo(7)
      useCreatorOnboardingStore.getState().reset()
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
    })

    it('clears all payload fields', () => {
      useCreatorOnboardingStore.getState().setField('handle', 'test')
      useCreatorOnboardingStore.getState().setField('display_name', 'Test')
      useCreatorOnboardingStore.getState().reset()
      expect(useCreatorOnboardingStore.getState().handle).toBeUndefined()
      expect(useCreatorOnboardingStore.getState().display_name).toBeUndefined()
    })

    it('clears languages and barter_preference', () => {
      useCreatorOnboardingStore.getState().setField('languages', ['es', 'en'])
      useCreatorOnboardingStore.getState().setField('barter_preference', true)
      useCreatorOnboardingStore.getState().reset()
      expect(useCreatorOnboardingStore.getState().languages).toBeUndefined()
      expect(
        useCreatorOnboardingStore.getState().barter_preference,
      ).toBeUndefined()
    })
  })

  describe('languages', () => {
    it('persists languages selection', () => {
      useCreatorOnboardingStore.getState().setField('languages', ['es', 'pt'])
      expect(useCreatorOnboardingStore.getState().languages).toEqual([
        'es',
        'pt',
      ])
    })
  })

  describe('persist to sessionStorage', () => {
    it('persists state after rehydrate', () => {
      useCreatorOnboardingStore.getState().setField('display_name', 'TestUser')
      useCreatorOnboardingStore.getState().goTo(3)

      const stored = sessionStorage.getItem(STORAGE_KEY)
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!) as { state: Record<string, unknown> }
      expect(parsed.state.display_name).toBe('TestUser')
      expect(parsed.state.currentStepIndex).toBe(3)
    })

    it('rehydrates from versioned sessionStorage', () => {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: { currentStepIndex: 5, handle: 'persisted' },
          version: 0,
        }),
      )

      useCreatorOnboardingStore.persist.rehydrate()

      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(5)
      expect(useCreatorOnboardingStore.getState().handle).toBe('persisted')
    })

    it('purges and ignores legacy sessionStorage', () => {
      sessionStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({
          state: { currentStepIndex: 5, handle: 'legacy' },
          version: 0,
        }),
      )

      useCreatorOnboardingStore.persist.rehydrate()

      expect(sessionStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
      expect(useCreatorOnboardingStore.getState().currentStepIndex).toBe(0)
      expect(useCreatorOnboardingStore.getState().handle).toBeUndefined()
    })
  })

  describe('prefillFrom', () => {
    beforeEach(() => {
      useCreatorOnboardingStore.getState().reset()
    })

    it('seeds present fields and skips null/missing ones', () => {
      useCreatorOnboardingStore.getState().prefillFrom({
        handle: 'lucia.fit',
        display_name: 'Lucía',
        niches: ['beauty'],
        country: 'AR',
        gender: null,
      })

      const state = useCreatorOnboardingStore.getState()
      expect(state.handle).toBe('lucia.fit')
      expect(state.display_name).toBe('Lucía')
      expect(state.niches).toEqual(['beauty'])
      expect(state.country).toBe('AR')
      expect(state.gender).toBeUndefined()
      expect(state.prefilled).toBe(true)
    })

    it('does not overwrite the form once prefilled', () => {
      useCreatorOnboardingStore.getState().prefillFrom({ handle: 'first' })
      useCreatorOnboardingStore.getState().setField('handle', 'edited')

      useCreatorOnboardingStore.getState().prefillFrom({ handle: 'second' })

      expect(useCreatorOnboardingStore.getState().handle).toBe('edited')
    })
  })
})
