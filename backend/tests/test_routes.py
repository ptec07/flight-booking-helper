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
        "TPE", "HKG", "MNL", "CRK", "MPH", "DPS", "KUL", "GUM", "SPN", "CEB",
        "JFK", "LAX", "SFO", "LHR", "CDG",
    }

    missing_codes = sorted(popular_codes - set(AIRPORT_FIXTURES))

    assert missing_codes == []


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
