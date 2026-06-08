import type { CreateCampaignRequest } from '#/shared/api/generated/model'
import {
  createCampaignBodyDescriptionMax,
  createCampaignBodyNameMax,
  createCampaignBodyTargetUrlMax,
} from '#/shared/api/generated/zod/campaigns/campaigns'

type CampaignWizardLimitedField = keyof Pick<
  CreateCampaignRequest,
  'name' | 'description' | 'target_url'
>

// The generated CreateCampaignRequest/CreateCampaignBody contract is the
// source of truth for field limits. Keep UI validation and counters wired to
// these generated constants instead of duplicating OpenAPI maxLength values.
export const CAMPAIGN_WIZARD_FIELD_LIMITS = {
  name: createCampaignBodyNameMax,
  description: createCampaignBodyDescriptionMax,
  target_url: createCampaignBodyTargetUrlMax,
} satisfies Record<CampaignWizardLimitedField, number>
