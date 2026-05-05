import { describe, expect, it, vi } from 'vitest'
import { searchFlightOffers, getTripContext } from '../api'

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

  it('requests live trip context when enabled', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ weather: { mode: 'live' }, exchange: { mode: 'live' } }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getTripContext({ destination: 'nrt', amount: 200, currency: 'usd', live: true })

    expect(fetchMock).toHaveBeenCalledWith('/api/trip/context?destination=NRT&amount=200&currency=USD&live=true')
    expect(result.weather.mode).toBe('live')
    vi.unstubAllGlobals()
  })
})
