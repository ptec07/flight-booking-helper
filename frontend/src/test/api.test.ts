import { describe, expect, it, vi } from 'vitest'
import { searchFlightOffers } from '../api'

describe('frontend API client', () => {
  it('calls FastAPI flight search with normalized query params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ mode: 'fixture', offers: [{ id: 'offer-1' }] }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchFlightOffers({ origin: 'icn', destination: 'nrt', departureDate: '2026-06-01', currency: 'krw' })

    expect(fetchMock).toHaveBeenCalledWith('/api/flights/search?origin=ICN&destination=NRT&departure_date=2026-06-01&currency=KRW')
    expect(result.offers).toEqual([{ id: 'offer-1' }])
    vi.unstubAllGlobals()
  })
})
