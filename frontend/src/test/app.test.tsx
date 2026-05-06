import { render, screen } from '@testing-library/react'
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

const tripContextResponse = {
  weather: { mode: 'live', summary: '대체로 맑음', temperature_c: 18.4, risk: '낮음' },
  exchange: { mode: 'live', converted_amount: 270000, from: 'USD', to: 'KRW' },
}

function stubSearchFetch() {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => flightResponse })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => tripContextResponse })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('Flight Booking Helper app', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('renders a polished compact sky-blue travel search surface', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'SkyTrip' })).toBeInTheDocument()
    expect(screen.getByText('항공권·날씨·환율을 한 번에 확인하세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '항공권 검색' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '편도' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '왕복' })).toBeInTheDocument()
    expect(screen.getByLabelText('성인 수')).toBeInTheDocument()
    expect(screen.getByLabelText('통화')).toBeInTheDocument()
    expect(screen.getByText('연동 상태')).toBeInTheDocument()
    expect(screen.getByText('Aviasales')).toBeInTheDocument()
    expect(screen.getByText('Open-Meteo')).toBeInTheDocument()
  })

  it('loads flight offers and live trip context from FastAPI with expanded search params', async () => {
    const fetchMock = stubSearchFetch()

    render(<App />)

    await userEvent.clear(screen.getByLabelText('성인 수'))
    await userEvent.type(screen.getByLabelText('성인 수'), '2')
    await userEvent.selectOptions(screen.getByLabelText('통화'), 'USD')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(await screen.findByText('Korean Air')).toBeInTheDocument()
    expect(screen.getByText('ICN → NRT')).toBeInTheDocument()
    expect(screen.getByText('₩280,000')).toBeInTheDocument()
    expect(await screen.findByText(/여행 체크/)).toBeInTheDocument()
    expect(screen.getByText(/도착지 기준/)).toBeInTheDocument()
    expect(screen.getByText(/대체로 맑음/)).toBeInTheDocument()
    expect(screen.getByText(/약 270,000 KRW/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '상세 보기' })).toBeInTheDocument()
    expect(screen.queryByText(/fixture/)).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/flights/search?origin=ICN&destination=NRT&departure_date=2026-06-01&adults=2&currency=USD',
    )
  })

  it('toggles one-way and round-trip search params', async () => {
    const fetchMock = stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '왕복' }))
    await userEvent.type(screen.getByLabelText('귀국일'), '2026-06-07')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('return_date=2026-06-07'))
  })

  it('opens detail dialog and saves a favorite flight to localStorage', async () => {
    stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))
    await userEvent.click(await screen.findByRole('button', { name: '상세 보기' }))

    expect(screen.getByRole('dialog', { name: '항공권 상세' })).toBeInTheDocument()
    expect(screen.getByText('09:10 ICN → 11:30 NRT')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '관심 항공편 저장' }))

    expect(screen.getByText('저장한 항공편')).toBeInTheDocument()
    expect(screen.getByText('Korean Air · ICN → NRT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장됨' })).toBeDisabled()
    expect(JSON.parse(window.localStorage.getItem('skytrip:favorites') ?? '[]')).toHaveLength(1)
  })

  it('manages saved flights with count, detail reopen, delete, and clear all', async () => {
    window.localStorage.setItem('skytrip:favorites', JSON.stringify(flightResponse.offers))

    render(<App />)

    expect(screen.getByText('저장 1')).toBeInTheDocument()
    expect(screen.getByText('Korean Air · ICN → NRT')).toBeInTheDocument()
    expect(screen.getByText('09:10 · 11:30')).toBeInTheDocument()
    expect(screen.getByText('₩280,000')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '저장 항공편 상세' }))
    expect(screen.getByRole('dialog', { name: '항공권 상세' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    await userEvent.click(screen.getByRole('button', { name: '저장 삭제' }))
    expect(screen.queryByText('Korean Air · ICN → NRT')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('skytrip:favorites') ?? '[]')).toHaveLength(0)

    window.localStorage.setItem('skytrip:favorites', JSON.stringify(flightResponse.offers))
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: '저장 전체 삭제' }))
    expect(screen.queryByText('저장 1')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('skytrip:favorites') ?? '[]')).toHaveLength(0)
  })
})
