import { useMemo, useState } from 'react'
import { getTripContext, searchFlightOffers, type FlightOffer, type TripContext } from './api'

const apiBadges = ['Aviasales', 'Open-Meteo', '환율', '백업 데이터']
const favoriteStorageKey = 'skytrip:favorites'
type TripType = 'one-way' | 'round-trip'

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

function exchangeTimestampLabel(value?: string) {
  if (!value) return '환율 기준 · 실시간 확인'
  return `환율 기준 · ${value.slice(0, 10)}`
}

function App() {
  const [origin, setOrigin] = useState('ICN')
  const [destination, setDestination] = useState('NRT')
  const [departureDate, setDepartureDate] = useState('2026-06-01')
  const [returnDate, setReturnDate] = useState('')
  const [tripType, setTripType] = useState<TripType>('one-way')
  const [adults, setAdults] = useState('1')
  const [currency, setCurrency] = useState('KRW')
  const [offers, setOffers] = useState<FlightOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null)
  const [favorites, setFavorites] = useState<FlightOffer[]>(readFavorites)
  const [tripContext, setTripContext] = useState<TripContext | null>(null)
  const [lastSearchSummary, setLastSearchSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function applyRoute(route: (typeof popularRoutes)[number]) {
    setOrigin(route.origin)
    setDestination(route.destination)
  }

  function validateSearch() {
    if (origin.length !== 3 || destination.length !== 3) return '공항 코드는 3자리로 입력해주세요.'
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
    setTripContext(null)
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
      setLastSearchSummary(`${origin} → ${destination} · ${tripType === 'round-trip' ? '왕복' : '편도'} · 성인 ${Number(adults) || 1}명`)
      const contextResult = await getTripContext({ destination, amount: 200, currency: 'USD', live: true })
      setTripContext(contextResult)
    } catch {
      setError('정보를 불러오지 못했어요. 백엔드를 확인해주세요.')
      setOffers([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-text">
          <p className="eyebrow">Flight helper</p>
          <h1>SkyTrip</h1>
          <p className="hero-copy">항공권·날씨·환율을 한 번에 확인하세요.</p>
        </div>
        <div className="api-panel" aria-label="연동 상태">
          <p>연동 상태</p>
          <div className="api-badges">
            {apiBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="insight-strip" aria-label="여행 준비 요약">
        <article>
          <span>01</span>
          <strong>검색</strong>
          <p>노선과 날짜를 입력하세요.</p>
        </article>
        <article>
          <span>02</span>
          <strong>비교</strong>
          <p>항공권·날씨·환율을 같이 봅니다.</p>
        </article>
        <article>
          <span>03</span>
          <strong>저장</strong>
          <p>마음에 드는 항공편을 보관하세요.</p>
        </article>
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
        <div className="input-grid">
          <label>
            출발
            <input value={origin} onChange={(event) => setOrigin(formatAirportCode(event.target.value))} aria-label="출발 공항" maxLength={3} />
          </label>
          <label>
            도착
            <input value={destination} onChange={(event) => setDestination(formatAirportCode(event.target.value))} aria-label="도착 공항" maxLength={3} />
          </label>
          <label>
            출발일
            <input value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} aria-label="출발일" />
          </label>
          {tripType === 'round-trip' ? (
            <label>
              귀국일
              <input value={returnDate} onChange={(event) => setReturnDate(event.target.value)} aria-label="귀국일" placeholder="선택" />
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
        </div>
        {lastSearchSummary ? (
          <div className="search-summary" aria-label="검색 조건">
            <strong>검색 조건</strong>
            <span>{lastSearchSummary}</span>
          </div>
        ) : null}
        <button type="button" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '검색 중' : '항공권 검색'}
        </button>
        {error ? <p className="error-message">{error}</p> : null}
      </section>

          <section className="flight-map-card" aria-label="선택한 여정 미리보기">
            <div>
              <p className="eyebrow">Route map</p>
              <h2>{origin} 출발 · {destination} 도착</h2>
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
        <div className="section-heading">
          <p className="eyebrow">Offers</p>
          <h2>추천 항공권</h2>
        </div>
        {offers.length === 0 ? (
          <div className="empty-preview">
            <div className="preview-plane" aria-hidden="true">✈</div>
            <strong>검색하면 이곳에 추천 항공권이 뜹니다.</strong>
            <p>{origin}에서 {destination}까지, 가격·시간·예약 링크를 한눈에 비교하세요.</p>
            <span>예상 카드 · 항공사 · 시간 · 가격 · 상세 보기</span>
          </div>
        ) : (
          <div className="offer-list">
            {offers.map((offer) => (
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

      {tripContext ? (
        <section className="context-card" aria-label="여행 체크">
          <div className="section-heading">
            <p className="eyebrow">Live</p>
            <h2>여행 체크</h2>
          </div>
          <div className="context-grid">
            <p>
              <strong>날씨</strong>
              <span>도착지 기준 · {tripContext.weather.summary} · {tripContext.weather.temperature_c}℃</span>
            </p>
            <p>
              <strong>환율</strong>
              <span>200 USD 환산 · 약 {tripContext.exchange.converted_amount?.toLocaleString('ko-KR')} KRW</span>
              <small>{exchangeTimestampLabel(tripContext.exchange.updated_at)}</small>
            </p>
            {tripContext.travel_tip ? (
              <p>
                <strong>여행 코멘트</strong>
                <span>{tripContext.travel_tip}</span>
              </p>
            ) : null}
          </div>
          {tripContext.forecast?.length ? (
            <div className="forecast-panel">
              <strong>3일 날씨</strong>
              <div className="forecast-list">
                {tripContext.forecast.map((day) => (
                  <p key={day.date}>
                    <span>{day.date.slice(5)}</span>
                    <b>{day.summary}</b>
                    <small>{day.min_c}℃ / {day.max_c}℃ · 강수 {day.precipitation_probability}%</small>
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

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
          <strong>{origin} 출발</strong>
          <span>{destination} 도착 · {tripType === 'round-trip' ? '왕복' : '편도'} · 성인 {Number(adults) || 1}명</span>
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
