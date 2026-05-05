from app.services.live_public_apis import fetch_exchange_rate, fetch_open_meteo_weather


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class RecordingClient:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    def get(self, url, params):
        self.calls.append({"url": url, "params": params})
        return FakeResponse(self.payload)


def test_fetch_open_meteo_weather_normalizes_current_weather_and_three_day_forecast():
    client = RecordingClient(
        {
            "current": {
                "temperature_2m": 18.4,
                "wind_speed_10m": 7.2,
                "weather_code": 1,
            },
            "daily": {
                "time": ["2026-06-01", "2026-06-02", "2026-06-03"],
                "temperature_2m_min": [16, 17, 18],
                "temperature_2m_max": [22, 24, 25],
                "precipitation_probability_max": [70, 20, 10],
                "weather_code": [61, 1, 1],
            },
        }
    )

    weather = fetch_open_meteo_weather(lat=35.7719, lon=140.3929, client=client)

    assert client.calls[0]["url"] == "https://api.open-meteo.com/v1/forecast"
    assert client.calls[0]["params"]["latitude"] == 35.7719
    assert client.calls[0]["params"]["forecast_days"] == 3
    assert weather == {
        "provider": "Open-Meteo",
        "mode": "live",
        "summary": "대체로 맑음",
        "temperature_c": 18.4,
        "wind_speed_kmh": 7.2,
        "risk": "낮음",
        "forecast": [
            {"date": "2026-06-01", "min_c": 16, "max_c": 22, "precipitation_probability": 70, "summary": "비 예보"},
            {"date": "2026-06-02", "min_c": 17, "max_c": 24, "precipitation_probability": 20, "summary": "대체로 맑음"},
            {"date": "2026-06-03", "min_c": 18, "max_c": 25, "precipitation_probability": 10, "summary": "대체로 맑음"},
        ],
    }


def test_fetch_exchange_rate_normalizes_frankfurter_response_with_timestamp():
    client = RecordingClient({"amount": 200, "base": "USD", "date": "2026-05-05", "rates": {"KRW": 270000.0}})

    exchange = fetch_exchange_rate(amount=200, from_currency="USD", to_currency="KRW", client=client)

    assert client.calls[0]["url"] == "https://api.frankfurter.app/latest"
    assert client.calls[0]["params"] == {"amount": 200, "from": "USD", "to": "KRW"}
    assert exchange == {
        "provider": "Frankfurter",
        "mode": "live",
        "from": "USD",
        "to": "KRW",
        "amount": 200,
        "converted_amount": 270000.0,
        "updated_at": "2026-05-05",
    }


class FailingClient:
    def get(self, url, params):
        raise RuntimeError("primary exchange API blocked")


class ExchangeRateClient:
    def __init__(self):
        self.calls = []

    def get(self, url, params):
        self.calls.append({"url": url, "params": params})
        return FakeResponse({"result": "success", "base_code": "USD", "time_last_update_utc": "Tue, 05 May 2026 00:00:01 +0000", "rates": {"KRW": 1473.854485}})


def test_fetch_exchange_rate_uses_open_exchange_fallback_when_frankfurter_fails():
    fallback_client = ExchangeRateClient()

    exchange = fetch_exchange_rate(
        amount=200,
        from_currency="USD",
        to_currency="KRW",
        client=FailingClient(),
        fallback_client=fallback_client,
    )

    assert fallback_client.calls[0]["url"] == "https://open.er-api.com/v6/latest/USD"
    assert fallback_client.calls[0]["params"] == {}
    assert exchange == {
        "provider": "ExchangeRate-API Open",
        "mode": "live",
        "from": "USD",
        "to": "KRW",
        "amount": 200,
        "converted_amount": 294770.9,
        "updated_at": "Tue, 05 May 2026 00:00:01 +0000",
    }
