import { createHash } from 'node:crypto'
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

function packageRoot(specifier) {
  try {
    return dirname(require.resolve(`${specifier}/package.json`))
  } catch {
    let current = dirname(require.resolve(specifier))
    while (current !== dirname(current)) {
      try {
        const packageJson = require(join(current, 'package.json'))
        if (packageJson.name === specifier) return current
      } catch {
        // Keep walking toward node_modules.
      }
      current = dirname(current)
    }
  }
  throw new Error(`Cannot locate ${specifier}`)
}

async function filesBelow(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesBelow(path)))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

const tesseractRoot = packageRoot('tesseract.js')
const tesseractRequire = createRequire(join(tesseractRoot, 'package.json'))
const coreRoot = dirname(tesseractRequire.resolve('tesseract.js-core/package.json'))
const languageRoot = packageRoot('@tesseract.js-data/eng')
const output = join(root, 'public', 'ocr')

await rm(output, { recursive: true, force: true })
await mkdir(join(output, 'core'), { recursive: true })
await mkdir(join(output, 'lang'), { recursive: true })

await copyFile(join(tesseractRoot, 'dist', 'worker.min.js'), join(output, 'worker.min.js'))

const coreFiles = (await readdir(coreRoot)).filter((name) =>
  /^tesseract-core.*\.(?:js|wasm)$/.test(name)
)
if (!coreFiles.length) throw new Error('No Tesseract core assets found')
for (const name of coreFiles) {
  await copyFile(join(coreRoot, name), join(output, 'core', name))
}

const model = (await filesBelow(languageRoot)).find((path) =>
  /eng\.traineddata(?:\.gz)?$/.test(path)
)
if (!model) throw new Error('English Tesseract model not found')
await copyFile(model, join(output, 'lang', 'eng.traineddata.gz'))

const files = [
  join(output, 'worker.min.js'),
  ...coreFiles.map((name) => join(output, 'core', name)),
  join(output, 'lang', 'eng.traineddata.gz')
]
const manifest = {
  generatedAt: new Date().toISOString(),
  license: {
    engine: 'Apache-2.0',
    englishModel: 'MIT'
  },
  files: await Promise.all(
    files.map(async (path) => ({
      path: path.slice(output.length + 1).replaceAll('\\', '/'),
      bytes: (await stat(path)).size,
      sha256: await sha256(path)
    }))
  )
}
await writeFile(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Synced ${manifest.files.length} local OCR assets.`)
