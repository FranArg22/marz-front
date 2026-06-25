import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../../support/fixtures'
import { installCreatorSettingsMock } from './mock'

test.describe('Creator settings — collaboration', () => {
  test('creator_settings.collaboration.save_creator_kinds', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoCollaborationSettings(page, onboardedCreatorUser)

    const influencerChip = creatorKindChip(page, 'Influencer')
    const ugcChip = creatorKindChip(page, 'UGC')
    const hadBothSelectedAndClean =
      (await isSelected(influencerChip)) &&
      (await isSelected(ugcChip)) &&
      (await saveButton(page).isDisabled())

    if (!(await isSelected(influencerChip))) {
      await influencerChip.click()
    }
    if (!(await isSelected(ugcChip))) {
      await ugcChip.click()
    }
    if (hadBothSelectedAndClean) {
      await ugcChip.click()
    }

    await saveCollaboration(page)
    if (hadBothSelectedAndClean) {
      await ugcChip.click()
      await saveCollaboration(page)
    }
    await expect(saveButton(page)).toBeDisabled()
  })

  test('creator_settings.collaboration.block_empty_creator_kinds', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoCollaborationSettings(page, onboardedCreatorUser)

    const creatorKinds = creatorKindGroup(page).getByRole('checkbox')
    while ((await selectedCount(creatorKinds)) > 1) {
      await (await firstSelectedOption(creatorKinds)).click()
    }

    const lastSelected = await firstSelectedOption(creatorKinds)
    await expect(lastSelected).toBeDisabled()
    await lastSelected.click({ force: true })
    await expect.poll(() => selectedCount(creatorKinds)).toBe(1)
  })

  test('creator_settings.collaboration.edit_niches_content_types', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoCollaborationSettings(page, onboardedCreatorUser)

    const niches = nicheGroup(page).getByRole('checkbox')
    const removedNiche =
      (await selectedCount(niches)) > 1
        ? await removeFirstSelectedOption(niches)
        : null
    await addFirstAvailableOption(niches, removedNiche)

    const contentTypes = contentTypeGroup(page).getByRole('checkbox')
    const removedContentType =
      (await selectedCount(contentTypes)) > 1
        ? await removeFirstSelectedOption(contentTypes)
        : null
    await addFirstAvailableOption(contentTypes, removedContentType)

    await saveCollaboration(page)
    await expect(saveButton(page)).toBeDisabled()
  })

  test('creator_settings.collaboration.block_zero_niche_or_content_type', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoCollaborationSettings(page, onboardedCreatorUser)

    const niches = nicheGroup(page).getByRole('checkbox')
    await reduceToOneSelected(niches)
    const lastNiche = await firstSelectedOption(niches)
    await expect(lastNiche).toBeDisabled()
    await lastNiche.click({ force: true })
    await expect.poll(() => selectedCount(niches)).toBe(1)

    const contentTypes = contentTypeGroup(page).getByRole('checkbox')
    await reduceToOneSelected(contentTypes)
    const lastContentType = await firstSelectedOption(contentTypes)
    await expect(lastContentType).toBeDisabled()
    await lastContentType.click({ force: true })
    await expect.poll(() => selectedCount(contentTypes)).toBe(1)
  })

  test('creator_settings.collaboration.block_sixth_niche', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoCollaborationSettings(page, onboardedCreatorUser)

    const niches = nicheGroup(page).getByRole('checkbox')
    while ((await selectedCount(niches)) < 5) {
      await addFirstAvailableOption(niches)
    }

    await expect(
      fieldHint(page, 'Nichos').filter({ hasText: '5 de 5 seleccionados' }),
    ).toBeVisible()
    await expect.poll(() => selectedCount(niches)).toBe(5)
    await expect.poll(() => optionCount(niches)).toBeGreaterThan(5)
    await expect(await firstUnselectedOption(niches)).toBeDisabled()
  })

  test('creator_settings.collaboration.toggle_barter_preference', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await gotoCollaborationSettings(page, onboardedCreatorUser)

    const barterToggle = page.getByRole('switch', { name: /canjes/i })
    const initiallyChecked = await barterToggle.isChecked()

    await barterToggle.click()
    await saveCollaboration(page)
    await expect(saveButton(page)).toBeDisabled()

    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Colaboraciones' }),
    ).toBeVisible()
    if (initiallyChecked) {
      await expect(
        page.getByRole('switch', { name: /canjes/i }),
      ).not.toBeChecked()
    } else {
      await expect(page.getByRole('switch', { name: /canjes/i })).toBeChecked()
    }

    await page.getByRole('switch', { name: /canjes/i }).click()
    await saveCollaboration(page)
    await expect(saveButton(page)).toBeDisabled()
  })
})

async function gotoCollaborationSettings(
  page: Page,
  user: { signIn(page: Page): Promise<void> },
) {
  await user.signIn(page)
  await installCreatorSettingsMock(page)
  await page.goto('/settings?section=colaboraciones')
  await expect(
    page.getByRole('heading', { name: 'Colaboraciones' }),
  ).toBeVisible()
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: 'Guardar' })
}

async function saveCollaboration(page: Page) {
  const button = saveButton(page)
  await expect(button).toBeEnabled()
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/v1/creators/me/profile/collaboration') &&
        response.request().method() === 'PATCH' &&
        response.status() === 200,
    ),
    button.click(),
  ])
}

function creatorKindGroup(page: Page) {
  return fieldGroup(page, 'Tipo de colaboración')
}

function nicheGroup(page: Page) {
  return fieldGroup(page, 'Nichos')
}

function contentTypeGroup(page: Page) {
  return fieldGroup(page, 'Tipos de contenido')
}

function fieldGroup(page: Page, label: string) {
  return page
    .locator('label', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=parent::div/following-sibling::*[1]')
}

function fieldHint(page: Page, label: string) {
  return page
    .locator('label', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=following-sibling::p[1]')
}

function creatorKindChip(page: Page, name: string) {
  return creatorKindGroup(page).getByRole('checkbox', { name })
}

async function isSelected(locator: Locator) {
  return (await locator.getAttribute('aria-checked')) === 'true'
}

async function selectedCount(chips: Locator) {
  let count = 0
  const options = await chips.all()
  for (const option of options) {
    if (await isSelected(option)) count += 1
  }
  return count
}

async function optionCount(chips: Locator) {
  return await chips.count()
}

async function addFirstAvailableOption(
  chips: Locator,
  exceptLabel: string | null = null,
) {
  await expect
    .poll(() => availableOptionCount(chips, exceptLabel))
    .toBeGreaterThan(0)

  const options = await chips.all()
  for (const option of options) {
    if ((await isSelected(option)) || (await option.isDisabled())) continue
    if (exceptLabel && (await option.innerText()).trim() === exceptLabel) {
      continue
    }
    await option.click()
    return
  }
  throw new Error('No unselected enabled option is available')
}

async function availableOptionCount(
  chips: Locator,
  exceptLabel: string | null = null,
) {
  let count = 0
  const options = await chips.all()
  for (const option of options) {
    if ((await isSelected(option)) || (await option.isDisabled())) continue
    if (exceptLabel && (await option.innerText()).trim() === exceptLabel) {
      continue
    }
    count += 1
  }
  return count
}

async function removeFirstSelectedOption(chips: Locator) {
  const selected = await firstSelectedOption(chips)
  const label = (await selected.innerText()).trim()
  await selected.click()
  return label
}

async function reduceToOneSelected(chips: Locator) {
  while ((await selectedCount(chips)) > 1) {
    await (await firstSelectedOption(chips)).click()
  }
}

async function firstSelectedOption(chips: Locator) {
  const options = await chips.all()
  for (const option of options) {
    if (await isSelected(option)) return option
  }
  throw new Error('No selected option is available')
}

async function firstUnselectedOption(chips: Locator) {
  const options = await chips.all()
  for (const option of options) {
    if (!(await isSelected(option))) return option
  }
  throw new Error('No unselected option is available')
}
