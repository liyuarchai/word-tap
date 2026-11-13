import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve('src')
const appCssPath = join(root, 'styles', 'app.module.css')
const globalCssPath = join(root, 'styles', 'global.css')
const fix = process.argv.includes('--fix')

const spacing = {
  '4px': 'var(--space-1)',
  '8px': 'var(--space-2)',
  '12px': 'var(--space-3)',
  '16px': 'var(--space-4)',
  '20px': 'var(--space-5)',
  '24px': 'var(--space-6)',
  '32px': 'var(--space-7)',
  '40px': 'var(--space-8)',
  '48px': 'var(--space-9)',
  '64px': 'var(--space-10)',
  '14px': 'var(--space-optical-14)',
  '18px': 'var(--space-optical-18)',
  '22px': 'var(--space-optical-22)',
  '28px': 'var(--space-optical-28)'
}

const radii = {
  '2px': 'var(--radius-focus)',
  '4px': 'var(--radius-inline)',
  '8px': 'var(--radius-small)',
  '10px': 'var(--radius-control)',
  '12px': 'var(--radius-card)',
  '14px': 'var(--radius-badge)',
  '16px': 'var(--radius-panel)',
  '20px 20px 0 0': 'var(--radius-sheet) var(--radius-sheet) 0 0',
  '999px': 'var(--radius-pill)'
}

const fontSizes = {
  '11px': 'var(--font-size-caption)',
  '12px': 'var(--font-size-meta)',
  '13px': 'var(--font-size-control)',
  '14px': 'var(--font-size-body)',
  '17px': 'var(--font-size-reading-mobile)',
  '20px': 'var(--font-size-reading)',
  '26px': 'var(--font-size-heading-sm)',
  '28px': 'var(--font-size-page-title)',
  '30px': 'var(--font-size-heading)',
  '32px': 'var(--font-size-heading-lg)',
  '64px': 'var(--font-size-display)'
}

const durations = {
  '140ms': 'var(--motion-subtle)',
  '160ms': 'var(--motion-soft)',
  '180ms': 'var(--motion-standard)',
  '240ms': 'var(--motion-panel)',
  '320ms': 'var(--motion-reading)',
  '420ms': 'var(--motion-chrome)',
  '1.2s': 'var(--motion-loading)'
}

function replacePropertyValues(css, propertyPattern, replacements) {
  const pattern = new RegExp(
    `^(\\s*)((?:${propertyPattern})):([^;]+);`,
    'gm'
  )
  return css.replace(pattern, (full, indent, property, value) => {
    for (const [from, to] of Object.entries(replacements)) {
      value = value.replace(new RegExp(`\\b${from.replace('.', '\\.')}\\b`, 'g'), to)
    }
    return `${indent}${property}:${value};`
  })
}

async function walk(directory) {
  const output = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) output.push(...(await walk(path)))
    else if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
      output.push(path)
    }
  }
  return output
}

let appCss = await readFile(appCssPath, 'utf8')
if (fix) {
  appCss = replacePropertyValues(
    appCss,
    'padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|gap|row-gap|column-gap',
    spacing
  )
  appCss = replacePropertyValues(appCss, 'border-radius', radii)
  appCss = replacePropertyValues(appCss, 'font-size', fontSizes)
  for (const [from, to] of Object.entries(durations)) {
    appCss = appCss.replaceAll(from, to)
  }
  appCss = appCss.replace(
    'box-shadow: 0 0 0 2px var(--paper-raised), 0 0 0 4px var(--accent);',
    'box-shadow: var(--theme-choice-ring);'
  )
  await writeFile(appCssPath, appCss)
}

const violations = []
const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/g
for (const path of [appCssPath, globalCssPath, ...(await walk(root))]) {
  const source = await readFile(path, 'utf8')
  const matches = source.match(rawColorPattern)
  if (matches?.length) {
    violations.push(`${relative(root, path)} contains raw colors: ${[...new Set(matches)].join(', ')}`)
  }
}

const spacingValuePattern = new RegExp(
  `\\b(?:${Object.keys(spacing).join('|')})\\b`
)
for (const line of appCss.split('\n')) {
  if (
    /^\s*(?:padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|gap|row-gap|column-gap):/.test(
      line
    ) &&
    spacingValuePattern.test(line)
  ) {
    violations.push(`app.module.css contains raw grid spacing: ${line.trim()}`)
  }
  if (
    /^\s*font-size:/.test(line) &&
    new RegExp(`\\b(?:${Object.keys(fontSizes).join('|')})\\b`).test(line)
  ) {
    violations.push(`app.module.css contains raw font size: ${line.trim()}`)
  }
  const radiusValue = line.match(/^\s*border-radius:\s*([^;]+);/)?.[1]?.trim()
  if (
    radiusValue &&
    !radiusValue.startsWith('var(') &&
    radiusValue !== '50%' &&
    radiusValue !== '0'
  ) {
    violations.push(`app.module.css contains raw radius: ${line.trim()}`)
  }
  if (/^\s*(?:transition|animation):/.test(line) && /\b\d+(?:ms|s)\b/.test(line)) {
    violations.push(`app.module.css contains raw motion duration: ${line.trim()}`)
  }
}

if (violations.length) {
  console.error(violations.join('\n'))
  process.exitCode = 1
} else {
  console.log('Design token audit passed: colors are centralized.')
}
