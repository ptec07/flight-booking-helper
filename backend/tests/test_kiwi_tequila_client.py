from app.services.kiwi_tequila import KiwiTequilaClient, KiwiTequilaFlightSearchQuery


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class RecordingClient:
    def __init__(self):
        self.calls = []

    def get(self, url, params, headers=None):
        self.calls.append({"method": "GET", "url": url, "params": params, "headers": headers})
        return FakeResponse(
            {
                "data": [
                    {
                        "id": "offer-123",
                        "airlines": ["KE"],
                        "flyFrom": "ICN",
                        "flyTo": "NRT",
                        "local_departure": "2026-06-01T09:10:00.000Z",
                        "local_arrival": "2026-06-01T11:30:00.000Z",
                        "duration": {"total": 8400},
                        "route": [{"flyFrom": "ICN", "flyTo": "NRT"}],
                        "price": 280000,
                        "conversion": {"KRW": 280000},
                        "deep_link": "https://www.kiwi.com/deep?offer=123",
                    }
                ]
            }
        )


def test_kiwi_tequila_client_searches_and_normalizes_flight_offers():
    http = RecordingClient()
    client = KiwiTequilaClient(api_key="kiwi-key", http_client=http)

    offers = client.search_flight_offers(
        KiwiTequilaFlightSearchQuery(
            origin="icn",
            destination="nrt",
            departure_date="2026-06-01",
            adults=2,
            currency="krw",
        )
    )

    assert http.calls == [
        {
            "method": "GET",
            "url": "https://api.tequila.kiwi.com/v2/search",
            "params": {
                "fly_from": "ICN",
                "fly_to": "NRT",
                "date_from": "01/06/2026",
                "date_to": "01/06/2026",
                "adults": 2,
                "curr": "KRW",
                "limit": 5,
                "sort": "price",
            },
            "headers": {"apikey": "kiwi-key"},
        }
    ]
    assert offers == [
        {
            "id": "kiwi-offer-123",
            "airline": "KE",
            "origin": "ICN",
            "destination": "NRT",
            "departure_time": "2026-06-01T09:10:00.000Z",
            "arrival_time": "2026-06-01T11:30:00.000Z",
            "duration": "2h 20m",
            "stops": 0,
            "price": 280000,
            "currency": "KRW",
            "booking_hint": "Kiwi Tequila 검색 결과입니다. 최종 가격과 예약 조건은 Kiwi/예약 사이트에서 확인하세요.",
            "booking_url": "https://www.kiwi.com/deep?offer=123",
        }
    ]
