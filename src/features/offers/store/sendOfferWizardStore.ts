import { create } from 'zustand'

import type {
  CreateOfferFormValues,
  OfferBonusTermsFormValues,
} from '../schemas/createOffer'

export type SendOfferWizardMode = 'same_content' | 'per_platform'

export type SendOfferWizardState = {
  mode: SendOfferWizardMode
  sameContent: Partial<CreateOfferFormValues>
  perPlatform: Partial<CreateOfferFormValues>
  bonusesEnabledGlobal: boolean
  bonusesSnapshot: OfferBonusTermsFormValues | null
  setMode: (mode: SendOfferWizardMode) => void
  patchSameContent: (patch: Partial<CreateOfferFormValues>) => void
  patchPerPlatform: (patch: Partial<CreateOfferFormValues>) => void
  setBonusesEnabledGlobal: (enabled: boolean) => void
  setBonusesSnapshot: (snapshot: OfferBonusTermsFormValues | null) => void
  reset: () => void
}

const getInitialState = () => ({
  mode: 'same_content' as const,
  sameContent: {},
  perPlatform: {},
  bonusesEnabledGlobal: false,
  bonusesSnapshot: null,
})

function mergeCreateOfferDraft(
  current: Partial<CreateOfferFormValues>,
  patch: Partial<CreateOfferFormValues>,
) {
  return { ...current, ...patch }
}

export const useSendOfferWizard = create<SendOfferWizardState>()((set) => ({
  ...getInitialState(),
  setMode: (mode) => set({ mode }),
  patchSameContent: (patch) =>
    set((state) => ({
      sameContent: mergeCreateOfferDraft(state.sameContent, patch),
    })),
  patchPerPlatform: (patch) =>
    set((state) => ({
      perPlatform: mergeCreateOfferDraft(state.perPlatform, patch),
    })),
  setBonusesEnabledGlobal: (enabled) => set({ bonusesEnabledGlobal: enabled }),
  setBonusesSnapshot: (snapshot) => set({ bonusesSnapshot: snapshot }),
  reset: () => set(getInitialState()),
}))
