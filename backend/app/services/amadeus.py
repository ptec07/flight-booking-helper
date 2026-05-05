from dataclasses import dataclass
from typing import Protocol

import httpx


@dataclass(frozen=True)
class AmadeusCredentials:
    client_id: str
    client_secret: str


@dataclass(frozen=True)
class AmadeusFlightSearchQuery:
    origin: str
    destination: str
    departure_date: str
    adults: int = 1
    currency: str = "KRW"
    return_date: str | None = None
    max_results: int = 5


class HttpClient(Protocol):
    def post(self, url: str, data: dict, headers: dict | None = None) -> httpx.Response: ...
    def get(self, url: str, params: dict, headers: dict | None = None) -> httpx.Response: ...


def normalize_iso_duration(duration: str) -> str:
    if not duration.startswith("PT"):
        return duration
    rest = duration[2:]
    hours = 0
    minutes = 0
    if "H" in rest:
        hour_part, rest = rest.split("H", 1)
        hours = int(hour_part or 0)
    if "M" in rest:
        minute_part = rest.split("M", 1)[0]
        minutes = int(minute_part or 0)
    if hours and minutes:
        return f"{hours}h {minutes}m"
    if hours:
        return f"{hours}h 00m"
    return f"{minutes}m"


def normalize_amadeus_offer(raw_offer: dict) -> dict:
    itinerary = raw_offer.get("itineraries", [{}])[0]
    segments = itinerary.get("segments", [])
    first_segment = segments[0] if segments else {}
    last_segment = segments[-1] if segments else first_segment
    airline = (raw_offer.get("validatingAirlineCodes") or [first_segment.get("carrierCode", "Unknown")])[0]
    price = raw_offer.get("price", {})

    return {
        "id": f"amadeus-{raw_offer.get('id')}",
        "airline": airline,
        "origin": first_segment.get("departure", {}).get("iataCode"),
        "destination": last_segment.get("arrival", {}).get("iataCode"),
        "departure_time": first_segment.get("departure", {}).get("at"),
        "arrival_time": last_segment.get("arrival", {}).get("at"),
        "duration": normalize_iso_duration(itinerary.get("duration", "")),
        "stops": max(len(segments) - 1, 0),
        "price": float(price.get("grandTotal", 0)),
        "currency": price.get("currency"),
        "booking_hint": "Amadeus Flight Offers Search sandbox 결과입니다. 예약/발권은 별도 링크/상용 계약이 필요합니다.",
    }


class AmadeusClient:
    def __init__(self, credentials: AmadeusCredentials, http_client: HttpClient | None = None, base_url: str = "https://test.api.amadeus.com"):
        self.credentials = credentials
        self.http_client = http_client or httpx.Client(timeout=12)
        self.base_url = base_url.rstrip("/")
        self._access_token: str | None = None

    def get_access_token(self) -> str:
        if self._access_token:
            return self._access_token
        response = self.http_client.post(
            f"{self.base_url}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": self.credentials.client_id,
                "client_secret": self.credentials.client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        self._access_token = response.json()["access_token"]
        return self._access_token

    def search_flight_offers(self, query: AmadeusFlightSearchQuery) -> list[dict]:
        params = {
            "originLocationCode": query.origin.upper(),
            "destinationLocationCode": query.destination.upper(),
            "departureDate": query.departure_date,
            "adults": query.adults,
            "currencyCode": query.currency.upper(),
            "max": query.max_results,
        }
        if query.return_date:
            params["returnDate"] = query.return_date

        response = self.http_client.get(
            f"{self.base_url}/v2/shopping/flight-offers",
            params=params,
            headers={"Authorization": f"Bearer {self.get_access_token()}"},
        )
        response.raise_for_status()
        return [normalize_amadeus_offer(offer) for offer in response.json().get("data", [])]
