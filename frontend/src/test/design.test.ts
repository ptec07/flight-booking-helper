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

  it('defines an app-like responsive layout for phone, tablet, and desktop', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8')

    expect(css).toContain('.app-layout')
    expect(css).toContain('.primary-panel')
    expect(css).toContain('.secondary-panel')
    expect(css).toContain('grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr)')
    expect(css).toContain('position: sticky')
    expect(css).toContain('top: 24px')
    expect(css).toContain('@media (max-width: 1024px)')
    expect(css).toContain('grid-template-columns: 1fr')
    expect(css).toContain('@media (max-width: 480px)')
    expect(css).toContain('min-height: 44px')
    expect(css).toContain('max-height: min(84vh, 720px)')
  })

  it('adds clearly visible dashboard-only surfaces so the redesign is not subtle', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8')

    expect(css).toContain('.insight-strip')
    expect(css).toContain('.flight-map-card')
    expect(css).toContain('.empty-preview')
    expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(css).toContain('linear-gradient(135deg, #0284c7')
  })
})
