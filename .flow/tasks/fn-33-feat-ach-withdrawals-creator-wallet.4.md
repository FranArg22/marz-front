# fn-33-feat-ach-withdrawals-creator-wallet.4 PayoutAccountModal: ABA checksum client-side + invalidar wallet

## Description

Modificar el `PayoutAccountModal` existente en `src/features/payments/settings/PayoutAccountModal.tsx` para:
1. Añadir validación de checksum ABA al `routing_number` en el schema Zod
2. Invalidar la wallet query key tras guardar exitosamente (además de la payout account query)

### Estado actual del archivo

`src/features/payments/settings/PayoutAccountModal.tsx` tiene:

```ts
export const PayoutAccountSchema = z.object({
  name: z.string().min(1).max(200),
  account_holder_name: z.string().min(1).max(200),
  account_number: z.string().regex(/^\d{1,17}$/),
  account_type: z.enum(['checking', 'savings', 'business']),
  routing_number: z.string().regex(/^\d{9}$/),  // ← solo formato, no checksum
  address: z.string().min(1).max(500),
})
```

Y en `PayoutAccountModalContent`:
```ts
await upsertPayoutAccount.mutateAsync({ data: toPayload(value) })
await queryClient.invalidateQueries({ queryKey: getGetMyPayoutAccountQueryKey() })
onOpenChange(false)
```

### Cambios requeridos

**1. Algoritmo de checksum ABA** (suma ponderada 3-7-1):

```ts
function isValidAbaChecksum(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false
  const d = routing.split('').map(Number)
  const sum =
    3 * (d[0]! + d[3]! + d[6]!) +
    7 * (d[1]! + d[4]! + d[7]!) +
    1 * (d[2]! + d[5]! + d[8]!)
  return sum % 10 === 0
}
```

Números ABA válidos de prueba: `021000021` (JPMorgan Chase), `011000138` (Bank of America), `021214891` (Citibank). Número inválido: `021000022` (falla checksum).

**2. Actualizar `PayoutAccountSchema`**:

```ts
routing_number: z
  .string()
  .regex(/^\d{9}$/, 'Debe tener exactamente 9 dígitos')
  .refine(isValidAbaChecksum, 'Routing number inválido (checksum ABA)'),
```

Poner `isValidAbaChecksum` antes del schema en el archivo (no es un componente, solo una función pura).

**3. Invalidar wallet query tras save exitoso**

Importar `getGetMyWalletQueryKey` del cliente generado:
```ts
import { getGetMyPayoutAccountQueryKey, getGetMyWalletQueryKey, useUpsertMyPayoutAccount } from '#/shared/api/generated/creator/creator'
```

En `onSubmit`:
```ts
await upsertPayoutAccount.mutateAsync({ data: toPayload(value) })
await queryClient.invalidateQueries({ queryKey: getGetMyPayoutAccountQueryKey() })
await queryClient.invalidateQueries({ queryKey: getGetMyWalletQueryKey() })
onOpenChange(false)
```

**4. Actualizar tests existentes** `src/features/payments/settings/PayoutAccountModal.test.ts`

Añadir casos:
```ts
describe('routing_number ABA checksum', () => {
  it('accepts valid ABA 021000021', () => {
    expect(PayoutAccountSchema.safeParse({ ...validAccount, routing_number: '021000021' }).success).toBe(true)
  })
  it('accepts valid ABA 011000138', () => {
    expect(PayoutAccountSchema.safeParse({ ...validAccount, routing_number: '011000138' }).success).toBe(true)
  })
  it('rejects invalid checksum 021000022', () => {
    expect(PayoutAccountSchema.safeParse({ ...validAccount, routing_number: '021000022' }).success).toBe(false)
  })
  it('still rejects non-9-digit strings', () => {
    expect(PayoutAccountSchema.safeParse({ ...validAccount, routing_number: '12345' }).success).toBe(false)
  })
})
```

Verificar que los tests existentes en el archivo (que usan `021000021`) sigan pasando.

### Nota sobre `account_type`

El form actual expone `checking`, `savings`, `business`. Según la spec, en la UI solo mostrar `checking` y `savings` (business es para plataformas, no usuarios individuales). Si se quiere hacer este cambio, limitar las opciones en `ACCOUNT_TYPE_OPTIONS` (no en el schema, para no romper datos existentes). Este cambio es opcional en esta task — mencionar si se decide no hacerlo.

## Acceptance

- [ ] `isValidAbaChecksum` implementa algoritmo 3-7-1 correctamente
- [ ] `PayoutAccountSchema` rechaza routing numbers con checksum inválido
- [ ] `021000021` (JPMorgan Chase) es aceptado
- [ ] `021000022` es rechazado (un dígito cambiado, falla checksum)
- [ ] El formulario muestra error "Routing number inválido (checksum ABA)" si el checksum falla
- [ ] Tras guardar exitosamente, se invalidan tanto `getGetMyPayoutAccountQueryKey()` como `getGetMyWalletQueryKey()`
- [ ] Tests existentes de `PayoutAccountModal.test.ts` siguen pasando
- [ ] Tests nuevos de checksum ABA añadidos y pasan
- [ ] `pnpm quality-gates` en verde

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
