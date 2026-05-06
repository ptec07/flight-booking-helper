from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

import httpx


@dataclass(frozen=True)
class KiwiTequilaFlightSearchQuery:
    origin: str
    destination: str
    departure_date: str
    adults: int = 1
    currency: str = "KRW"
    return_date: str | None = None
    max_results: int = 5


class HttpClient(Protocol):
    def get(self, url: str, params: dict, headers: dict | None = None) -> httpx.Response: ...


def format_tequila_date(value: str) -> str:
    return datetime.strptime(value, "%Y-%m-%d").strftime("%d/%m/%Y")


def format_seconds_duration(seconds: int | float | None) -> str:
    if not seconds:
        return ""
    total_minutes = int(seconds) // 60
    hours, minutes = divmod(total_minutes, 60)
    if hours and minutes:
        return f"{hours}h {minutes}m"
    if hours:
        return f"{hours}h 00m"
    return f"{minutes}m"


def normalize_kiwi_offer(raw_offer: dict, currency: str) -> dict:
    route = raw_offer.get("route") or []
    airline = (raw_offer.get("airlines") or [raw_offer.get("airline") or "Unknown"])[0]
    price = raw_offer.get("conversion", {}).get(currency.upper(), raw_offer.get("price", 0))

    return {
        "id": f"kiwi-{raw_offer.get('id')}",
        "airline": airline,
        "origin": raw_offer.get("flyFrom") or (route[0].get("flyFrom") if route else None),
        "destination": raw_offer.get("flyTo") or (route[-1].get("flyTo") if route else None),
        "departure_time": raw_offer.get("local_departure") or raw_offer.get("utc_departure"),
        "arrival_time": raw_offer.get("local_arrival") or raw_offer.get("utc_arrival"),
        "duration": format_seconds_duration((raw_offer.get("duration") or {}).get("total")),
        "stops": max(len(route) - 1, 0),
        "price": price,
        "currency": currency.upper(),
        "booking_hint": "Kiwi Tequila 검색 결과입니다. 최종 가격과 예약 조건은 Kiwi/예약 사이트에서 확인하세요.",
        "booking_url": raw_offer.get("deep_link"),
    }


class KiwiTequilaClient:
    def __init__(self, api_key: str, http_client: HttpClient | None = None, base_url: str = "https://api.tequila.kiwi.com"):
        self.api_key = api_key
        self.http_client = http_client or httpx.Client(timeout=12)
        self.base_url = base_url.rstrip("/")

    def search_flight_offers(self, query: KiwiTequilaFlightSearchQuery) -> list[dict]:
        departure = format_tequila_date(query.departure_date)
        params = {
            "fly_from": query.origin.upper(),
            "fly_to": query.destination.upper(),
            "date_from": departure,
            "date_to": departure,
            "adults": query.adults,
            "curr": query.currency.upper(),
            "limit": query.max_results,
            "sort": "price",
        }
        if query.return_date:
            return_date = format_tequila_date(query.return_date)
            params["return_from"] = return_date
            params["return_to"] = return_date

        response = self.http_client.get(
            f"{self.base_url}/v2/search",
            params=params,
            headers={"apikey": self.api_key},
        )
        response.raise_for_status()
        return [normalize_kiwi_offer(offer, query.currency) for offer in response.json().get("data", [])]
