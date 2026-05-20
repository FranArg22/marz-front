---
satisfies: [R4, R6]
---

## Description

Mapear el nuevo error backend `campaign.no_supported_platforms` durante la activación de campaign configuration para mostrar feedback inline cerca del botón `Activar campaña`, no un error genérico ni toast global.

**Size:** M
**Files:** `src/features/campaigns/configuration/hooks.ts`, `src/features/campaigns/configuration/ReviewStep.tsx`, `src/features/campaigns/configuration/ReviewStep.test.tsx`, helpers de error compartidos si ya existen.

## Approach

- Revisar cómo el mutator/Orval expone respuestas 409 y envelopes de error.
- Ajustar el hook o `ReviewStep` para reconocer `code === 'campaign.no_supported_platforms'`.
- Renderizar mensaje inline junto a la acción de activar usando el `message` del envelope o la copy localizada existente si el repo ya centraliza mapping de codes.
- Mantener manejo actual de éxito, analytics e idempotency de FEAT-019.

## Investigation targets

**Required**
- `src/features/campaigns/configuration/hooks.ts:214` — mutation de activación actual.
- `src/features/campaigns/configuration/ReviewStep.tsx:129` — wiring del botón y callbacks.
- `src/features/campaigns/configuration/ReviewStep.test.tsx:255` — tests actuales de activar.
- `src/shared/api/mutator.ts:79` — idempotency y error handling para activate.
- `src/shared/api/mutator.test.ts:216` — patrón de test del activate.

**Optional**
- `src/shared/ui/form/components/FormError.test.tsx` — patrón de error inline si aplica.
- `src/features/campaigns/configuration/CampaignConfigurationWizard.test.tsx:92` — patrón de tests axe/estado.

## Design context

El feedback debe vivir en el flujo de activación, cerca del botón, con el estilo de errores inline existente. No agregar modales ni toasts para este caso.

## Key context

El endpoint actual en frontend es `/v1/campaigns/{id}/configuration/activate`; el solution menciona gate de activación de campaign y la implementación local de FEAT-019 lo canaliza por configuration activate.

## Acceptance

- [ ] Un 409 con `code: campaign.no_supported_platforms` muestra mensaje inline junto a `Activar campaña`.
- [ ] Ese 409 no dispara navegación de éxito ni tracking `campaign_configuration_activated`.
- [ ] Otros errores de activate conservan el comportamiento previo.
- [ ] Unit test de `ReviewStep` o hook cubre el envelope 409 y el render inline.
- [ ] `pnpm test -- ReviewStep` y `pnpm typecheck` pasan o documentan un bloqueo externo concreto.

## Done summary
Mapeado campaign.no_supported_platforms para mostrar error inline en ReviewStep sin éxito, toast ni tracking.
## Evidence
- Commits:
- Tests:
- PRs: