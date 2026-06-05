import { useMutation } from '@tanstack/react-query'

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
  CampaignBriefPDFPresignRequestContentType,
  CampaignImagePresignRequestContentType,
  CampaignPresignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest
} from '#/shared/api/generated/model'

export type CreateCampaignMutationVariables = {
  data: CreateCampaignRequest
  ifMatch?: string
}

export type UpdateCampaignMutationVariables = {
  campaignId: string
  data: UpdateCampaignRequest
  ifMatch: string
}

export type PresignUploadVariables = {
  file: File
}

export function useCreateCampaignMutation() {
  return useMutation<
    createCampaignResponse,
    Error,
    CreateCampaignMutationVariables
  >({
    mutationKey: ['campaign-wizard', 'create-campaign'],
    mutationFn: ({ data, ifMatch }) =>
      createCampaign(data, {
        headers: buildIfMatchHeaders(ifMatch),
      }),
  })
}

export function useUpdateCampaignMutation() {
  return useMutation<
    updateCampaignResponse,
    Error,
    UpdateCampaignMutationVariables
  >({
    mutationKey: ['campaign-wizard', 'update-campaign'],
    mutationFn: ({ campaignId, data, ifMatch }) =>
      updateCampaign(campaignId, data, {
        headers: buildIfMatchHeaders(ifMatch),
      }),
  })
}

export function usePresignImageMutation() {
  return useMutation<CampaignPresignResponse, Error, PresignUploadVariables>({
    mutationKey: ['campaign-wizard', 'presign-image'],
    mutationFn: async ({ file }) => {
      const response = await createCampaignImageUploadPresign({
        content_type: file.type as CampaignImagePresignRequestContentType,
        size_bytes: file.size,
      })

      return uploadFromPresign(file, response)
    },
  })
}

export function usePresignBriefPdfMutation() {
  return useMutation<CampaignPresignResponse, Error, PresignUploadVariables>({
    mutationKey: ['campaign-wizard', 'presign-brief-pdf'],
    mutationFn: async ({ file }) => {
      const response = await createCampaignBriefPDFUploadPresign({
        content_type: file.type as CampaignBriefPDFPresignRequestContentType,
        size_bytes: file.size,
      })

      return uploadFromPresign(file, response)
    },
  })
}

export async function uploadToS3(
  file: File,
  presign: CampaignPresignResponse,
): Promise<void> {
  const response = await fetch(presign.upload_url, {
    method: 'PUT',
    headers: presign.required_headers,
    body: file,
  })

  if (!response.ok) {
    throw new Error('campaign.upload_failed')
  }
}

function buildIfMatchHeaders(ifMatch: string | undefined) {
  return ifMatch ? { 'If-Match': ifMatch } : undefined
}

async function uploadFromPresign(
  file: File,
  response:
    | createCampaignImageUploadPresignResponse
    | createCampaignBriefPDFUploadPresignResponse,
) {
  if (response.status !== 200) {
    throw new Error(response.data.error.message)
  }

  await uploadToS3(file, response.data)

  return response.data
}
