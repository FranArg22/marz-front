import { useState } from 'react'
import { t } from '@lingui/core/macro'

import { useGetMyPayoutAccount } from '#/shared/api/generated/creator/creator'

import { PayoutAccountCard } from './PayoutAccountCard'
import { PayoutAccountModal } from './PayoutAccountModal'

export function WalletSection() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isPending } = useGetMyPayoutAccount()

  const account = data?.status === 200 ? data.data.account : null

  return (
    <section className="flex min-h-full flex-col">
      <h1 className="text-2xl font-semibold text-foreground">{t`Billetera`}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t`Cargá una cuenta bancaria de Estados Unidos para recibir pagos vía ACH sin conectar Stripe.`}
      </p>
      <div className="mt-6">
        <PayoutAccountCard
          account={account}
          isLoading={isPending}
          onEdit={() => setModalOpen(true)}
        />
      </div>
      <PayoutAccountModal
        open={modalOpen}
        account={account}
        onOpenChange={setModalOpen}
      />
    </section>
  )
}
