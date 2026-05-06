from fastapi.testclient import TestClient

from app.main import app


def test_search_flights_returns_normalized_fixture_offers(monkeypatch):
    monkeypatch.delenv("TRAVELPAYOUTS_API_TOKEN", raising=False)
    client = TestClient(app)

    response = client.get(
        "/api/flights/search",
        params={
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "return_date": "2026-06-05",
            "adults": 1,
            "currency": "KRW",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "fixture"
    assert body["query"]["origin"] == "ICN"
    assert len(body["offers"]) >= 2
    assert body["offers"][0] == {
        "id": "fixture-icn-nrt-1",
        "airline": "Korean Air",
        "origin": "ICN",
        "destination": "NRT",
        "departure_time": "2026-06-01T09:10:00+09:00",
        "arrival_time": "2026-06-01T11:30:00+09:00",
        "duration": "2h 20m",
        "stops": 0,
        "price": 280000,
        "currency": "KRW",
        "booking_hint": "Travelpayouts/Aviasales 연동 전 fixture 후보",
        "booking_url": None,
    }


def test_search_flights_pads_sparse_live_provider_results(monkeypatch):
    from app.services.flight_search import search_flights

    class SparseAviasalesClient:
        def __init__(self, *args, **kwargs):
            pass

        def search_flight_offers(self, query):
            return [
                {
                    "id": "live-only-1",
                    "airline": "Live Air",
                    "origin": query.origin,
                    "destination": query.destination,
                    "departure_time": f"{query.departure_date}T08:00:00+09:00",
                    "arrival_time": f"{query.departure_date}T10:00:00+09:00",
                    "duration": "2h 00m",
                    "stops": 0,
                    "price": 199000,
                    "currency": query.currency,
                    "booking_hint": "live",
                    "booking_url": "https://example.com/live",
                }
            ]

    monkeypatch.setenv("TRAVELPAYOUTS_API_TOKEN", "test-token")
    monkeypatch.setattr("app.services.flight_search.AviasalesClient", SparseAviasalesClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "KIX",
            "departure_date": "2026-05-11",
            "adults": 2,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "aviasales"
    assert len(result["offers"]) >= 3
    assert result["offers"][0]["id"] == "live-only-1"
    assert all(offer["origin"] == "ICN" and offer["destination"] == "KIX" for offer in result["offers"])


def test_trip_context_combines_weather_currency_and_aviation_status():
    client = TestClient(app)

    response = client.get("/api/trip/context", params={"destination": "NRT", "amount": 200, "currency": "USD"})

    assert response.status_code == 200
    body = response.json()
    assert body["airport"]["iata"] == "NRT"
    assert body["weather"]["provider"] == "Open-Meteo"
    assert body["weather"]["mode"] == "fixture"
    assert body["exchange"]["to"] == "KRW"
    assert body["exchange"]["mode"] == "fixture"
    assert body["aviation_weather"]["station"] == "RJAA"


def test_trip_context_knows_nha_trang_cam_ranh_airport():
    client = TestClient(app)

    response = client.get("/api/trip/context", params={"destination": "CXR", "amount": 200, "currency": "USD"})

    assert response.status_code == 200
    body = response.json()
    assert body["airport"]["iata"] == "CXR"
    assert body["airport"]["icao"] == "VVCR"
    assert body["airport"]["city"] == "Nha Trang"
    assert body["airport"]["lat"] == 11.9982
    assert body["aviation_weather"]["station"] == "VVCR"


def test_trip_context_has_airport_metadata_for_popular_catalog_codes():
    from app.services.trip_context import AIRPORT_FIXTURES

    popular_codes = {
        "ICN", "GMP", "PUS", "CJU", "NRT", "HND", "KIX", "FUK", "CTS",
        "BKK", "DMK", "SIN", "CXR", "DAD", "SGN", "HAN", "PQC", "HKT", "CNX",
        "TPE", "HKG", "MNL", "CRK", "MPH", "DPS", "KUL", "DOH", "GUM", "SPN", "CEB",
        "JFK", "LAX", "SFO", "LHR", "CDG",
    }

    missing_codes = sorted(popular_codes - set(AIRPORT_FIXTURES))

    assert missing_codes == []


def test_trip_context_has_airport_metadata_for_generated_global_codes():
    from app.services.trip_context import AIRPORT_FIXTURES

    assert len(AIRPORT_FIXTURES) >= 4000
    assert AIRPORT_FIXTURES["ZRH"]["city"] == "Zurich"
    assert AIRPORT_FIXTURES["IST"]["city"] == "Istanbul"
    assert AIRPORT_FIXTURES["CAI"]["city"] == "Cairo"
    assert AIRPORT_FIXTURES["LIM"]["city"] == "Lima"
    assert AIRPORT_FIXTURES["DOH"]["city"] == "Doha"


def test_trip_context_can_use_live_no_auth_public_api_wrappers(monkeypatch):
    def fake_weather(lat, lon):
        return {
            "provider": "Open-Meteo",
            "mode": "live",
            "summary": "대체로 맑음",
            "temperature_c": 18.4,
            "wind_speed_kmh": 7.2,
            "risk": "낮음",
        }

    def fake_exchange(amount, from_currency, to_currency="KRW"):
        return {
            "provider": "Frankfurter",
            "mode": "live",
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "converted_amount": 270000.0,
        }

    monkeypatch.setattr("app.services.trip_context.fetch_open_meteo_weather", fake_weather)
    monkeypatch.setattr("app.services.trip_context.fetch_exchange_rate", fake_exchange)
    client = TestClient(app)

    response = client.get("/api/trip/context", params={"destination": "NRT", "amount": 200, "currency": "USD", "live": "true"})

    assert response.status_code == 200
    body = response.json()
    assert body["weather"]["mode"] == "live"
    assert body["weather"]["temperature_c"] == 18.4
    assert body["exchange"]["mode"] == "live"
    assert body["exchange"]["converted_amount"] == 270000.0
