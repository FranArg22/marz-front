# design

Cómo trabajar con el design system de Marz. Cargar SIEMPRE que reproduzcas un diseño, ajustes layout o agregues una pantalla nueva.

## Lectura obligatoria

**Antes de tocar UI**, leer `marz-docs/DESIGN-DEV.md`. Define el contrato de handoff por feature y cómo leer `.pen` con Pencil CLI en modo read-only. Sin haberlo leído, no abrís el `.pen`.

## Source of truth

```
marz-docs/features/{FEAT_ID}/design-handoff.md
```

Cada feature con UI declara su diseño en un handoff propio. El handoff apunta al `.pen` concreto (`pen_file`) y a los `node_id` de pantallas/componentes. `marz-docs/marzv2.pen` es fallback solo si el handoff lo declara explícitamente.

**El `.pen` está encriptado.** No se lee con `Read`, `Grep`, `cat` o `head`. Se lee con Pencil CLI, usando los nodos declarados por el handoff.

## Documento de contexto

`marz-docs/DESIGN-DEV.md` (ya mencionado arriba como lectura obligatoria). Leélo con `Read` normal — está en plain markdown — cuando necesites:

- Tokens y convenciones de naming.
- Reglas de uso del CLI de `pencil`.
- Lenguaje visual del producto (redondeado, dark + light, responsive desktop + mobile).
- Enfoque atómico (átomos → moléculas → organismos → templates).
- Cómo decidir dónde va un componente.

Es la guía de alto nivel. Siempre conviene refrescarlo al empezar tarea de UI nueva.

## Pencil CLI

No usar Pencil MCP para leer diseño. Usar `pencil interactive` en modo headless sobre el `pen_file` del handoff, con `--out` apuntando siempre a `/tmp`.

### Flujo estándar

1. Leer `marz-docs/features/{FEAT_ID}/design-handoff.md`.

2. Confirmar `pen_file`, `screens[].node_id`, temas y viewport.

3. Abrir `pencil interactive --in <pen_file> --out /tmp/marz-{FEAT_ID}-read.pen`.

4. Ejecutar `get_variables()` para tokens.

5. Ejecutar `batch_get({ nodeIds: ["<node_id>"], readDepth: 2, resolveVariables: true })` para estructura/código del diseño.

6. Ejecutar `export_nodes({ nodeIds: ["<node_id>"], outputDir: "/tmp", format: "png" })` para screenshot PNG.

### Reproducir una pantalla

1. Leer el handoff del feature.
2. Abrir `pencil interactive --in <pen_file> --out /tmp/marz-{FEAT_ID}-read.pen`.
3. Ejecutar `batch_get` y `export_nodes` sobre el `node_id` declarado.
4. Mapear al stack: utilities Tailwind, tokens del `.pen` ya replicados en `src/styles.css`, componentes shadcn/`shared/ui/` cuando existen.
5. Si el componente reusable del `.pen` (ej. `OnboardingTierCard`, `OnboardingFooter`) ya tiene equivalente en código, **usar el equivalente**, no rehacer.

### Cuándo extraer texto

Los strings dentro del `.pen` son placeholders del diseño (ej. "María", "Nubank"). En código:

- Strings reales (botones, labels) → `t\`...\`` en español.
- Placeholders de input → `placeholder="..."` con el ejemplo del diseño.
- Heading dinámico → interpolación con datos del store (`store.contact_name?.split(' ')[0]`).

## Tokens del .pen → CSS

Los tokens nacen en el `.pen` y se replican **a mano** en `src/styles.css` con naming shadcn. Cuando cambien:

1. Ejecutar `get_variables()` en `pencil interactive --in <pen_file> --out /tmp/...pen` para obtener los nuevos valores.
2. Editar `src/styles.css` para reflejar.
3. Probar light + dark.

No hay export automático. Detalle en `tokens.md`.

## NO

- Usar `Read`, `Grep`, `Write`, `Edit` contra el `.pen`.
- Usar Pencil MCP para leer diseños.
- Usar el CLI de pencil en modo interactivo o con comandos de escritura:
  ```
  pencil interactive --app desktop --in marzv2.pen
  pencil interactive --in marz-docs/features/FEAT-XXX/design.pen --out marz-docs/features/FEAT-XXX/design.pen
  pencil > batch_design(...)
  pencil > set_variables(...)
  pencil > save()
  ```
- Modificar el `.pen` desde acá. **Solo lectura desde marz-front.** Si hay que diseñar, lo hace el equipo de diseño.
- Hardcodear colores/radios del `.pen`. Siempre via token CSS replicado en `src/styles.css`.

## Lenguaje visual (resumen)

- Redondeado siempre, nunca cuadrado. Radios generosos.
- Light + Dark desde el inicio.
- Responsive: desktop y mobile (no mobile-first ni desktop-first).
- Naming shadcn: `--background`, `--foreground`, `--primary`, `--radius`, etc.
- Sin emojis en UI.
