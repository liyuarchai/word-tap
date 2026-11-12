import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

if (!URL.createObjectURL) {
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test') })
}
if (!URL.revokeObjectURL) {
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn() })
}

if (!File.prototype.arrayBuffer) {
  Object.defineProperty(File.prototype, 'arrayBuffer', {
    value() {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(this)
      })
    }
  })
}

if (!Blob.prototype.arrayBuffer) {
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    value() {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(this)
      })
    }
  })
}

if (!Blob.prototype.stream) {
  Object.defineProperty(Blob.prototype, 'stream', {
    value() {
      return new Response(this).body
    }
  })
}

