import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
const dependencySections = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]

const allowedProtocols = ['catalog:', 'file:', 'link:', 'portal:', 'workspace:']

const rangePattern = /^[~^*]|[<>=]|\s+-\s+|\|\|/
const violations = []

for (const section of dependencySections) {
  const dependencies = packageJson[section]
  if (!dependencies) continue

  for (const [name, specifier] of Object.entries(dependencies)) {
    if (typeof specifier !== 'string') continue
    if (allowedProtocols.some((protocol) => specifier.startsWith(protocol))) {
      continue
    }
    if (rangePattern.test(specifier)) {
      violations.push(`${section}.${name}: ${specifier}`)
    }
  }
}

if (violations.length > 0) {
  console.error('Dependency versions must be exact pins:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('Dependency versions are exact pins.')
