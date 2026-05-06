import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('deployment configuration', () => {
  it('configures Vercel as a static Vite SPA with API base env support', () => {
    const vercel = JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8'))
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'))

    expect(vercel.outputDirectory).toBe('dist')
    expect(vercel.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
    expect(pkg.scripts.build).toContain('vite build')
  })

  it('ships a real mobile viewport shell for phone-sized webapps', () => {
    const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8')

    expect(html).toContain('<meta name="viewport"')
    expect(html).toContain('width=device-width')
    expect(html).toContain('initial-scale=1')
    expect(html).toContain('<title>SkyTrip</title>')
  })

  it('installs the Travelpayouts site verification script in the document head', () => {
    const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8')

    expect(html).toContain('https://emrldtp.cc/NTI1ODIy.js?t=525822')
    expect(html).toContain('data-cfasync="false"')
    expect(html).toContain('data-no-defer="1"')
    expect(html).not.toContain('</script>.')
  })

  it('documents Render backend deployment without frontend secrets', () => {
    const render = readFileSync(resolve(__dirname, '../../../render.yaml'), 'utf-8')
    const readme = readFileSync(resolve(__dirname, '../../../README.md'), 'utf-8')

    expect(render).toContain('flight-booking-helper-api')
    expect(render).toContain('uvicorn app.main:app')
    expect(readme).toContain('Frontend: Vercel')
    expect(readme).toContain('Backend: Render')
    expect(readme).toContain('TRAVELPAYOUTS_API_TOKEN')
    expect(readme).toContain('프론트엔드에 노출하지 않습니다')
  })
})
