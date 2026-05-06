import { useMemo, useState } from 'react'
import { searchFlightOffers, type FlightOffer } from './api'
import { airportDisplayName, findAirportByCode, searchAirports, type Airport } from './airports'

const favoriteStorageKey = 'skytrip:favorites'
const recentRoutesStorageKey = 'skytrip:recent-routes'
type TripType = 'one-way' | 'round-trip'
type SortMode = 'recommended' | 'price' | 'departure' | 'stops'
type RouteSearch = { origin: string; destination: string }
type AirportField = 'origin' | 'destination'

const popularRoutes = [
  { label: '서울 → 도쿄', origin: 'ICN', destination: 'NRT' },
  { label: '서울 → 오사카', origin: 'ICN', destination: 'KIX' },
  { label: '서울 → 방콕', origin: 'ICN', destination: 'BKK' },
  { label: '서울 → 뉴욕', origin: 'ICN', destination: 'JFK' },
]

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function timeParts(offer: FlightOffer) {
  const departure = new Date(offer.departure_time)
  const arrival = new Date(offer.arrival_time)
  const timeFormatter = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { departure: timeFormatter.format(departure), arrival: timeFormatter.format(arrival) }
}

function dateParts(offer: FlightOffer) {
  const departure = new Date(offer.departure_time)
  const arrival = new Date(offer.arrival_time)
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
  return { departure: dateFormatter.format(departure), arrival: dateFormatter.format(arrival) }
}

function formatFlightTime(offer: FlightOffer) {
  const { departure, arrival } = timeParts(offer)
  return `${departure} · ${arrival} · ${offer.duration}`
}

function formatDetailRoute(offer: FlightOffer) {
  const { departure, arrival } = timeParts(offer)
  return `${departure} ${offer.origin} → ${arrival} ${offer.destination}`
}

function formatAirportCode(value: string) {
  return value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
}

function bookingUrl(offer: FlightOffer, provider: 'google' | 'skyscanner') {
  if (provider === 'google') {
    const query = encodeURIComponent(`${offer.origin} to ${offer.destination} flights ${offer.airline}`)
    return `https://www.google.com/travel/flights?q=${query}`
  }
  return `https://www.skyscanner.net/transport/flights/${offer.origin.toLowerCase()}/${offer.destination.toLowerCase()}/`
}

function readFavorites(): FlightOffer[] {
  try {
    return JSON.parse(window.localStorage.getItem(favoriteStorageKey) ?? '[]') as FlightOffer[]
  } catch {
    return []
  }
}

function isKnownAirportCode(value: unknown): value is string {
  return typeof value === 'string' && Boolean(findAirportByCode(value))
}

function readRecentRoutes(): RouteSearch[] {
  try {
    const routes = JSON.parse(window.localStorage.getItem(recentRoutesStorageKey) ?? '[]') as unknown
    if (!Array.isArray(routes)) return []
    const sanitizedRoutes = routes.filter(
      (route): route is RouteSearch =>
        typeof route === 'object' &&
        route !== null &&
        isKnownAirportCode((route as RouteSearch).origin) &&
        isKnownAirportCode((route as RouteSearch).destination),
    )
    return sanitizedRoutes
      .filter((route, index, allRoutes) => allRoutes.findIndex((other) => other.origin === route.origin && other.destination === route.destination) === index)
      .slice(0, 4)
  } catch {
    return []
  }
}

function sourceLabel(mode: string | null) {
  if (!mode) return null
  if (mode === 'aviasales') return '실시간 Aviasales 결과'
  if (mode.includes('fallback') || mode === 'fixture') return '백업 데이터 결과'
  return `${mode} 결과`
}

function offerTimeValue(offer: FlightOffer) {
  return new Date(offer.departure_time).getTime()
}

function sortedFlightOffers(offers: FlightOffer[], sortMode: SortMode) {
  return [...offers].sort((a, b) => {
    if (sortMode === 'price') return a.price - b.price
    if (sortMode === 'departure') return offerTimeValue(a) - offerTimeValue(b)
    if (sortMode === 'stops') return a.stops - b.stops || a.price - b.price
    return 0
  })
}

function minimumPriceLabel(offers: FlightOffer[]) {
  if (offers.length === 0) return null
  const cheapest = offers.reduce((best, offer) => (offer.price < best.price ? offer : best), offers[0])
  return `최저가 ${formatCurrency(cheapest.price, cheapest.currency)}`
}

function airportLabel(code: string) {
  const airport = findAirportByCode(code)
  return airport ? airportDisplayName(airport) : code
}

function airportOptionLabel(airport: Airport) {
  return `${airport.cityKo} · ${airport.code} · ${airport.airportKo} · ${airport.countryKo}`
}

function displayRoute(route: RouteSearch) {
  return `${airportLabel(route.origin)} → ${airportLabel(route.destination)}`
}

function App() {
  const [origin, setOrigin] = useState('ICN')
  const [destination, setDestination] = useState('NRT')
  const [originQuery, setOriginQuery] = useState(airportLabel('ICN'))
  const [destinationQuery, setDestinationQuery] = useState(airportLabel('NRT'))
  const [activeAirportField, setActiveAirportField] = useState<AirportField | null>(null)
  const [recentRoutes, setRecentRoutes] = useState<RouteSearch[]>(readRecentRoutes)
  const [departureDate, setDepartureDate] = useState('2026-06-01')
  const [returnDate, setReturnDate] = useState('')
  const [tripType, setTripType] = useState<TripType>('one-way')
  const [adults, setAdults] = useState('1')
  const [currency, setCurrency] = useState('KRW')
  const [sortMode, setSortMode] = useState<SortMode>('recommended')
  const [offers, setOffers] = useState<FlightOffer[]>([])
  const [resultMode, setResultMode] = useState<string | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null)
  const [favorites, setFavorites] = useState<FlightOffer[]>(readFavorites)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayedOffers = useMemo(() => sortedFlightOffers(offers, sortMode), [offers, sortMode])
  const currentSourceLabel = sourceLabel(resultMode)
  const currentMinimumPrice = minimumPriceLabel(offers)
  const originSuggestions = useMemo(() => searchAirports(originQuery), [originQuery])
  const destinationSuggestions = useMemo(() => searchAirports(destinationQuery), [destinationQuery])

  const selectedSaved = useMemo(
    () => Boolean(selectedOffer && favorites.some((favorite) => favorite.id === selectedOffer.id)),
    [favorites, selectedOffer],
  )

  function saveFavorite(offer: FlightOffer) {
    if (favorites.some((favorite) => favorite.id === offer.id)) return
    const nextFavorites = [offer, ...favorites]
    setFavorites(nextFavorites)
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(nextFavorites))
  }

  function removeFavorite(offerId: string) {
    const nextFavorites = favorites.filter((favorite) => favorite.id !== offerId)
    setFavorites(nextFavorites)
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(nextFavorites))
    if (selectedOffer?.id === offerId) setSelectedOffer(null)
  }

  function clearFavorites() {
    setFavorites([])
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify([]))
    setSelectedOffer(null)
  }

  function updateRecentRoutes(route: RouteSearch) {
    const nextRoutes = [route, ...recentRoutes.filter((recent) => recent.origin !== route.origin || recent.destination !== route.destination)].slice(0, 4)
    setRecentRoutes(nextRoutes)
    window.localStorage.setItem(recentRoutesStorageKey, JSON.stringify(nextRoutes))
  }

  function setRoute(originCode: string, destinationCode: string) {
    setOrigin(originCode)
    setDestination(destinationCode)
    setOriginQuery(airportLabel(originCode))
    setDestinationQuery(airportLabel(destinationCode))
    setActiveAirportField(null)
  }

  function applyRoute(route: RouteSearch) {
    setRoute(route.origin, route.destination)
  }

  function swapRoute() {
    setRoute(destination, origin)
  }

  function selectAirport(field: AirportField, airport: Airport) {
    if (field === 'origin') {
      setOrigin(airport.code)
      setOriginQuery(airportDisplayName(airport))
    } else {
      setDestination(airport.code)
      setDestinationQuery(airportDisplayName(airport))
    }
    setActiveAirportField(null)
  }

  function clearAirportField(field: AirportField) {
    if (field === 'origin') {
      setOrigin('')
      setOriginQuery('')
    } else {
      setDestination('')
      setDestinationQuery('')
    }
    setActiveAirportField(field)
    setError('출발/도착 도시를 검색해 공항을 선택해주세요.')
  }

  function updateAirportQuery(field: AirportField, value: string) {
    const directCode = formatAirportCode(value)
    const directAirport = directCode.length === 3 ? findAirportByCode(directCode) : undefined

    if (field === 'origin') {
      setOriginQuery(directAirport ? airportDisplayName(directAirport) : value)
      setOrigin(directAirport?.code ?? '')
    } else {
      setDestinationQuery(directAirport ? airportDisplayName(directAirport) : value)
      setDestination(directAirport?.code ?? '')
    }
    setActiveAirportField(field)
  }

  function validateSearch() {
    if (origin.length !== 3 || destination.length !== 3) return '출발/도착 도시를 검색해 공항을 선택해주세요.'
    if (!departureDate) return '출발일을 선택해주세요.'
    if (tripType === 'round-trip' && (!returnDate || returnDate <= departureDate)) return '귀국일은 출발일 이후로 선택해주세요.'
    return null
  }

  async function handleSearch() {
    const validationError = validateSearch()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedOffer(null)
    try {
      const flightResult = await searchFlightOffers({
        origin,
        destination,
        departureDate,
        returnDate: tripType === 'round-trip' && returnDate ? returnDate : undefined,
        adults: Number(adults) || 1,
        currency,
      })
      setOffers(flightResult.offers)
      setResultMode(flightResult.mode)
      updateRecentRoutes({ origin, destination })
    } catch {
      setError('정보를 불러오지 못했어요. 백엔드를 확인해주세요.')
      setOffers([])
      setResultMode(null)
    } finally {
      setIsLoading(false)
    }
  }

  function renderAirportField(field: AirportField, label: string, value: string, suggestions: Airport[]) {
    const query = field === 'origin' ? originQuery : destinationQuery
    return (
      <label className="airport-field">
        {label}
        <div className="airport-input-wrap">
          <input
            value={query}
            onChange={(event) => updateAirportQuery(field, event.target.value)}
            onFocus={() => setActiveAirportField(field)}
            aria-label={`${label} 도시 또는 공항`}
            aria-controls={`${field}-airport-options`}
            aria-expanded={activeAirportField === field}
            autoComplete="off"
            placeholder="도시명·공항명·코드"
          />
          {query ? (
            <button
              type="button"
              className="airport-clear-button"
              aria-label={`${label} 입력 지우기`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => clearAirportField(field)}
            >
              ×
            </button>
          ) : null}
        </div>
        {value ? <span className="selected-code">선택됨 · {value}</span> : <span className="selected-code empty-code">공항을 선택해주세요</span>}
        {activeAirportField === field && suggestions.length > 0 ? (
          <div className="airport-options" role="listbox" id={`${field}-airport-options`} aria-label={`${label} 공항 추천`}>
            {suggestions.map((airport) => (
              <button
                key={airport.code}
                type="button"
                role="option"
                aria-label={airportOptionLabel(airport)}
                className="airport-option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectAirport(field, airport)}
              >
                <strong>{airport.cityKo} · {airport.code}</strong>
                <span>{airport.airportKo} · {airport.cityEn}</span>
                <small>{airport.countryKo}</small>
              </button>
            ))}
          </div>
        ) : null}
      </label>
    )
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-text">
          <p className="eyebrow">Flight helper</p>
          <h1>SkyTrip</h1>
          <p className="hero-copy">원하는 항공권을 찾으세요.</p>
        </div>
      </section>

      <div className="app-layout">
        <div className="primary-panel">
          <section className="search-card" aria-label="항공권 검색 폼">
            <div className="section-heading">
              <p className="eyebrow">Search</p>
              <h2>여정 입력</h2>
            </div>
            <div className="trip-toggle" aria-label="여정 유형">
              <button type="button" className={tripType === 'one-way' ? 'toggle-active' : 'toggle-button'} onClick={() => setTripType('one-way')}>편도</button>
              <button type="button" className={tripType === 'round-trip' ? 'toggle-active' : 'toggle-button'} onClick={() => setTripType('round-trip')}>왕복</button>
            </div>
            <div className="route-chips" aria-label="인기 노선">
              {popularRoutes.map((route) => (
                <button key={route.label} type="button" className="chip-button" onClick={() => applyRoute(route)}>{route.label}</button>
              ))}
            </div>
            {recentRoutes.length > 0 ? (
              <div className="route-chips recent-routes" aria-label="최근 검색">
                <strong>최근 검색</strong>
                {recentRoutes.map((route) => (
                  <button key={`${route.origin}-${route.destination}`} type="button" className="chip-button" onClick={() => applyRoute(route)}>{displayRoute(route)}</button>
                ))}
              </div>
            ) : null}
            <div className="route-picker">
              {renderAirportField('origin', '출발', origin, originSuggestions)}
              <button type="button" className="swap-button" aria-label="출발지와 도착지 바꾸기" onClick={swapRoute}>⇄</button>
              {renderAirportField('destination', '도착', destination, destinationSuggestions)}
            </div>
            <div className="input-grid compact-grid">
              <label>
                출발일
                <input type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} aria-label="출발일" />
              </label>
              {tripType === 'round-trip' ? (
                <label>
                  귀국일
                  <input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} aria-label="귀국일" placeholder="선택" />
                </label>
              ) : null}
              <label>
                성인 수
                <input type="number" min="1" value={adults} onChange={(event) => setAdults(event.target.value)} aria-label="성인 수" />
              </label>
              <label>
                통화
                <select value={currency} onChange={(event) => setCurrency(event.target.value)} aria-label="통화">
                  <option value="KRW">KRW</option>
                  <option value="USD">USD</option>
                  <option value="JPY">JPY</option>
                </select>
              </label>
              <label>
                정렬
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="정렬">
                  <option value="recommended">추천순</option>
                  <option value="price">가격 낮은순</option>
                  <option value="departure">출발 빠른순</option>
                  <option value="stops">경유 적은순</option>
                </select>
              </label>
            </div>
            <button type="button" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? '검색 중' : '항공권 검색'}
            </button>
            {error ? <p className="error-message">{error}</p> : null}
          </section>

          <section className="flight-map-card" aria-label="선택한 여정 미리보기">
            <div>
              <p className="eyebrow">Route map</p>
              <h2>{airportLabel(origin)} 출발 · {airportLabel(destination)} 도착</h2>
              <p>출발일 {departureDate || '선택 전'} · {tripType === 'round-trip' ? '왕복' : '편도'}</p>
            </div>
            <div className="route-visual" aria-hidden="true">
              <span>{origin}</span>
              <i />
              <span>{destination}</span>
            </div>
          </section>
        </div>

        <div className="secondary-panel">
          <section className="results-card" aria-label="항공권 후보">
            <div className="section-heading results-heading">
              <div>
                <p className="eyebrow">Offers</p>
                <h2>추천 항공권</h2>
              </div>
              {currentSourceLabel ? (
                <div className="result-meta" aria-label="검색 결과 상태">
                  <span>{currentSourceLabel}</span>
                  {currentMinimumPrice ? <strong>{currentMinimumPrice}</strong> : null}
                </div>
              ) : null}
            </div>
            {offers.length === 0 ? (
              <div className="empty-preview">
                <div className="preview-plane" aria-hidden="true">✈</div>
                <strong>검색하면 이곳에 추천 항공권이 뜹니다.</strong>
                <p>{airportLabel(origin)}에서 {airportLabel(destination)}까지, 가격·시간·예약 링크를 한눈에 비교하세요.</p>
                <span>예상 카드 · 항공사 · 시간 · 가격 · 상세 보기</span>
              </div>
            ) : (
              <div className="offer-list">
                {displayedOffers.map((offer) => (
                  <article className="offer-card" key={offer.id} aria-label={`${offer.airline} ${offer.origin} ${offer.destination}`}>
                    <div>
                      <strong>{offer.airline}</strong>
                      <p>{offer.origin} → {offer.destination}</p>
                      <p>{formatFlightTime(offer)}</p>
                      <small>{offer.stops === 0 ? '직항' : `${offer.stops}회 경유`} · 예약 사이트 연결</small>
                      <div className="booking-links">
                        {offer.booking_url ? (
                          <a href={offer.booking_url} target="_blank" rel="noreferrer">Aviasales에서 보기</a>
                        ) : null}
                        <a href={bookingUrl(offer, 'google')} target="_blank" rel="noreferrer">Google Flights에서 보기</a>
                        <a href={bookingUrl(offer, 'skyscanner')} target="_blank" rel="noreferrer">Skyscanner에서 보기</a>
                      </div>
                    </div>
                    <div className="offer-action">
                      <b>{formatCurrency(offer.price, offer.currency)}</b>
                      <button type="button" className="ghost-button" onClick={() => setSelectedOffer(offer)}>상세 보기</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {favorites.length > 0 ? (
            <section className="saved-card" aria-label="저장한 항공편">
              <div className="saved-header">
                <div className="section-heading">
                  <p className="eyebrow">Saved</p>
                  <h2>저장한 항공편</h2>
                </div>
                <div className="saved-tools">
                  <span className="saved-count">저장 {favorites.length}</span>
                  <button type="button" className="ghost-button danger-button" onClick={clearFavorites}>저장 전체 삭제</button>
                </div>
              </div>
              <div className="saved-list">
                {favorites.map((favorite) => (
                  <article className="saved-item" key={favorite.id}>
                    <div>
                      <strong>{favorite.airline} · {favorite.origin} → {favorite.destination}</strong>
                      <p>{timeParts(favorite).departure} · {timeParts(favorite).arrival}</p>
                      <p>출발날짜 {dateParts(favorite).departure}</p>
                      <p>도착날짜 {dateParts(favorite).arrival}</p>
                    </div>
                    <b>{formatCurrency(favorite.price, favorite.currency)}</b>
                    <div className="saved-actions">
                      <button type="button" className="ghost-button" onClick={() => setSelectedOffer(favorite)}>저장 항공편 상세</button>
                      <button type="button" className="ghost-button danger-button" onClick={() => removeFavorite(favorite.id)}>저장 삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="mobile-action-bar" aria-label="모바일 빠른 실행">
        <div>
          <strong>{airportLabel(origin)} 출발</strong>
          <span>{airportLabel(destination)} 도착 · {tripType === 'round-trip' ? '왕복' : '편도'} · 성인 {Number(adults) || 1}명</span>
        </div>
        <button type="button" aria-label="모바일 항공권 검색" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '검색 중' : '검색하기'}
        </button>
      </div>

      {selectedOffer ? (
        <div className="modal-backdrop" role="presentation">
          <section className="detail-modal" role="dialog" aria-modal="true" aria-label="항공권 상세">
            <div className="section-heading">
              <p className="eyebrow">Detail</p>
              <h2>항공권 상세</h2>
            </div>
            <dl className="detail-list">
              <div><dt>항공사</dt><dd>{selectedOffer.airline}</dd></div>
              <div><dt>노선</dt><dd>{formatDetailRoute(selectedOffer)}</dd></div>
              <div><dt>출발날짜</dt><dd>{dateParts(selectedOffer).departure}</dd></div>
              <div><dt>도착날짜</dt><dd>{dateParts(selectedOffer).arrival}</dd></div>
              <div><dt>비행시간</dt><dd>{selectedOffer.duration}</dd></div>
              <div><dt>가격</dt><dd>{formatCurrency(selectedOffer.price, selectedOffer.currency)}</dd></div>
              <div><dt>상태</dt><dd>예약 사이트에서 최종 확인</dd></div>
            </dl>
            <div className="modal-actions">
              <button type="button" onClick={() => saveFavorite(selectedOffer)} disabled={selectedSaved}>
                {selectedSaved ? '저장됨' : '관심 항공편 저장'}
              </button>
              <button type="button" className="ghost-button" onClick={() => setSelectedOffer(null)}>닫기</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
