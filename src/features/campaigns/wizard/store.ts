import { create } from 'zustand'

import type { CampaignCompensationType } from '#/shared/api/generated/model/campaignCompensationType'

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube'

export type CampaignWizardState = {
  step1: { content_type: 'influencer_posts' | null }
  step2: { pricing_model: 'pay_per_post' | null }
  step3: {
    name: string
    description: string
    target_url: string
    imageFile: File | null
    imageBlobUrl: string | null
    imageS3Key: string | null
  }
  step4: {
    platforms: SocialPlatform[]
    interests: string[]
    creator_country: string | null
    min_creator_tier_slug: string | null
  }
  step5: {
    compensation_type: CampaignCompensationType | null
    compensation_notes: string
    video_reuse_permission_default: boolean
  }
  step6: {
    content_guidelines: string
    briefPdfFile: File | null
    briefPdfS3Key: string | null
  }
  completedSteps: number[]
  isDirty: boolean
  setStep1: (v: CampaignWizardState['step1']) => void
  setStep2: (v: CampaignWizardState['step2']) => void
  setStep3: (v: Partial<CampaignWizardState['step3']>) => void
  setStep4: (v: Partial<CampaignWizardState['step4']>) => void
  setStep5: (v: Partial<CampaignWizardState['step5']>) => void
  setStep6: (v: Partial<CampaignWizardState['step6']>) => void
  markStepCompleted: (step: number) => void
  canAccessStep: (step: number) => boolean
  reset: () => void
}

type CampaignWizardData = Omit<
  CampaignWizardState,
  | 'setStep1'
  | 'setStep2'
  | 'setStep3'
  | 'setStep4'
  | 'setStep5'
  | 'setStep6'
  | 'markStepCompleted'
  | 'canAccessStep'
  | 'reset'
>

function createInitialState(): CampaignWizardData {
  return {
    // Única opción habilitada en MVP => preseleccionada (UGC/CPM: Próximamente).
    step1: { content_type: 'influencer_posts' },
    step2: { pricing_model: 'pay_per_post' },
    step3: {
      name: '',
      description: '',
      target_url: '',
      imageFile: null,
      imageBlobUrl: null,
      imageS3Key: null,
    },
    step4: {
      platforms: [],
      interests: [],
      creator_country: null,
      min_creator_tier_slug: null,
    },
    step5: {
      compensation_type: null,
      compensation_notes: '',
      video_reuse_permission_default: false,
    },
    step6: {
      content_guidelines: '',
      briefPdfFile: null,
      briefPdfS3Key: null,
    },
    completedSteps: [],
    isDirty: false,
  }
}

export const useCampaignWizardStore = create<CampaignWizardState>()(
  (set, get) => ({
    ...createInitialState(),
    setStep1: (step1) => set({ step1, isDirty: true }),
    setStep2: (step2) => set({ step2, isDirty: true }),
    setStep3: (step3) =>
      set((state) => ({
        step3: { ...state.step3, ...step3 },
        isDirty: true,
      })),
    setStep4: (step4) =>
      set((state) => ({
        step4: { ...state.step4, ...step4 },
        isDirty: true,
      })),
    setStep5: (step5) =>
      set((state) => ({
        step5: { ...state.step5, ...step5 },
        isDirty: true,
      })),
    setStep6: (step6) =>
      set((state) => ({
        step6: { ...state.step6, ...step6 },
        isDirty: true,
      })),
    markStepCompleted: (step) =>
      set((state) => ({
        completedSteps: state.completedSteps.includes(step)
          ? state.completedSteps
          : [...state.completedSteps, step].sort((a, b) => a - b),
        isDirty: true,
      })),
    canAccessStep: (step) =>
      step === 1 || get().completedSteps.includes(step - 1),
    reset: () => {
      const { imageBlobUrl } = get().step3
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl)
      }
      set(createInitialState())
    },
  }),
)
