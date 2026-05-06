export type RoundTripLeg = {
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  duration: string
  stops: number
  airline: string
}

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
  booking_url?: string | null
  round_trip?: { outbound: RoundTripLeg; return: RoundTripLeg }
}

export type FlightSearchResponse = {
  mode: string
  query?: Record<string, unknown>
  offers: FlightOffer[]
  round_trip_offers?: FlightOffer[]
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
