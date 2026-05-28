import { z } from 'zod'

export const inboxSearchSchema = z.object({
  campaign_id: z.string().uuid().optional().catch(undefined),
  send_offer_result: z.enum(['success', 'cancelled', 'failed']).optional(),
})
