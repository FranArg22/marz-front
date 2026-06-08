import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTrackedEvents, resetTrackedEvents } from '#/shared/analytics/track'
import { BriefPdfDropzone } from './BriefPdfDropzone'
import { useCampaignWizardStore } from './store'

const mutationMock = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}))

vi.mock('./mutations', () => ({
  usePresignBriefPdfMutation: () => ({
    isPending: false,
    mutateAsync: mutationMock.mutateAsync,
  }),
}))

const originalActions = {
  setStep1: useCampaignWizardStore.getState().setStep1,
  setStep2: useCampaignWizardStore.getState().setStep2,
  setStep3: useCampaignWizardStore.getState().setStep3,
  setStep4: useCampaignWizardStore.getState().setStep4,
  setStep5: useCampaignWizardStore.getState().setStep5,
  setStep6: useCampaignWizardStore.getState().setStep6,
  markStepCompleted: useCampaignWizardStore.getState().markStepCompleted,
  canAccessStep: useCampaignWizardStore.getState().canAccessStep,
  reset: useCampaignWizardStore.getState().reset,
}

function resetStore() {
  useCampaignWizardStore.setState({
    step1: { content_type: null },
    step2: { pricing_model: null },
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
    ...originalActions,
  })
}

describe('BriefPdfDropzone', () => {
  beforeEach(() => {
    resetStore()
    resetTrackedEvents()
    mutationMock.mutateAsync.mockReset()
    mutationMock.mutateAsync.mockResolvedValue({
      upload_url: 'https://s3.example/upload',
      s3_key: 'tmp/campaigns/1/brief.pdf',
      expires_in: 900,
      required_headers: { 'content-type': 'application/pdf' },
      max_bytes: 10 * 1024 * 1024,
    })
  })

  it('rejects non-PDF files with an inline error', async () => {
    render(<BriefPdfDropzone />)

    fireEvent.change(screen.getByLabelText('PDF del brief'), {
      target: {
        files: [new File(['image'], 'image.png', { type: 'image/png' })],
      },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo podés subir un archivo PDF.',
    )
    expect(mutationMock.mutateAsync).not.toHaveBeenCalled()
    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_pdf_rejected',
        payload: { reason: 'type' },
      }),
    ])
  })

  it('rejects PDFs over 10 MB with an inline error', async () => {
    render(<BriefPdfDropzone />)

    fireEvent.change(screen.getByLabelText('PDF del brief'), {
      target: {
        files: [
          new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'brief.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El PDF no puede superar los 10 MB.',
    )
    expect(mutationMock.mutateAsync).not.toHaveBeenCalled()
    expect(getTrackedEvents()).toEqual([
      expect.objectContaining({
        event: 'campaign_wizard_pdf_rejected',
        payload: { reason: 'size' },
      }),
    ])
  })

  it('stores the S3 key after a valid PDF upload', async () => {
    render(<BriefPdfDropzone />)
    const file = new File(['pdf'], 'brief.pdf', { type: 'application/pdf' })

    fireEvent.change(screen.getByLabelText('PDF del brief'), {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(useCampaignWizardStore.getState().step6).toMatchObject({
        briefPdfFile: file,
        briefPdfS3Key: 'tmp/campaigns/1/brief.pdf',
      })
    })
    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
  })

  it('shows an inline error when the upload fails', async () => {
    mutationMock.mutateAsync.mockRejectedValue(new Error('network failed'))
    render(<BriefPdfDropzone />)

    fireEvent.change(screen.getByLabelText('PDF del brief'), {
      target: {
        files: [
          new File(['pdf'], 'brief.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos subir el PDF. Intentá de nuevo.',
    )
    expect(useCampaignWizardStore.getState().step6).toMatchObject({
      briefPdfFile: null,
      briefPdfS3Key: null,
    })
  })

  it('clears the PDF from the store and returns to the empty state', async () => {
    useCampaignWizardStore.setState({
      step6: {
        content_guidelines: '',
        briefPdfFile: new File(['pdf'], 'brief.pdf', {
          type: 'application/pdf',
        }),
        briefPdfS3Key: 'tmp/campaigns/1/brief.pdf',
      },
    })
    render(<BriefPdfDropzone />)

    await userEvent.click(screen.getByRole('button', { name: /Eliminar/ }))

    expect(useCampaignWizardStore.getState().step6).toMatchObject({
      briefPdfFile: null,
      briefPdfS3Key: null,
    })
    expect(screen.getByText('Subí el PDF del brief')).toBeInTheDocument()
  })
})
