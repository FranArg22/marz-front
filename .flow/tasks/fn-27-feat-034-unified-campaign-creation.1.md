---
satisfies: [R1]
---

# fn-27-feat-034-unified-campaign-creation.1 F.1 — Store Zustand + ruta /campaigns/new

## Description

Crear el store Zustand del wizard y reescribir `campaigns.new.tsx` para montar el nuevo wizard de 7 pasos (reemplaza el `BriefBuilderWizard` legacy que hoy vive ahí).

**Size:** M

**Archivos a crear/modificar:**

- `src/features/campaigns/wizard/store.ts` (nuevo)
- `src/features/campaigns/wizard/store.test.ts` (nuevo)
- `src/routes/_brand/campaigns.new.tsx` (modificar: reemplazar BriefBuilderWizard por WizardLayout + nuevo wizard)
- `src/routes/_brand/campaigns.new.index.tsx` (modificar: redirigir a `?step=1` en lugar del `$phase` slug)

## Approach

**Store Zustand (`src/features/campaigns/wizard/store.ts`):**

```ts
type SocialPlatform = 'tiktok' | 'instagram' | 'youtube'

type CampaignWizardState = {
  step1: { content_type: 'influencer_posts' | null }
  step2: { pricing_model: 'pay_per_post' | null }
  step3: {
    name: string
    description: string
    target_url: string
    imageFile: File | null
    imageBlobUrl: string | null   // URL.createObjectURL — revocar en reset()
    imageS3Key: string | null     // key devuelta por presign, post-upload
  }
  step4: {
    platforms: SocialPlatform[]
    interests: string[]
    creator_country: string | null
    min_creator_tier_slug: string | null
  }
  step5: {
    compensation_type: 'payment' | null
    compensation_notes: string
    video_reuse_permission_default: boolean
  }
  step6: {
    content_guidelines: string
    briefPdfFile: File | null
    briefPdfS3Key: string | null  // key devuelta por presign, post-upload
  }
  completedSteps: number[]
  isDirty: boolean
  // actions
  setStep1: (v: CampaignWizardState['step1']) => void
  setStep2: (v: CampaignWizardState['step2']) => void
  setStep3: (v: Partial<CampaignWizardState['step3']>) => void
  setStep4: (v: Partial<CampaignWizardState['step4']>) => void
  setStep5: (v: Partial<CampaignWizardState['step5']>) => void
  setStep6: (v: Partial<CampaignWizardState['step6']>) => void
  markStepCompleted: (step: number) => void
  canAccessStep: (step: number) => boolean
  reset: () => void
}
```

- `canAccessStep(n)`: true si n === 1, o si n-1 está en `completedSteps`.
- `reset()`: llama `URL.revokeObjectURL(step3.imageBlobUrl)` si existe, luego resetea todo el state a initial values.
- **No usar `persist`** de zustand (el store se limpia al salir; no hay resume de wizard entre sesiones).

**Ruta `campaigns.new.tsx`:**

- Reescribir para montar `<WizardLayout />` (componente a crear en F.3+). Mientras tanto puede renderizar un placeholder `<div>Wizard próximamente</div>`.
- Mantener el `WizardTopbar` existente con `stepLabel` derivado del search param `step`.
- `validateSearch`: `z.object({ step: z.number().int().min(1).max(7).default(1) })`.
- `beforeLoad`: si `search.step > 1 && !useCampaignWizardStore.getState().canAccessStep(search.step)`, `throw redirect({ to: '/campaigns/new', search: { step: 1 } })`.

**Ruta `campaigns.new.index.tsx`:**

- Cambiar redirect para usar search param: `throw redirect({ to: '/campaigns/new', search: { step: 1 } })` en lugar del antiguo `$phase` slug.

**Nota importante:** NO borrar `campaigns.new.$phase.tsx` todavía — puede tener tests existentes. Solo reorientar el index redirect.

## Acceptance

- [ ] `src/features/campaigns/wizard/store.ts` exporta `useCampaignWizardStore`.
- [ ] Unit tests en `store.test.ts`: `reset()` llama `URL.revokeObjectURL` cuando `imageBlobUrl` no es null; `canAccessStep(1)` siempre true; `canAccessStep(3)` false si step 2 no está en completedSteps; `canAccessStep(3)` true si steps 1 y 2 están completados.
- [ ] `campaigns.new.tsx` valida el search param `step` con `z.number().int().min(1).max(7).default(1)`.
- [ ] `beforeLoad` en `campaigns.new.tsx` redirige a `?step=1` cuando `search.step > 1` y `canAccessStep` retorna false.
- [ ] `campaigns.new.index.tsx` redirige a `/campaigns/new?step=1`.
- [ ] `pnpm typecheck` pasa sin errores nuevos.
- [ ] E2E: navegar a `/campaigns/new` carga la ruta y muestra step 1; navegar a `/campaigns/new?step=3` sin completar pasos previos redirige a `?step=1`.

## Done summary
Implemented fn-27-feat-034-unified-campaign-creation.1; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: