import { useNavigate } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'

import { trackConversationFilterChanged } from './analytics'
import type { BrandWorkspaceSearch } from './workspaceSearchSchema'

type FilterValue = BrandWorkspaceSearch['filter']

interface ConversationFilterTabsProps {
  value: FilterValue
}

const TABS: { value: FilterValue; label: () => string }[] = [
  { value: 'all', label: () => t`Todas` },
  { value: 'unread', label: () => t`Sin leer` },
  { value: 'needs_reply', label: () => t`Por responder` },
]

export function ConversationFilterTabs({ value }: ConversationFilterTabsProps) {
  const navigate = useNavigate({ from: '/workspace' })

  function handleSelect(filter: FilterValue) {
    if (filter === value) return
    trackConversationFilterChanged({ filter })
    void navigate({
      to: '.',
      unsafeRelative: 'path',
      search: (prev) => ({
        ...prev,
        filter: filter === 'all' ? undefined : filter,
      }),
      replace: true,
    })
  }

  return (
    <div
      role="tablist"
      aria-label={t`Filtrar conversaciones`}
      className="flex gap-2"
    >
      {TABS.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => handleSelect(tab.value)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              selected
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-muted'
            }`}
          >
            {tab.label()}
          </button>
        )
      })}
    </div>
  )
}
