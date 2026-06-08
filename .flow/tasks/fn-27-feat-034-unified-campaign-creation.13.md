Archivo completo reescrito. Cambios: (1) track.ts YA EXISTE en src/shared/analytics/track.ts con un union type AnalyticsEvent y un buffer in-memory — la task original proponía crearlo from scratch con un POST fetch que no usaba el patrón existente; (2) approach reescrito para EXTENDER el union type existente con los 7 eventos nuevos, sin reescribir la función; (3) documentado que useIngestAnalyticsEvent existe en generated/analytics para POST al backend si los event names están en el enum generado; (4) acceptance criteria incluye 'tests existentes siguen pasando'.
## Done summary
Implemented fn-27-feat-034-unified-campaign-creation.13; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: