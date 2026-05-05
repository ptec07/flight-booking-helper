from app.services.live_public_apis import fetch_exchange_rate, fetch_open_meteo_weather

AIRPORT_FIXTURES = {
    "NRT": {"iata": "NRT", "icao": "RJAA", "name": "Narita International Airport", "city": "Tokyo", "lat": 35.7719, "lon": 140.3929},
    "HND": {"iata": "HND", "icao": "RJTT", "name": "Tokyo Haneda Airport", "city": "Tokyo", "lat": 35.5494, "lon": 139.7798},
    "KIX": {"iata": "KIX", "icao": "RJBB", "name": "Kansai International Airport", "city": "Osaka", "lat": 34.4347, "lon": 135.2442},
    "BKK": {"iata": "BKK", "icao": "VTBS", "name": "Suvarnabhumi Airport", "city": "Bangkok", "lat": 13.69, "lon": 100.7501},
    "JFK": {"iata": "JFK", "icao": "KJFK", "name": "John F. Kennedy International Airport", "city": "New York", "lat": 40.6413, "lon": -73.7781},
    "ICN": {"iata": "ICN", "icao": "RKSI", "name": "Incheon International Airport", "city": "Seoul", "lat": 37.4602, "lon": 126.4407},
}


def fixture_forecast() -> list[dict]:
    return [
        {"date": "2026-06-01", "min_c": 17, "max_c": 24, "precipitation_probability": 20, "summary": "대체로 맑음"},
        {"date": "2026-06-02", "min_c": 18, "max_c": 25, "precipitation_probability": 30, "summary": "구름 조금"},
        {"date": "2026-06-03", "min_c": 18, "max_c": 26, "precipitation_probability": 20, "summary": "대체로 맑음"},
    ]


def fixture_weather() -> dict:
    return {
        "provider": "Open-Meteo",
        "mode": "fixture",
        "summary": "대체로 맑음",
        "temperature_c": 22,
        "wind_speed_kmh": None,
        "risk": "낮음",
        "forecast": fixture_forecast(),
    }


def fixture_exchange(amount: float, currency: str) -> dict:
    converted = round(amount * 1350, 2) if currency != "KRW" else amount
    return {
        "provider": "ExchangeRate-API Open",
        "mode": "fixture",
        "from": currency,
        "to": "KRW",
        "amount": amount,
        "converted_amount": converted,
        "updated_at": None,
    }


def build_travel_tip(weather: dict) -> str:
    summary = weather.get("summary", "")
    forecast = weather.get("forecast") or []
    precipitation = max((day.get("precipitation_probability") or 0 for day in forecast), default=0)
    if "비" in summary or precipitation >= 60:
        return "비 예보가 있어 작은 우산을 챙기세요."
    if "눈" in summary:
        return "미끄러운 길에 대비해 따뜻한 신발을 추천해요."
    if (weather.get("temperature_c") or 20) <= 10:
        return "쌀쌀한 날씨라 가벼운 겉옷을 챙기세요."
    return "날씨 리스크가 낮아 가볍게 출발하기 좋아요."


def build_trip_context(destination: str, amount: float, currency: str, live: bool = False) -> dict:
    airport = AIRPORT_FIXTURES.get(destination, {"iata": destination, "icao": destination, "name": "Unknown airport", "city": "Unknown", "lat": 0, "lon": 0})

    weather = fixture_weather()
    exchange = fixture_exchange(amount, currency)
    if live:
        try:
            weather = fetch_open_meteo_weather(lat=airport["lat"], lon=airport["lon"])
        except Exception:
            weather = fixture_weather() | {"mode": "fallback", "summary": "실시간 날씨 조회 실패, 백업 데이터 사용"}
        try:
            exchange = fetch_exchange_rate(amount=amount, from_currency=currency, to_currency="KRW")
        except Exception:
            exchange = fixture_exchange(amount, currency) | {"mode": "fallback"}

    forecast = weather.get("forecast") or fixture_forecast()

    return {
        "airport": airport,
        "weather": {key: value for key, value in weather.items() if key != "forecast"},
        "forecast": forecast,
        "travel_tip": build_travel_tip(weather),
        "exchange": exchange,
        "aviation_weather": {
            "provider": "AviationWeather",
            "mode": "fixture",
            "station": airport.get("icao"),
            "metar_summary": "시정 양호, 운항 리스크 낮음",
        },
        "aircraft_status": {
            "provider": "OpenSky Network",
            "mode": "fixture",
            "summary": "실시간 항공기 상태는 실제 항공편 식별자 연결 후 조회",
        },
    }
