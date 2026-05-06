from app.services.flight_search import search_flights


class FakeAviasalesClient:
    def __init__(self, token, marker=None, base_url=None):
        self.token = token
        self.marker = marker
        self.base_url = base_url

    def search_flight_offers(self, query):
        return [
            {
                "id": "aviasales-test-1",
                "airline": "Aviasales",
                "origin": query.origin,
                "destination": query.destination,
                "departure_time": "2026-06-01T09:00:00+09:00",
                "arrival_time": "2026-06-01T11:20:00+09:00",
                "duration": "2h 20m",
                "stops": 0,
                "price": 198000,
                "currency": query.currency,
                "booking_hint": "Travelpayouts/Aviasales 가격 검색 결과입니다. 최종 가격과 예약 조건은 이동한 예약 사이트에서 확인하세요.",
                "booking_url": "https://www.aviasales.com/search/ICN0106NRT1",
            }
        ]


def test_search_flights_prefers_travelpayouts_aviasales_when_token_is_configured(monkeypatch):
    monkeypatch.setenv("TRAVELPAYOUTS_API_TOKEN", "tp-token")
    monkeypatch.setenv("TRAVELPAYOUTS_MARKER", "marker-1")
    monkeypatch.setenv("KIWI_TEQUILA_API_KEY", "kiwi-key")
    monkeypatch.setattr("app.services.flight_search.AviasalesClient", FakeAviasalesClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "aviasales"
    assert result["offers"][0]["id"] == "aviasales-test-1"
    assert result["offers"][0]["booking_url"].startswith("https://www.aviasales.com/")


def test_search_flights_falls_back_when_travelpayouts_aviasales_fails(monkeypatch):
    class FailingAviasalesClient(FakeAviasalesClient):
        def search_flight_offers(self, query):
            raise RuntimeError("travelpayouts unavailable")

    monkeypatch.setenv("TRAVELPAYOUTS_API_TOKEN", "tp-token")
    monkeypatch.delenv("KIWI_TEQUILA_API_KEY", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_ID", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_SECRET", raising=False)
    monkeypatch.setattr("app.services.flight_search.AviasalesClient", FailingAviasalesClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "aviasales-fallback"
    assert result["offers"][0]["id"] == "fixture-icn-nrt-1"
    assert "Travelpayouts/Aviasales" in result["warning"]
