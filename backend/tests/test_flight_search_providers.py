import os

from app.services.flight_search import search_flights


class FakeKiwiClient:
    def __init__(self, api_key, base_url=None):
        self.api_key = api_key
        self.base_url = base_url

    def search_flight_offers(self, query):
        return [
            {
                "id": "kiwi-test-1",
                "airline": "Kiwi Demo",
                "origin": query.origin,
                "destination": query.destination,
                "departure_time": "2026-06-01T09:10:00.000Z",
                "arrival_time": "2026-06-01T11:30:00.000Z",
                "duration": "2h 20m",
                "stops": 0,
                "price": 210,
                "currency": query.currency,
                "booking_hint": "Kiwi Tequila 검색 결과입니다. 최종 가격과 예약 조건은 Kiwi/예약 사이트에서 확인하세요.",
                "booking_url": "https://www.kiwi.com/deep?offer=test",
            }
        ]


def test_search_flights_prefers_kiwi_tequila_when_key_is_configured(monkeypatch):
    monkeypatch.delenv("TRAVELPAYOUTS_API_TOKEN", raising=False)
    monkeypatch.setenv("KIWI_TEQUILA_API_KEY", "kiwi-key")
    monkeypatch.delenv("AMADEUS_CLIENT_ID", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_SECRET", raising=False)
    monkeypatch.setattr("app.services.flight_search.KiwiTequilaClient", FakeKiwiClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "USD",
        }
    )

    assert result["mode"] == "kiwi-tequila"
    assert result["offers"][0]["id"] == "kiwi-test-1"
    assert result["offers"][0]["booking_url"].startswith("https://www.kiwi.com/")


def test_search_flights_falls_back_when_kiwi_tequila_fails(monkeypatch):
    class FailingKiwiClient(FakeKiwiClient):
        def search_flight_offers(self, query):
            raise RuntimeError("upstream unavailable")

    monkeypatch.delenv("TRAVELPAYOUTS_API_TOKEN", raising=False)
    monkeypatch.setenv("KIWI_TEQUILA_API_KEY", "kiwi-key")
    monkeypatch.delenv("AMADEUS_CLIENT_ID", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_SECRET", raising=False)
    monkeypatch.setattr("app.services.flight_search.KiwiTequilaClient", FailingKiwiClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "kiwi-fallback"
    assert result["offers"][0]["id"] == "fixture-icn-nrt-1"
    assert "Kiwi Tequila" in result["warning"]
