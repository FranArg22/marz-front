import { test, expect } from '../../support/fixtures'
import {
  gotoCreatorCampaignBoard,
  installCampaignBoardMocks,
} from '../../support/campaign-board-mocks'
import { CreatorCampaignBoard } from '../../poms/campaigns/creator-board.pom'

test.describe('creator campaign board', () => {
  test('creator completes board discovery, filtering, brief and application flow with manual multi-tab refresh', async ({
    context,
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    const campaignBoardMocks = await installCampaignBoardMocks(context)

    await gotoCreatorCampaignBoard(page)

    const board = new CreatorCampaignBoard(page)
    await expect(board.heading).toBeVisible()
    await expect(page.getByText('4 campañas')).toBeVisible()
    await expect(board.campaignCard('Glow Lab Routine')).toBeVisible()
    await expect(board.campaignCard('Aura Skin Serum Launch')).toBeVisible()
    await expect(board.campaignCard('Fit Fuel Creators')).toBeVisible()
    await expect(board.campaignCard('Urban Coffee Morning')).toBeVisible()

    await board.openCategoryFilter('Beauty')
    await expect(page).toHaveURL(/niches=.*beauty/)
    await expect(page.getByText('2 campañas')).toBeVisible()
    await expect(board.campaignCard('Glow Lab Routine')).toBeVisible()
    await expect(board.campaignCard('Aura Skin Serum Launch')).toBeVisible()
    await expect(board.campaignCard('Fit Fuel Creators')).toBeHidden()

    await board.openInterestFilter('Skincare')
    await expect(page).toHaveURL(/niches=.*beauty/)
    await expect(page).toHaveURL(/interests=.*skincare/)
    await expect(page.getByText('2 filtros activos')).toBeVisible()
    await expect(board.campaignCard('Glow Lab Routine')).toBeVisible()
    await expect(board.campaignCard('Aura Skin Serum Launch')).toBeVisible()

    await board.sortBy('Fee más alto')
    await expect(page).toHaveURL(/sort=fee_desc/)
    await expect(
      page.getByRole('heading', {
        name: /Aura Skin Serum Launch|Glow Lab Routine/,
      }),
    ).toHaveText(['Aura Skin Serum Launch', 'Glow Lab Routine'])

    const secondPage = await context.newPage()
    await secondPage.goto(
      '/discover/campaigns?niches=beauty&interests=skincare&sort=fee_desc',
    )
    const secondBoard = new CreatorCampaignBoard(secondPage)
    const secondPageAuraCard = secondBoard.campaignCard('Aura Skin Serum Launch')
    await expect(secondPageAuraCard).toBeVisible()
    await expect(
      secondPageAuraCard.getByRole('button', { name: 'Postularme' }),
    ).toBeVisible()

    const auraCard = board.campaignCard('Aura Skin Serum Launch')
    await board.openBrief(auraCard)
    await expect(page.getByText('Reseña honesta del serum Aura')).toBeVisible()
    await board.closeBrief()

    await board.apply(
      auraCard,
      'Me interesa participar porque mi audiencia busca skincare.',
    )
    await board.expectAppliedBadge(auraCard)

    await secondPage.bringToFront()
    await expect(
      secondPageAuraCard.getByRole('button', { name: 'Postularme' }),
    ).toBeVisible()

    campaignBoardMocks.publishSubmittedApplicationToReadModel()
    await secondPage.getByRole('button', { name: 'Actualizar' }).click()

    await secondBoard.expectAppliedBadge(secondPageAuraCard)

    await secondPage.close()
  })

  test('brand-authenticated user does not see the creator campaign board', async ({
    context,
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await installCampaignBoardMocks(context)

    await page.goto('/campaigns')

    await expect(page).toHaveURL(/\/campaigns/)
    await expect(
      page.getByRole('heading', { name: 'Campañas abiertas' }),
    ).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Nueva campaña/i }),
    ).toBeVisible()
  })
})
