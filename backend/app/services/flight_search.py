import os

from app.services.amadeus import AmadeusClient, AmadeusCredentials, AmadeusFlightSearchQuery
from app.services.kiwi_tequila import KiwiTequilaClient, KiwiTequilaFlightSearchQuery
from app.services.travelpayouts_aviasales import AviasalesClient, AviasalesFlightSearchQuery


def search_fixture_flights(query: dict) -> list[dict]:
    origin = query["origin"]
    destination = query["destination"]
    currency = query.get("currency", "KRW")

    if origin == "ICN" and destination == "NRT":
        return [
            {
                "id": "fixture-icn-nrt-1",
                "airline": "Korean Air",
                "origin": "ICN",
                "destination": "NRT",
                "departure_time": "2026-06-01T09:10:00+09:00",
                "arrival_time": "2026-06-01T11:30:00+09:00",
                "duration": "2h 20m",
                "stops": 0,
                "price": 280000 if currency == "KRW" else 210,
                "currency": currency,
                "booking_hint": "Travelpayouts/Aviasales 연동 전 fixture 후보",
                "booking_url": None,
            },
            {
                "id": "fixture-icn-nrt-2",
                "airline": "Asiana Airlines",
                "origin": "ICN",
                "destination": "NRT",
                "departure_time": "2026-06-01T13:20:00+09:00",
                "arrival_time": "2026-06-01T15:45:00+09:00",
                "duration": "2h 25m",
                "stops": 0,
                "price": 315000 if currency == "KRW" else 235,
                "currency": currency,
                "booking_hint": "Travelpayouts/Aviasales 연동 전 fixture 후보",
                "booking_url": None,
            },
            {
                "id": "fixture-icn-nrt-3",
                "airline": "Jin Air",
                "origin": "ICN",
                "destination": "NRT",
                "departure_time": "2026-06-01T18:00:00+09:00",
                "arrival_time": "2026-06-01T20:30:00+09:00",
                "duration": "2h 30m",
                "stops": 0,
                "price": 250000 if currency == "KRW" else 188,
                "currency": currency,
                "booking_hint": "Travelpayouts/Aviasales 연동 전 fixture 후보",
                "booking_url": None,
            }
        ]

    return [
        {
            "id": "fixture-generic-1",
            "airline": "Demo Air",
            "origin": origin,
            "destination": destination,
            "departure_time": f"{query['departure_date']}T10:00:00+09:00",
            "arrival_time": f"{query['departure_date']}T13:00:00+09:00",
            "duration": "3h 00m",
            "stops": 0,
            "price": 320000 if currency == "KRW" else 240,
            "currency": currency,
            "booking_hint": "실제 Travelpayouts/Aviasales 연동 전 generic fixture 후보",
            "booking_url": None,
        },
        {
            "id": "fixture-generic-2",
            "airline": "SkyTrip Air",
            "origin": origin,
            "destination": destination,
            "departure_time": f"{query['departure_date']}T14:30:00+09:00",
            "arrival_time": f"{query['departure_date']}T17:40:00+09:00",
            "duration": "3h 10m",
            "stops": 0,
            "price": 285000 if currency == "KRW" else 214,
            "currency": currency,
            "booking_hint": "실제 Travelpayouts/Aviasales 연동 전 generic fixture 후보",
            "booking_url": None,
        },
        {
            "id": "fixture-generic-3",
            "airline": "Sample Airlines",
            "origin": origin,
            "destination": destination,
            "departure_time": f"{query['departure_date']}T20:55:00+09:00",
            "arrival_time": f"{query['departure_date']}T23:55:00+09:00",
            "duration": "3h 00m",
            "stops": 1,
            "price": 255000 if currency == "KRW" else 192,
            "currency": currency,
            "booking_hint": "실제 Travelpayouts/Aviasales 연동 전 generic fixture 후보",
            "booking_url": None,
        }
    ]


def pad_sparse_offers(offers: list[dict], query: dict, minimum: int = 3) -> list[dict]:
    if len(offers) >= minimum:
        return offers

    seen_ids = {offer.get("id") for offer in offers}
    padded_offers = [*offers]
    for backup_offer in search_fixture_flights(query):
        if backup_offer.get("id") in seen_ids:
            continue
        padded_offers.append({**backup_offer, "booking_hint": "검색 결과가 적어 함께 보여주는 백업 후보입니다."})
        seen_ids.add(backup_offer.get("id"))
        if len(padded_offers) >= minimum:
            break
    return padded_offers


def search_flights(query: dict) -> dict:
    travelpayouts_token = os.getenv("TRAVELPAYOUTS_API_TOKEN", "").strip()
    if travelpayouts_token:
        aviasales_query = AviasalesFlightSearchQuery(
            origin=query["origin"],
            destination=query["destination"],
            departure_date=query["departure_date"],
            return_date=query.get("return_date"),
            adults=query.get("adults", 1),
            currency=query.get("currency", "KRW"),
        )
        try:
            offers = AviasalesClient(
                token=travelpayouts_token,
                marker=os.getenv("TRAVELPAYOUTS_MARKER", "").strip() or None,
                base_url=os.getenv("TRAVELPAYOUTS_BASE_URL", "https://api.travelpayouts.com"),
            ).search_flight_offers(aviasales_query)
            return {"mode": "aviasales", "offers": pad_sparse_offers(offers, query)}
        except Exception:
            return {
                "mode": "aviasales-fallback",
                "offers": search_fixture_flights(query),
                "warning": "Travelpayouts/Aviasales search failed; returned fixture offers.",
            }

    kiwi_key = os.getenv("KIWI_TEQUILA_API_KEY", "").strip()
    if kiwi_key:
        kiwi_query = KiwiTequilaFlightSearchQuery(
            origin=query["origin"],
            destination=query["destination"],
            departure_date=query["departure_date"],
            return_date=query.get("return_date"),
            adults=query.get("adults", 1),
            currency=query.get("currency", "KRW"),
        )
        try:
            offers = KiwiTequilaClient(
                api_key=kiwi_key,
                base_url=os.getenv("KIWI_TEQUILA_BASE_URL", "https://api.tequila.kiwi.com"),
            ).search_flight_offers(kiwi_query)
            return {"mode": "kiwi-tequila", "offers": pad_sparse_offers(offers, query)}
        except Exception:
            return {
                "mode": "kiwi-fallback",
                "offers": search_fixture_flights(query),
                "warning": "Kiwi Tequila search failed; returned fixture offers.",
            }

    client_id = os.getenv("AMADEUS_CLIENT_ID", "").strip()
    client_secret = os.getenv("AMADEUS_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        return {"mode": "fixture", "offers": search_fixture_flights(query)}

    amadeus_query = AmadeusFlightSearchQuery(
        origin=query["origin"],
        destination=query["destination"],
        departure_date=query["departure_date"],
        return_date=query.get("return_date"),
        adults=query.get("adults", 1),
        currency=query.get("currency", "KRW"),
    )
    try:
        offers = AmadeusClient(
            AmadeusCredentials(client_id=client_id, client_secret=client_secret),
            base_url=os.getenv("AMADEUS_BASE_URL", "https://test.api.amadeus.com"),
        ).search_flight_offers(amadeus_query)
        return {"mode": "amadeus", "offers": pad_sparse_offers(offers, query)}
    except Exception:
        return {
            "mode": "fixture-fallback",
            "offers": search_fixture_flights(query),
            "warning": "Amadeus search failed; returned fixture offers.",
        }
