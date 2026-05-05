import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('visual design contract', () => {
  it('uses a clean light sky-blue palette with compact text scale', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8')

    expect(css).toContain('color-scheme: light')
    expect(css).toContain('--sky-50: #f0f9ff')
    expect(css).toContain('--sky-100: #e0f2fe')
    expect(css).toContain('--sky-500: #0ea5e9')
    expect(css).toContain('--ink: #0f172a')
    expect(css).toContain('max-width: 1120px')
    expect(css).not.toContain('letter-spacing: -0.06em')
  })
})
