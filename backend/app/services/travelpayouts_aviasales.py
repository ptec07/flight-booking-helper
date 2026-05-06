from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Protocol
from urllib.parse import urlencode

import httpx


@dataclass(frozen=True)
class AviasalesFlightSearchQuery:
    origin: str
    destination: str
    departure_date: str
    adults: int = 1
    currency: str = "KRW"
    return_date: str | None = None
    max_results: int = 5


class HttpClient(Protocol):
    def get(self, url: str, params: dict) -> httpx.Response: ...


def format_minutes_duration(minutes: int | float | None) -> str:
    if not minutes:
        return ""
    total_minutes = int(minutes)
    hours, mins = divmod(total_minutes, 60)
    if hours and mins:
        return f"{hours}h {mins}m"
    if hours:
        return f"{hours}h 00m"
    return f"{mins}m"


def _parse_departure(value: str) -> datetime:
    if "T" in value:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return datetime.strptime(value, "%Y-%m-%d").replace(hour=9, minute=0)


def _arrival_time(departure_date: str, duration_minutes: int | float | None) -> str:
    departure = _parse_departure(departure_date)
    arrival = departure + timedelta(minutes=int(duration_minutes or 0))
    return arrival.isoformat()


def _booking_url(link: str | None, marker: str | None) -> str | None:
    if not link:
        return None
    if link.startswith("http://") or link.startswith("https://"):
        base = link
    else:
        base = f"https://www.aviasales.com{link if link.startswith('/') else '/' + link}"
    if marker and "marker=" not in base:
        joiner = "&" if "?" in base else "?"
        return f"{base}{joiner}{urlencode({'marker': marker})}"
    return base


def normalize_aviasales_offer(raw_offer: dict, currency: str, marker: str | None, index: int) -> dict:
    origin = (raw_offer.get("origin") or "").upper()
    destination = (raw_offer.get("destination") or "").upper()
    departure_date = raw_offer.get("depart_date") or raw_offer.get("departure_at") or datetime.utcnow().strftime("%Y-%m-%d")
    duration = raw_offer.get("duration")
    airline = raw_offer.get("airline") or raw_offer.get("gate") or "Aviasales"
    departure_time = _parse_departure(departure_date).isoformat()
    return {
        "id": f"aviasales-{origin}-{destination}-{departure_date}-{index}",
        "airline": airline,
        "origin": origin,
        "destination": destination,
        "departure_time": departure_time,
        "arrival_time": _arrival_time(departure_date, duration),
        "duration": format_minutes_duration(duration),
        "stops": int(raw_offer.get("number_of_changes", raw_offer.get("transfers", 0)) or 0),
        "price": raw_offer.get("value", raw_offer.get("price", 0)),
        "currency": currency.upper(),
        "booking_hint": "Travelpayouts/Aviasales 가격 검색 결과입니다. 최종 가격과 예약 조건은 이동한 예약 사이트에서 확인하세요.",
        "booking_url": _booking_url(raw_offer.get("link"), marker),
    }


class AviasalesClient:
    def __init__(
        self,
        token: str,
        marker: str | None = None,
        http_client: HttpClient | None = None,
        base_url: str = "https://api.travelpayouts.com",
    ):
        self.token = token
        self.marker = marker
        self.http_client = http_client or httpx.Client(timeout=12)
        self.base_url = base_url.rstrip("/")

    def search_flight_offers(self, query: AviasalesFlightSearchQuery) -> list[dict]:
        params = {
            "origin": query.origin.upper(),
            "destination": query.destination.upper(),
            "departure_at": query.departure_date,
            "currency": query.currency.upper(),
            "token": self.token,
            "one_way": "false" if query.return_date else "true",
            "limit": query.max_results,
        }
        if self.marker:
            params["marker"] = self.marker

        response = self.http_client.get(f"{self.base_url}/aviasales/v3/prices_for_dates", params=params)
        response.raise_for_status()
        payload = response.json()
        offers = payload.get("data", []) if isinstance(payload, dict) else []
        return [normalize_aviasales_offer(offer, query.currency, self.marker, index) for index, offer in enumerate(offers)]
