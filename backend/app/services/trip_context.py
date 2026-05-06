from app.services.live_public_apis import fetch_exchange_rate, fetch_open_meteo_weather

AIRPORT_FIXTURES = {
    "NRT": {"iata": "NRT", "icao": "RJAA", "name": "Narita International Airport", "city": "Tokyo", "lat": 35.7719, "lon": 140.3929},
    "HND": {"iata": "HND", "icao": "RJTT", "name": "Tokyo Haneda Airport", "city": "Tokyo", "lat": 35.5494, "lon": 139.7798},
    "KIX": {"iata": "KIX", "icao": "RJBB", "name": "Kansai International Airport", "city": "Osaka", "lat": 34.4347, "lon": 135.2442},
    "CXR": {"iata": "CXR", "icao": "VVCR", "name": "Cam Ranh International Airport", "city": "Nha Trang", "lat": 11.9982, "lon": 109.2194},
    "BKK": {"iata": "BKK", "icao": "VTBS", "name": "Suvarnabhumi Airport", "city": "Bangkok", "lat": 13.69, "lon": 100.7501},
    "DMK": {"iata": "DMK", "icao": "VTBD", "name": "Don Mueang Airport", "city": "Bangkok", "lat": 13.9126, "lon": 100.6068},
    "JFK": {"iata": "JFK", "icao": "KJFK", "name": "John F. Kennedy International Airport", "city": "New York", "lat": 40.6413, "lon": -73.7781},
    "ICN": {"iata": "ICN", "icao": "RKSI", "name": "Incheon International Airport", "city": "Seoul", "lat": 37.4602, "lon": 126.4407},
    "GMP": {"iata": "GMP", "icao": "RKSS", "name": "Gimpo International Airport", "city": "Seoul", "lat": 37.5583, "lon": 126.7906},
    "PUS": {"iata": "PUS", "icao": "RKPK", "name": "Gimhae International Airport", "city": "Busan", "lat": 35.1795, "lon": 128.9382},
    "CJU": {"iata": "CJU", "icao": "RKPC", "name": "Jeju International Airport", "city": "Jeju", "lat": 33.5113, "lon": 126.4930},
    "FUK": {"iata": "FUK", "icao": "RJFF", "name": "Fukuoka Airport", "city": "Fukuoka", "lat": 33.5859, "lon": 130.4506},
    "CTS": {"iata": "CTS", "icao": "RJCC", "name": "New Chitose Airport", "city": "Sapporo", "lat": 42.7752, "lon": 141.6923},
    "SIN": {"iata": "SIN", "icao": "WSSS", "name": "Changi Airport", "city": "Singapore", "lat": 1.3644, "lon": 103.9915},
    "DAD": {"iata": "DAD", "icao": "VVDN", "name": "Da Nang International Airport", "city": "Da Nang", "lat": 16.0439, "lon": 108.1994},
    "SGN": {"iata": "SGN", "icao": "VVTS", "name": "Tan Son Nhat International Airport", "city": "Ho Chi Minh City", "lat": 10.8188, "lon": 106.6519},
    "HAN": {"iata": "HAN", "icao": "VVNB", "name": "Noi Bai International Airport", "city": "Hanoi", "lat": 21.2212, "lon": 105.8072},
    "PQC": {"iata": "PQC", "icao": "VVPQ", "name": "Phu Quoc International Airport", "city": "Phu Quoc", "lat": 10.1698, "lon": 103.9931},
    "HKT": {"iata": "HKT", "icao": "VTSP", "name": "Phuket International Airport", "city": "Phuket", "lat": 8.1132, "lon": 98.3169},
    "CNX": {"iata": "CNX", "icao": "VTCC", "name": "Chiang Mai International Airport", "city": "Chiang Mai", "lat": 18.7668, "lon": 98.9626},
    "TPE": {"iata": "TPE", "icao": "RCTP", "name": "Taiwan Taoyuan International Airport", "city": "Taipei", "lat": 25.0797, "lon": 121.2342},
    "HKG": {"iata": "HKG", "icao": "VHHH", "name": "Hong Kong International Airport", "city": "Hong Kong", "lat": 22.3080, "lon": 113.9185},
    "MNL": {"iata": "MNL", "icao": "RPLL", "name": "Ninoy Aquino International Airport", "city": "Manila", "lat": 14.5086, "lon": 121.0194},
    "CRK": {"iata": "CRK", "icao": "RPLC", "name": "Clark International Airport", "city": "Clark", "lat": 15.1858, "lon": 120.5603},
    "MPH": {"iata": "MPH", "icao": "RPVE", "name": "Godofredo P. Ramos Airport", "city": "Boracay", "lat": 11.9245, "lon": 121.9541},
    "DPS": {"iata": "DPS", "icao": "WADD", "name": "Ngurah Rai International Airport", "city": "Bali", "lat": -8.7482, "lon": 115.1672},
    "KUL": {"iata": "KUL", "icao": "WMKK", "name": "Kuala Lumpur International Airport", "city": "Kuala Lumpur", "lat": 2.7456, "lon": 101.7072},
    "GUM": {"iata": "GUM", "icao": "PGUM", "name": "Antonio B. Won Pat International Airport", "city": "Guam", "lat": 13.4839, "lon": 144.7973},
    "SPN": {"iata": "SPN", "icao": "PGSN", "name": "Saipan International Airport", "city": "Saipan", "lat": 15.1190, "lon": 145.7294},
    "CEB": {"iata": "CEB", "icao": "RPVM", "name": "Mactan-Cebu International Airport", "city": "Cebu", "lat": 10.3075, "lon": 123.9794},
    "LAX": {"iata": "LAX", "icao": "KLAX", "name": "Los Angeles International Airport", "city": "Los Angeles", "lat": 33.9416, "lon": -118.4085},
    "SFO": {"iata": "SFO", "icao": "KSFO", "name": "San Francisco International Airport", "city": "San Francisco", "lat": 37.6213, "lon": -122.3790},
    "LHR": {"iata": "LHR", "icao": "EGLL", "name": "Heathrow Airport", "city": "London", "lat": 51.4700, "lon": -0.4543},
    "CDG": {"iata": "CDG", "icao": "LFPG", "name": "Charles de Gaulle Airport", "city": "Paris", "lat": 49.0097, "lon": 2.5479},
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
