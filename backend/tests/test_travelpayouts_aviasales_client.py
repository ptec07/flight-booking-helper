from app.services.travelpayouts_aviasales import AviasalesClient, AviasalesFlightSearchQuery


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class RecordingHttpClient:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    def get(self, url, params):
        self.calls.append({"url": url, "params": params})
        return FakeResponse(self.payload)


def test_aviasales_client_calls_prices_for_dates_and_normalizes_offers():
    http = RecordingHttpClient(
        {
            "success": True,
            "data": [
                {
                    "origin": "ICN",
                    "destination": "NRT",
                    "depart_date": "2026-06-01",
                    "return_date": "2026-06-07",
                    "value": 198000,
                    "currency": "KRW",
                    "airline": "KE",
                    "flight_number": "KE703",
                    "number_of_changes": 0,
                    "duration": 140,
                    "link": "/search/ICN0106NRT1",
                }
            ],
        }
    )
    client = AviasalesClient(token="tp-token", marker="marker-1", http_client=http)

    offers = client.search_flight_offers(
        AviasalesFlightSearchQuery(
            origin="icn",
            destination="nrt",
            departure_date="2026-06-01",
            return_date="2026-06-07",
            adults=1,
            currency="krw",
        )
    )

    assert http.calls == [
        {
            "url": "https://api.travelpayouts.com/aviasales/v3/prices_for_dates",
            "params": {
                "origin": "ICN",
                "destination": "NRT",
                "departure_at": "2026-06-01",
                "currency": "KRW",
                "token": "tp-token",
                "marker": "marker-1",
                "one_way": "false",
                "limit": 5,
            },
        }
    ]
    assert offers == [
        {
            "id": "aviasales-ICN-NRT-2026-06-01-0",
            "airline": "KE",
            "origin": "ICN",
            "destination": "NRT",
            "departure_time": "2026-06-01T09:00:00+09:00",
            "arrival_time": "2026-06-01T11:20:00+09:00",
            "duration": "2h 20m",
            "stops": 0,
            "price": 198000,
            "currency": "KRW",
            "booking_hint": "Travelpayouts/Aviasales 가격 검색 결과입니다. 최종 가격과 예약 조건은 이동한 예약 사이트에서 확인하세요.",
            "booking_url": "https://www.aviasales.com/search/ICN0106NRT1?marker=marker-1",
        }
    ]


def test_aviasales_client_uses_one_way_when_return_date_is_missing():
    http = RecordingHttpClient({"success": True, "data": []})
    client = AviasalesClient(token="tp-token", http_client=http)

    client.search_flight_offers(
        AviasalesFlightSearchQuery(
            origin="ICN",
            destination="NRT",
            departure_date="2026-06-01",
            currency="USD",
        )
    )

    assert http.calls[0]["params"]["one_way"] == "true"
    assert "marker" not in http.calls[0]["params"]
