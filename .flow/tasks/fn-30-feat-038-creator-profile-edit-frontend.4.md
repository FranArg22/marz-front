# fn-30-feat-038-creator-profile-edit-frontend.4 — RatesSection

## Description

**Size:** M

Implementa `RatesSection` en `src/features/identity/settings/RatesSection.tsx`.

Props: `{ data: CreatorSettingsResponse }`

Contiene un único form con:
- **`ChannelRatesCard`** por cada canal en `data.channels`: muestra `platform`, `handle` y `followers` como texto read-only; inputs de monto por cada formato (`ig_reel` / `tiktok_video` / `yt_short` según plataforma).
- **`UgcRateRow`**: input de monto para tarifa UGC (monto a nivel perfil, no por canal). El label de moneda es "USD" hardcodeado.

Solo existe un formato por plataforma:
- Instagram → `ig_reel`
- TikTok → `tiktok_video`
- YouTube → `yt_short`

Por eso cada `ChannelRatesCard` tiene exactamente un input de monto (el del formato de esa plataforma).

El botón `Guardar` (vía `SectionSaveBar`) llama a `useUpdateMyCreatorRates.mutateAsync`.

### Tipos relevantes

```ts
// De src/shared/api/generated/model/
CreatorSettingsChannel: { channel_id, platform, handle, external_url, followers, rates }
CreatorSettingsRate: { format, amount, currency }
UpdateCreatorRatesRequest: { channel_rates?: { channel_id, format, amount }[], ugc_rate_amount?: string }
CreatorRatesResponse: { channels: CreatorSettingsChannel[], ugc_rate: ... | null }
```

### Form state

```ts
type RatesFormValues = {
  // key: `${channel_id}:${format}` — el amount como string
  channelRates: Record<string, string>
  ugcRateAmount: string  // '' si no hay tarifa UGC activa
}
```

Inicialización desde `data.channels`:
```ts
const initialChannelRates: Record<string, string> = {}
for (const channel of data.channels) {
  for (const rate of channel.rates) {
    initialChannelRates[`${channel.channel_id}:${rate.format}`] = rate.amount
  }
}
```

Y `ugcRateAmount`: `data.ugc_rate?.amount ?? ''`.

### Validaciones en submit (antes de la mutation)

- Cada amount de canal o UGC que esté presente (no vacío) debe ser un número decimal > 0. Si es inválido → error en ese campo.
- Un amount vacío en un channel rate que ya tenía valor **no se envía** en el body (no hay delete de rates según el contrato). Si el usuario vacía un campo que tenía valor, mostrar un aviso inline: "No se puede eliminar una tarifa declarada; ingresá un monto válido o dejá el valor anterior" — y bloquear el submit.

### Construcción del body

Solo enviar `channel_rates` cuyas values cambien respecto a `data.channels[*].rates`:
```ts
const changedChannelRates = Object.entries(formValues.channelRates)
  .filter(([key, amount]) => {
    const [channelId, format] = key.split(':')
    const original = data.channels
      .find(c => c.channel_id === channelId)
      ?.rates.find(r => r.format === format)
    return original?.amount !== amount
  })
  .map(([key, amount]) => {
    const [channel_id, format] = key.split(':')
    return { channel_id, format, amount }
  })
```

Enviar `ugc_rate_amount` solo si cambió respecto a `data.ugc_rate?.amount`.

### Invalidación de query tras guardado exitoso

```ts
await queryClient.invalidateQueries({ queryKey: getGetMyCreatorSettingsQueryKey() })
```

### dirty

Hay cambios si `changedChannelRates.length > 0` O si `ugcRateAmount` cambió.

## Acceptance

- [ ] Al montar, los inputs de monto se inicializan con los amounts del canal o '' si no hay rate para ese formato.
- [ ] `handle` y `followers` se muestran como texto; no hay input editable para ellos (assert explícito: no existe `<input>` asociado a esos campos).
- [ ] Input de monto con valor `0`, `-5` o `'abc'` → error de validación; Guardar bloqueado.
- [ ] Vaciar un input que tenía valor → aviso inline + Guardar bloqueado.
- [ ] Guardar con montos válidos → `useUpdateMyCreatorRates` llamada con body que incluye solo los rates modificados.
- [ ] Moneda "USD" visible junto a cada input de monto (label o texto hardcodeado); no hay selector de moneda.
- [ ] Unit test: amount `0` → error `must_be_positive`.
- [ ] Unit test: amount negativo → error `must_be_positive`.
- [ ] Unit test: vaciar campo con valor previo → submit bloqueado.
- [ ] Unit test: solo UGC cambió → body solo tiene `ugc_rate_amount`; `channel_rates` ausente o vacío.
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
