import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_brand/billing')({
  beforeLoad: () => {
    throw redirect({ to: '/ajustes/suscripcion' })
  },
})
