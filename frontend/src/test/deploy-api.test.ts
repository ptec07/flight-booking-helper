import { afterEach, describe, expect, it, vi } from 'vitest'

describe('deployment-aware frontend API client', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('prefixes API calls with VITE_API_BASE_URL when deployed separately', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://skytrip-backend.example.com')
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ mode: 'fixture', offers: [] }) }))
    vi.stubGlobal('fetch', fetchMock)
    const { searchFlightOffers } = await import('../api')

    await searchFlightOffers({ origin: 'icn', destination: 'nrt', departureDate: '2026-06-01' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://skytrip-backend.example.com/api/flights/search?origin=ICN&destination=NRT&departure_date=2026-06-01',
    )
  })
})
