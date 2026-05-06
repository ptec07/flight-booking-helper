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

function stubSearchFetch() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => flightResponse })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('Flight Booking Helper app', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('renders a polished compact sky-blue travel search surface', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'SkyTrip' })).toBeInTheDocument()
    expect(screen.getByText('원하는 항공권을 찾으세요.')).toBeInTheDocument()
    expect(screen.queryByText('항공권·날씨·환율을 한 번에 확인하세요.')).not.toBeInTheDocument()
    expect(screen.queryByText('항공권·환율을 한 번에 확인하세요.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '항공권 검색' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '편도' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '왕복' })).toBeInTheDocument()
    expect(screen.getByLabelText('성인 수')).toBeInTheDocument()
    expect(screen.getByLabelText('통화')).toBeInTheDocument()
    expect(screen.getByLabelText('출발일')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('정렬')).toBeInTheDocument()
    expect(screen.queryByLabelText('연동 상태')).not.toBeInTheDocument()
    expect(screen.queryByText('연동 상태')).not.toBeInTheDocument()
    expect(screen.queryByText('Aviasales')).not.toBeInTheDocument()
    expect(screen.queryByText('Open-Meteo')).not.toBeInTheDocument()
    expect(screen.queryByText('환율')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('여행 준비 요약')).not.toBeInTheDocument()
    expect(screen.queryByText('도시명만 입력해도 공항을 찾습니다.')).not.toBeInTheDocument()
    expect(screen.queryByText('항공권·날씨·환율을 같이 봅니다.')).not.toBeInTheDocument()
    expect(screen.queryByText('마음에 드는 항공편을 보관하세요.')).not.toBeInTheDocument()
    expect(screen.queryByText('백업 데이터')).not.toBeInTheDocument()
  })

  it('searches airports by Korean aliases, selects autocomplete results, and swaps the route', async () => {
    const fetchMock = stubSearchFetch()

    render(<App />)

    const originInput = screen.getByLabelText('출발 도시 또는 공항')
    const destinationInput = screen.getByLabelText('도착 도시 또는 공항')

    await userEvent.clear(originInput)
    await userEvent.type(originInput, '서울')
    await userEvent.click(await screen.findByRole('option', { name: /서울 · ICN/ }))

    await userEvent.clear(destinationInput)
    await userEvent.type(destinationInput, '도쿄')
    await userEvent.click(await screen.findByRole('option', { name: /도쿄 · NRT/ }))

    expect(originInput).toHaveValue('서울 · ICN')
    expect(destinationInput).toHaveValue('도쿄 · NRT')

    await userEvent.click(screen.getByRole('button', { name: '출발지와 도착지 바꾸기' }))
    expect(originInput).toHaveValue('도쿄 · NRT')
    expect(destinationInput).toHaveValue('서울 · ICN')

    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('origin=NRT&destination=ICN'))
  })

  it('blocks search when airport text is edited without selecting a valid airport', async () => {
    const fetchMock = stubSearchFetch()
    render(<App />)

    await userEvent.clear(screen.getByLabelText('도착 도시 또는 공항'))
    await userEvent.type(screen.getByLabelText('도착 도시 또는 공항'), '없는도시')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(screen.getByText('출발/도착 도시를 검색해 공항을 선택해주세요.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears departure and destination airport fields with inline x buttons', async () => {
    const fetchMock = stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '출발 입력 지우기' }))
    expect(screen.getByLabelText('출발 도시 또는 공항')).toHaveValue('')
    expect(screen.queryByText('선택됨 · ')).not.toBeInTheDocument()
    expect(screen.getByText('출발/도착 도시를 검색해 공항을 선택해주세요.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '도착 입력 지우기' }))
    expect(screen.getByLabelText('도착 도시 또는 공항')).toHaveValue('')
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(screen.getByText('출발/도착 도시를 검색해 공항을 선택해주세요.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads flight offers from FastAPI without the removed live trip context card', async () => {
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
    expect(screen.queryByLabelText('여행 체크')).not.toBeInTheDocument()
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
    expect(screen.queryByText(/여행 체크/)).not.toBeInTheDocument()
    expect(screen.queryByText('환율')).not.toBeInTheDocument()
    expect(screen.queryByText(/약 270,000 KRW/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '상세 보기' })[0]).toBeInTheDocument()
    expect(screen.queryByText(/fixture/)).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/flights/search?origin=ICN&destination=NRT&departure_date=2026-06-01&adults=2&currency=USD',
    )
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/api/trip/context'))
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

  it('persists recent airport searches after a successful search', async () => {
    stubSearchFetch()
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '서울 → 오사카' }))
    await userEvent.click(screen.getByRole('button', { name: '항공권 검색' }))

    expect(await screen.findByText('최근 검색')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '서울 · ICN → 오사카 · KIX' })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('skytrip:recent-routes') ?? '[]')).toHaveLength(1)
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
    expect(screen.getAllByText('출발날짜 2026-06-01')).toHaveLength(2)
    expect(screen.getAllByText('도착날짜 2026-06-01')).toHaveLength(2)
    expect(screen.getByText('₩280,000')).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: '저장 항공편 상세' })[0])
    expect(screen.getByRole('dialog', { name: '항공권 상세' })).toBeInTheDocument()
    expect(screen.getByText('출발날짜')).toBeInTheDocument()
    expect(screen.getByText('도착날짜')).toBeInTheDocument()
    expect(screen.getAllByText('2026-06-01')).toHaveLength(2)

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
