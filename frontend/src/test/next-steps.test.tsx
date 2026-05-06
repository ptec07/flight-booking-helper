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
      booking_hint: 'Travelpayouts/Aviasales 연동 전 fixture 후보',
      booking_url: null,
    },
  ],
}

function stubSearchFetch() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => flightResponse })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('next-step product improvements', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('normalizes airport codes, validates dates, offers popular routes, and hides the removed search summary', async () => {
    const fetchMock = stubSearchFetch()
    render(<App />)

    await userEvent.clear(screen.getByLabelText('출발 도시 또는 공항'))
    await userEvent.type(screen.getByLabelText('출발 도시 또는 공항'), 'icn')
    expect(screen.getByLabelText('출발 도시 또는 공항')).toHaveValue('서울 · ICN')

    expect(screen.getByRole('button', { name: '서울 → 도쿄' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '서울 → 오사카' }))
    expect(screen.getByLabelText('도착 도시 또는 공항')).toHaveValue('오사카 · KIX')

    await userEvent.click(screen.getByRole('button', { name: '왕복' }))
    await userEvent.clear(screen.getByLabelText('귀국일'))
    await userEvent.type(screen.getByLabelText('귀국일'), '2026-05-30')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))
    expect(screen.getByText('귀국일은 출발일 이후로 선택해주세요.')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('귀국일'))
    await userEvent.type(screen.getByLabelText('귀국일'), '2026-06-07')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(screen.queryByText('검색 조건')).not.toBeInTheDocument()
    expect(screen.queryByText('서울 · ICN → 오사카 · KIX · 왕복 · 성인 1명')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('origin=ICN&destination=KIX'))
  })

  it('shows external booking links after search without the removed live travel check', async () => {
    stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(screen.queryByText('Live')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('여행 체크')).not.toBeInTheDocument()
    expect(screen.queryByText('여행 체크')).not.toBeInTheDocument()
    expect(screen.queryByText('3일 날씨')).not.toBeInTheDocument()
    expect(screen.queryByText('비 예보가 있어 작은 우산을 챙기세요.')).not.toBeInTheDocument()
    expect(screen.queryByText(/강수 70%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/환율 기준/)).not.toBeInTheDocument()

    const offer = await screen.findByRole('article', { name: /Korean Air ICN NRT/ })
    expect(within(offer).getByRole('link', { name: 'Google Flights에서 보기' })).toHaveAttribute('href', expect.stringContaining('google.com/travel/flights'))
    expect(within(offer).getByRole('link', { name: 'Skyscanner에서 보기' })).toHaveAttribute('href', expect.stringContaining('skyscanner'))
  })
})
