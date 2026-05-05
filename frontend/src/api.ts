export type FlightOffer = {
  id: string
  airline: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  duration: string
  stops: number
  price: number
  currency: string
  booking_hint: string
}

export type FlightSearchResponse = {
  mode: string
  query?: Record<string, unknown>
  offers: FlightOffer[]
}

export type ForecastDay = {
  date: string
  min_c?: number
  max_c?: number
  precipitation_probability?: number
  summary?: string
}

export type TripContext = {
  weather: { mode: string; summary?: string; temperature_c?: number; wind_speed_kmh?: number; risk?: string }
  exchange: { mode: string; converted_amount?: number; from?: string; to?: string; updated_at?: string }
  forecast?: ForecastDay[]
  travel_tip?: string
}

function apiUrl(path: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  return `${baseUrl}${path}`
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function searchFlightOffers(query: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults?: number
  currency?: string
}): Promise<FlightSearchResponse> {
  const params = new URLSearchParams({
    origin: query.origin.toUpperCase(),
    destination: query.destination.toUpperCase(),
    departure_date: query.departureDate,
  })
  if (query.returnDate) params.set('return_date', query.returnDate)
  if (query.adults) params.set('adults', String(query.adults))
  if (query.currency) params.set('currency', query.currency.toUpperCase())

  const response = await fetch(apiUrl(`/api/flights/search?${params.toString()}`))
  return parseJsonResponse<FlightSearchResponse>(response)
}

export async function getTripContext(query: {
  destination: string
  amount: number
  currency: string
  live?: boolean
}): Promise<TripContext> {
  const params = new URLSearchParams({
    destination: query.destination.toUpperCase(),
    amount: String(query.amount),
    currency: query.currency.toUpperCase(),
  })
  if (query.live) params.set('live', 'true')

  const response = await fetch(apiUrl(`/api/trip/context?${params.toString()}`))
  return parseJsonResponse<TripContext>(response)
}
