import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import {
  getGetAnalyticsDashboardOnboardingChecklistQueryKey,
} from '#/shared/api/generated/analytics/analytics'
import {
  createCampaign,
  createCampaignBriefPDFUploadPresign,
  createCampaignImageUploadPresign,
  updateCampaign,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  createCampaignBriefPDFUploadPresignResponse,
  createCampaignImageUploadPresignResponse,
  createCampaignResponse,
  updateCampaignResponse,
} from '#/shared/api/generated/campaigns/campaigns'
import type {
  CampaignPresignResponse,
  CreateCampaignRequest,
} from '#/shared/api/generated/model'

import {
  uploadToS3,
  useCreateCampaignMutation,
  usePresignBriefPdfMutation,
  usePresignImageMutation,
  useUpdateCampaignMutation,
} from './mutations'

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  createCampaign: vi.fn(),
  createCampaignBriefPDFUploadPresign: vi.fn(),
  createCampaignImageUploadPresign: vi.fn(),
  updateCampaign: vi.fn(),
}))

const mockCreateCampaign = vi.mocked(createCampaign)
const mockUpdateCampaign = vi.mocked(updateCampaign)
const mockCreateCampaignImageUploadPresign = vi.mocked(
  createCampaignImageUploadPresign,
)
const mockCreateCampaignBriefPDFUploadPresign = vi.mocked(
  createCampaignBriefPDFUploadPresign,
)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('campaign wizard mutation wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    mockCreateCampaign.mockResolvedValue({
      status: 201,
      data: { id: 'campaign-1' },
    } as createCampaignResponse)
    mockUpdateCampaign.mockResolvedValue({
      status: 200,
      data: { id: 'campaign-1' },
    } as updateCampaignResponse)
  })

  it('wraps create campaign and forwards optional If-Match through request headers', async () => {
    const { result } = renderHook(() => useCreateCampaignMutation(), {
      wrapper: createWrapper(createQueryClient()),
    })

    result.current.mutate({
      ifMatch: 'v1',
      data: createCampaignRequest(),
    })

    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalledWith(
        createCampaignRequest(),
        {
          headers: {
            'If-Match': 'v1',
            'Idempotency-Key': expect.any(String) as string,
          },
        },
      )
    })
  })

  it('invalidates the onboarding checklist after creating a campaign', async () => {
    const queryClient = createQueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateCampaignMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      ifMatch: 'v1',
      data: createCampaignRequest(),
    })

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: getGetAnalyticsDashboardOnboardingChecklistQueryKey(),
      })
    })
  })

  it('wraps update campaign and injects required If-Match through request headers', async () => {
    const { result } = renderHook(() => useUpdateCampaignMutation(), {
      wrapper: createWrapper(createQueryClient()),
    })

    result.current.mutate({
      campaignId: 'campaign-1',
      ifMatch: 'v7',
      data: { name: 'Updated name' },
    })

    await waitFor(() => {
      expect(mockUpdateCampaign).toHaveBeenCalledWith(
        'campaign-1',
        { name: 'Updated name' },
        {
          headers: {
            'If-Match': 'v7',
            'Idempotency-Key': expect.any(String) as string,
          },
        },
      )
    })
  })

  it('uploads a file to a presigned S3 URL with required headers', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const presign = createPresignResponse()

    await uploadToS3(file, presign)

    expect(fetchMock).toHaveBeenCalledWith(presign.upload_url, {
      method: 'PUT',
      headers: presign.required_headers,
      body: file,
    })
  })

  it('presigns and uploads campaign images', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    const presign = createPresignResponse()
    mockCreateCampaignImageUploadPresign.mockResolvedValue({
      status: 200,
      data: presign,
      headers: new Headers(),
    } as createCampaignImageUploadPresignResponse)
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const { result } = renderHook(() => usePresignImageMutation(), {
      wrapper: createWrapper(createQueryClient()),
    })

    result.current.mutate({ file })

    await waitFor(() => {
      expect(mockCreateCampaignImageUploadPresign).toHaveBeenCalledWith(
        {
          content_type: 'image/png',
          size_bytes: file.size,
        },
        {
          headers: { 'Idempotency-Key': expect.any(String) as string },
        },
      )
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  it('presigns and uploads campaign brief PDFs', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    const presign = createPresignResponse({ s3_key: 'tmp/campaigns/1/brief.pdf' })
    mockCreateCampaignBriefPDFUploadPresign.mockResolvedValue({
      status: 200,
      data: presign,
      headers: new Headers(),
    } as createCampaignBriefPDFUploadPresignResponse)
    const file = new File(['pdf'], 'brief.pdf', { type: 'application/pdf' })
    const { result } = renderHook(() => usePresignBriefPdfMutation(), {
      wrapper: createWrapper(createQueryClient()),
    })

    result.current.mutate({ file })

    await waitFor(() => {
      expect(mockCreateCampaignBriefPDFUploadPresign).toHaveBeenCalledWith(
        {
          content_type: 'application/pdf',
          size_bytes: file.size,
        },
        {
          headers: { 'Idempotency-Key': expect.any(String) as string },
        },
      )
      expect(fetchMock).toHaveBeenCalled()
    })
  })
})

function createCampaignRequest(): CreateCampaignRequest {
  return {
    content_type: 'influencer_posts',
    pricing_model: 'pay_per_post',
    name: 'Campaign',
    description: 'Description',
    target_url: 'https://example.com',
    image_s3_key: '',
    platforms: ['instagram'],
    interests: ['beauty'],
    creator_country: 'AR',
    min_creator_tier_slug: 'micro',
    compensation_type: 'payment',
    compensation_notes: null,
    video_reuse_permission_default: false,
    content_guidelines: 'Guidelines',
    brief_pdf_s3_key: null,
  }
}

function createPresignResponse(
  overrides: Partial<CampaignPresignResponse> = {},
): CampaignPresignResponse {
  return {
    upload_url: 'https://s3.example/upload',
    s3_key: 'tmp/campaigns/1/image.png',
    expires_in: 900,
    required_headers: { 'content-type': 'image/png' },
    max_bytes: 5_242_880,
    ...overrides,
  }
}
