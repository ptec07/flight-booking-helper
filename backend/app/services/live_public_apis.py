from typing import Protocol

import httpx


class HttpClient(Protocol):
    def get(self, url: str, params: dict) -> httpx.Response: ...


def weather_code_summary(code: int | None) -> tuple[str, str]:
    if code is None:
        return "날씨 정보를 확인 중", "보통"
    if code in {0, 1, 2}:
        return "대체로 맑음", "낮음"
    if code in {3, 45, 48}:
        return "구름 또는 안개", "보통"
    if 51 <= code <= 67 or 80 <= code <= 82:
        return "비 예보", "보통"
    if 71 <= code <= 77 or 85 <= code <= 86:
        return "눈 예보", "높음"
    if code >= 95:
        return "뇌우 가능", "높음"
    return "날씨 변화 가능", "보통"


def summarize_forecast_code(code: int | None) -> str:
    return weather_code_summary(code)[0]


def fetch_open_meteo_weather(lat: float, lon: float, client: HttpClient | None = None) -> dict:
    owns_client = client is None
    client = client or httpx.Client(timeout=8)
    try:
        response = client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,wind_speed_10m,weather_code",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
                "forecast_days": 3,
                "timezone": "auto",
            },
        )
        response.raise_for_status()
        payload = response.json()
        current = payload.get("current", {})
        summary, risk = weather_code_summary(current.get("weather_code"))
        daily = payload.get("daily", {})
        dates = daily.get("time", [])[:3]
        forecast = []
        for index, date in enumerate(dates):
            forecast.append(
                {
                    "date": date,
                    "min_c": daily.get("temperature_2m_min", [None] * 3)[index],
                    "max_c": daily.get("temperature_2m_max", [None] * 3)[index],
                    "precipitation_probability": daily.get("precipitation_probability_max", [None] * 3)[index],
                    "summary": summarize_forecast_code(daily.get("weather_code", [None] * 3)[index]),
                }
            )
        return {
            "provider": "Open-Meteo",
            "mode": "live",
            "summary": summary,
            "temperature_c": current.get("temperature_2m"),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "risk": risk,
            "forecast": forecast,
        }
    finally:
        if owns_client and hasattr(client, "close"):
            client.close()


def fetch_open_exchange_rate(amount: float, from_currency: str, to_currency: str, client: HttpClient | None = None) -> dict:
    owns_client = client is None
    client = client or httpx.Client(timeout=8)
    try:
        response = client.get(f"https://open.er-api.com/v6/latest/{from_currency}", params={})
        response.raise_for_status()
        payload = response.json()
        rate = payload.get("rates", {}).get(to_currency)
        if payload.get("result") != "success" or rate is None:
            raise RuntimeError("fallback exchange API did not return a usable rate")
        return {
            "provider": "ExchangeRate-API Open",
            "mode": "live",
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "converted_amount": round(amount * rate, 2),
            "updated_at": payload.get("time_last_update_utc") or payload.get("time_last_update_unix"),
        }
    finally:
        if owns_client and hasattr(client, "close"):
            client.close()


def fetch_exchange_rate(
    amount: float,
    from_currency: str,
    to_currency: str = "KRW",
    client: HttpClient | None = None,
    fallback_client: HttpClient | None = None,
) -> dict:
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    if from_currency == to_currency:
        return {
            "provider": "Frankfurter",
            "mode": "live",
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "converted_amount": amount,
            "updated_at": None,
        }

    owns_client = client is None
    client = client or httpx.Client(timeout=8)
    try:
        response = client.get(
            "https://api.frankfurter.app/latest",
            params={"amount": amount, "from": from_currency, "to": to_currency},
        )
        response.raise_for_status()
        payload = response.json()
        converted = payload.get("rates", {}).get(to_currency)
        if converted is None:
            raise RuntimeError("Frankfurter did not return a usable rate")
        return {
            "provider": "Frankfurter",
            "mode": "live",
            "from": from_currency,
            "to": to_currency,
            "amount": payload.get("amount", amount),
            "converted_amount": converted,
            "updated_at": payload.get("date"),
        }
    except Exception:
        return fetch_open_exchange_rate(amount=amount, from_currency=from_currency, to_currency=to_currency, client=fallback_client)
    finally:
        if owns_client and hasattr(client, "close"):
            client.close()
