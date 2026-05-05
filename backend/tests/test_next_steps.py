from fastapi.testclient import TestClient

from app.main import app
from app.services.trip_context import build_trip_context


def test_trip_context_includes_three_day_forecast_exchange_timestamp_and_travel_tip(monkeypatch):
    def fake_weather(lat, lon):
        return {
            "provider": "Open-Meteo",
            "mode": "live",
            "summary": "비 예보",
            "temperature_c": 18.4,
            "wind_speed_kmh": 7.2,
            "risk": "보통",
            "forecast": [
                {"date": "2026-06-01", "min_c": 16, "max_c": 22, "precipitation_probability": 70, "summary": "비 가능"},
                {"date": "2026-06-02", "min_c": 17, "max_c": 24, "precipitation_probability": 20, "summary": "맑음"},
                {"date": "2026-06-03", "min_c": 18, "max_c": 25, "precipitation_probability": 10, "summary": "맑음"},
            ],
        }

    def fake_exchange(amount, from_currency, to_currency="KRW"):
        return {
            "provider": "ExchangeRate-API Open",
            "mode": "live",
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "converted_amount": 270000.0,
            "updated_at": "2026-05-05T12:00:00Z",
        }

    monkeypatch.setattr("app.services.trip_context.fetch_open_meteo_weather", fake_weather)
    monkeypatch.setattr("app.services.trip_context.fetch_exchange_rate", fake_exchange)

    context = build_trip_context(destination="NRT", amount=200, currency="USD", live=True)

    assert context["forecast"][0]["precipitation_probability"] == 70
    assert context["exchange"]["updated_at"] == "2026-05-05T12:00:00Z"
    assert context["travel_tip"] == "비 예보가 있어 작은 우산을 챙기세요."


def test_cors_allows_configured_frontend_origin(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://skytrip.example.com")
    client = TestClient(app)

    response = client.options(
        "/api/flights/search",
        headers={
            "Origin": "https://skytrip.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://skytrip.example.com"
