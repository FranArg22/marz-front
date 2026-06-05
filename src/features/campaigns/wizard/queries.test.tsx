import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import {
  useGetCampaignQuota,
  useGetDiscoveryCreatorCount,
} from '#/shared/api/generated/brand/brand'
import {
  useListCountries,
  useListCreatorTiers,
  useListInterests,
} from '#/shared/api/generated/lookups/lookups'

import {
  toCreatorCountParams,
  useCampaignQuotaQuery,
  useCountriesQuery,
  useCreatorCountQuery,
  useCreatorTiersQuery,
  useInterestsQuery,
} from './queries'

vi.mock('#/shared/api/generated/brand/brand', () => ({
  useGetCampaignQuota: vi.fn(() => ({ data: undefined, queryKey: [] })),
  useGetDiscoveryCreatorCount: vi.fn(() => ({
    data: undefined,
    queryKey: [],
  })),
}))

vi.mock('#/shared/api/generated/lookups/lookups', () => ({
  useListCountries: vi.fn(() => ({ data: undefined, queryKey: [] })),
  useListCreatorTiers: vi.fn(() => ({ data: undefined, queryKey: [] })),
  useListInterests: vi.fn(() => ({ data: undefined, queryKey: [] })),
}))

const mockUseGetCampaignQuota = vi.mocked(useGetCampaignQuota)
const mockUseGetDiscoveryCreatorCount = vi.mocked(useGetDiscoveryCreatorCount)
const mockUseListCountries = vi.mocked(useListCountries)
const mockUseListCreatorTiers = vi.mocked(useListCreatorTiers)
const mockUseListInterests = vi.mocked(useListInterests)

describe('campaign wizard query wrappers', () => {
  it('wraps campaign quota from brand/brand.ts and disables missing workspace id', () => {
    renderHook(() => useCampaignQuotaQuery(null))

    expect(mockUseGetCampaignQuota).toHaveBeenCalledWith('', {
      request: undefined,
      query: { enabled: false },
    })
  })

  it('wraps lookups through generated lookup hooks', () => {
    renderHook(() => useInterestsQuery())
    renderHook(() => useCountriesQuery({ active: true }))
    renderHook(() => useCreatorTiersQuery())

    expect(mockUseListInterests).toHaveBeenCalledWith(undefined)
    expect(mockUseListCountries).toHaveBeenCalledWith(
      { active: true },
      undefined,
    )
    expect(mockUseListCreatorTiers).toHaveBeenCalledWith(undefined)
  })

  it('maps store creator_country to API country for creator count', () => {
    expect(
      toCreatorCountParams({
        platforms: ['instagram', 'tiktok'],
        interests: ['beauty'],
        creator_country: 'AR',
        min_creator_tier_slug: 'micro',
      }),
    ).toEqual({
      platforms: ['instagram', 'tiktok'],
      interests: ['beauty'],
      country: 'AR',
      min_creator_tier_slug: 'micro',
    })
  })

  it('wraps creator count from brand/brand.ts and disables incomplete filters', () => {
    renderHook(() =>
      useCreatorCountQuery({
        platforms: [],
        interests: ['beauty'],
        creator_country: 'AR',
        min_creator_tier_slug: 'micro',
      }),
    )

    expect(mockUseGetDiscoveryCreatorCount).toHaveBeenCalledWith(
      {
        platforms: ['instagram'],
        interests: ['disabled'],
        country: 'AR',
        min_creator_tier_slug: 'disabled',
      },
      {
        request: undefined,
        query: { enabled: false },
      },
    )
  })
})
