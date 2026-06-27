import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CampaignPromptHelp } from './CampaignPromptHelp'
import { CAMPAIGN_PROMPT_TEXT } from './campaignPromptText'

const SEEN_STORAGE_KEY = 'marz_campaign_prompt_seen'

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  return writeText
}

describe('CampaignPromptHelp', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens automatically the first time and persists the seen flag', async () => {
    render(<CampaignPromptHelp />)

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /armar tu campaña/i }),
      ).toBeInTheDocument()
    })
    expect(localStorage.getItem(SEEN_STORAGE_KEY)).toBe('true')
  })

  it('does not auto-open once seen, but reopens from the button', async () => {
    localStorage.setItem(SEEN_STORAGE_KEY, 'true')
    const user = userEvent.setup()
    render(<CampaignPromptHelp />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ayuda con IA/i }))

    expect(
      screen.getByRole('dialog', { name: /armar tu campaña/i }),
    ).toBeInTheDocument()
  })

  it('copies the prompt and shows copied feedback', async () => {
    localStorage.setItem(SEEN_STORAGE_KEY, 'true')
    const user = userEvent.setup()
    // Definir después de setup() para que el spy gane sobre el clipboard que
    // instala userEvent.
    const writeText = mockClipboard()
    render(<CampaignPromptHelp />)

    await user.click(screen.getByRole('button', { name: /Ayuda con IA/i }))
    await user.click(screen.getByRole('button', { name: /Copiar prompt/i }))

    expect(writeText).toHaveBeenCalledWith(CAMPAIGN_PROMPT_TEXT)
    expect(
      await screen.findByRole('button', { name: /Copiado/i }),
    ).toBeInTheDocument()
  })
})
