import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const flightResponse = {
  mode: 'fixture',
  offers: [
    {
      id: 'fixture-icn-nrt-1',
      airline: 'Korean Air',
      origin: 'ICN',
      destination: 'NRT',
      departure_time: '2026-06-01T09:10:00+09:00',
      arrival_time: '2026-06-01T11:30:00+09:00',
      duration: '2h 20m',
      stops: 0,
      price: 280000,
      currency: 'KRW',
      booking_hint: 'Amadeus/항공사 예약 링크 연동 전 fixture 후보',
    },
  ],
}

const tripContextResponse = {
  weather: { mode: 'live', summary: '비 예보', temperature_c: 18.4, risk: '보통' },
  exchange: { mode: 'live', converted_amount: 270000, from: 'USD', to: 'KRW', updated_at: '2026-05-05T12:00:00Z' },
  forecast: [
    { date: '2026-06-01', min_c: 16, max_c: 22, precipitation_probability: 70, summary: '비 가능' },
    { date: '2026-06-02', min_c: 17, max_c: 24, precipitation_probability: 20, summary: '맑음' },
    { date: '2026-06-03', min_c: 18, max_c: 25, precipitation_probability: 10, summary: '맑음' },
  ],
  travel_tip: '비 예보가 있어 작은 우산을 챙기세요.',
}

function stubSearchFetch() {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => flightResponse })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => tripContextResponse })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('next-step product improvements', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('normalizes airport codes, validates dates, offers popular routes, and shows a compact search summary', async () => {
    const fetchMock = stubSearchFetch()
    render(<App />)

    await userEvent.clear(screen.getByLabelText('출발 공항'))
    await userEvent.type(screen.getByLabelText('출발 공항'), 'icn')
    expect(screen.getByLabelText('출발 공항')).toHaveValue('ICN')

    expect(screen.getByRole('button', { name: '서울 → 도쿄' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '서울 → 오사카' }))
    expect(screen.getByLabelText('도착 공항')).toHaveValue('KIX')

    await userEvent.click(screen.getByRole('button', { name: '왕복' }))
    await userEvent.clear(screen.getByLabelText('귀국일'))
    await userEvent.type(screen.getByLabelText('귀국일'), '2026-05-30')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))
    expect(screen.getByText('귀국일은 출발일 이후로 선택해주세요.')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('귀국일'))
    await userEvent.type(screen.getByLabelText('귀국일'), '2026-06-07')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(await screen.findByText('검색 조건')).toBeInTheDocument()
    expect(screen.getByText('ICN → KIX · 왕복 · 성인 1명')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('origin=ICN&destination=KIX'))
  })

  it('shows stronger travel information and external booking links after search', async () => {
    stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(await screen.findByText('3일 날씨')).toBeInTheDocument()
    expect(screen.getByText('비 예보가 있어 작은 우산을 챙기세요.')).toBeInTheDocument()
    expect(screen.getByText(/환율 기준/)).toBeInTheDocument()
    expect(screen.getByText(/강수 70%/)).toBeInTheDocument()

    const offer = await screen.findByRole('article', { name: /Korean Air ICN NRT/ })
    expect(within(offer).getByRole('link', { name: 'Google Flights에서 보기' })).toHaveAttribute('href', expect.stringContaining('google.com/travel/flights'))
    expect(within(offer).getByRole('link', { name: 'Skyscanner에서 보기' })).toHaveAttribute('href', expect.stringContaining('skyscanner'))
  })
})
