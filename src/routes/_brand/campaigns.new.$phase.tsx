import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const phaseParamSchema = z.object({
  phase: z.enum(['input', 'progress', 'review', 'confirm']),
})

export const Route = createFileRoute('/_brand/campaigns/new/$phase')({
  params: {
    parse: (raw) => phaseParamSchema.parse(raw),
    stringify: (params) => params,
  },
  beforeLoad: ({ params }) => {
    const parsed = phaseParamSchema.safeParse(params)
    if (!parsed.success) {
      throw notFound()
    }

    throw redirect({ to: '/campaigns/new', search: { step: 1 } })
  },
})
