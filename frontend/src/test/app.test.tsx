import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const flightResponse = {
  mode: 'aviasales',
  offers: [
    {
      id: 'aviasales-icn-nrt-1',
      airline: 'Korean Air',
      origin: 'ICN',
      destination: 'NRT',
      departure_time: '2026-06-01T09:10:00+09:00',
      arrival_time: '2026-06-01T11:30:00+09:00',
      duration: '2h 20m',
      stops: 0,
      price: 280000,
      currency: 'KRW',
      booking_hint: 'Travelpayouts/Aviasales 가격 검색 결과입니다.',
      booking_url: 'https://www.aviasales.com/search/ICN0106NRT1',
    },
    {
      id: 'aviasales-icn-nrt-2',
      airline: 'Asiana Airlines',
      origin: 'ICN',
      destination: 'NRT',
      departure_time: '2026-06-01T07:40:00+09:00',
      arrival_time: '2026-06-01T10:10:00+09:00',
      duration: '2h 30m',
      stops: 1,
      price: 220000,
      currency: 'KRW',
      booking_hint: 'Travelpayouts/Aviasales 가격 검색 결과입니다.',
      booking_url: 'https://www.aviasales.com/search/ICN0106NRT1?alt=1',
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
    expect(screen.getByLabelText('출발일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('정렬')).toBeInTheDocument()
    expect(screen.getByText('연동 상태')).toBeInTheDocument()
    expect(screen.getByText('Aviasales')).toBeInTheDocument()
    expect(screen.getByText('Open-Meteo')).toBeInTheDocument()
    expect(screen.queryByText('백업 데이터')).not.toBeInTheDocument()
  })

  it('loads flight offers and live trip context from FastAPI with expanded search params', async () => {
    const fetchMock = stubSearchFetch()

    render(<App />)

    await userEvent.clear(screen.getByLabelText('성인 수'))
    await userEvent.type(screen.getByLabelText('성인 수'), '2')
    await userEvent.selectOptions(screen.getByLabelText('통화'), 'USD')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(await screen.findByText('Korean Air')).toBeInTheDocument()
    expect(screen.getByText('Asiana Airlines')).toBeInTheDocument()
    expect(screen.getAllByText('ICN → NRT')[0]).toBeInTheDocument()
    expect(screen.getByText('₩280,000')).toBeInTheDocument()
    expect(screen.getByText('실시간 Aviasales 결과')).toBeInTheDocument()
    expect(screen.getByText('최저가 ₩220,000')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Aviasales에서 보기' })[0]).toHaveAttribute('href', 'https://www.aviasales.com/search/ICN0106NRT1')
    expect(await screen.findByText(/여행 체크/)).toBeInTheDocument()
    expect(screen.getByText(/도착지 기준/)).toBeInTheDocument()
    expect(screen.getByText(/대체로 맑음/)).toBeInTheDocument()
    expect(screen.getByText(/약 270,000 KRW/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '상세 보기' })[0]).toBeInTheDocument()
    expect(screen.queryByText(/fixture/)).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/flights/search?origin=ICN&destination=NRT&departure_date=2026-06-01&adults=2&currency=USD',
    )
  })

  it('sorts search results by price, departure time, and stops', async () => {
    stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))
    expect(await screen.findByText('Korean Air')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('정렬'), 'price')
    let cards = screen.getAllByLabelText(/ICN NRT/)
    expect(cards[0]).toHaveTextContent('Asiana Airlines')

    await userEvent.selectOptions(screen.getByLabelText('정렬'), 'departure')
    cards = screen.getAllByLabelText(/ICN NRT/)
    expect(cards[0]).toHaveTextContent('Asiana Airlines')

    await userEvent.selectOptions(screen.getByLabelText('정렬'), 'stops')
    cards = screen.getAllByLabelText(/ICN NRT/)
    expect(cards[0]).toHaveTextContent('Korean Air')
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
    await userEvent.click((await screen.findAllByRole('button', { name: '상세 보기' }))[0])

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

    expect(screen.getByText('저장 2')).toBeInTheDocument()
    expect(screen.getByText('Korean Air · ICN → NRT')).toBeInTheDocument()
    expect(screen.getByText('09:10 · 11:30')).toBeInTheDocument()
    expect(screen.getByText('₩280,000')).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: '저장 항공편 상세' })[0])
    expect(screen.getByRole('dialog', { name: '항공권 상세' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    await userEvent.click(screen.getAllByRole('button', { name: '저장 삭제' })[0])
    expect(screen.queryByText('Korean Air · ICN → NRT')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('skytrip:favorites') ?? '[]')).toHaveLength(1)

    window.localStorage.setItem('skytrip:favorites', JSON.stringify(flightResponse.offers))
    render(<App />)
    await userEvent.click(screen.getAllByRole('button', { name: '저장 전체 삭제' }).at(-1)!)
    expect(screen.queryByText('저장 2')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('skytrip:favorites') ?? '[]')).toHaveLength(0)
  })
})
