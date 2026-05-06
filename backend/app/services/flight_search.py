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




def split_round_trip_offers(offers: list[dict]) -> list[dict]:
    round_trip_offers = []
    for offer in offers:
        round_trip = offer.get("round_trip")
        if not round_trip:
            continue
        round_trip_offers.append(
            {
                "id": offer["id"],
                "airline": offer.get("airline"),
                "origin": offer.get("origin"),
                "destination": offer.get("destination"),
                "departure_time": offer.get("departure_time"),
                "arrival_time": offer.get("arrival_time"),
                "duration": offer.get("duration"),
                "stops": offer.get("stops", 0),
                "price": offer.get("price"),
                "currency": offer.get("currency"),
                "booking_hint": offer.get("booking_hint", "Amadeus 왕복 항공권 후보입니다."),
                "outbound": round_trip.get("outbound"),
                "return": round_trip.get("return"),
                "round_trip": round_trip,
            }
        )
    return round_trip_offers


def search_amadeus_offers(query: dict) -> dict | None:
    client_id = os.getenv("AMADEUS_CLIENT_ID", "").strip()
    client_secret = os.getenv("AMADEUS_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        return None

    amadeus_query = AmadeusFlightSearchQuery(
        origin=query["origin"],
        destination=query["destination"],
        departure_date=query["departure_date"],
        return_date=query.get("return_date"),
        adults=query.get("adults", 1),
        currency=query.get("currency", "KRW"),
    )
    offers = AmadeusClient(
        AmadeusCredentials(client_id=client_id, client_secret=client_secret),
        base_url=os.getenv("AMADEUS_BASE_URL", "https://test.api.amadeus.com"),
    ).search_flight_offers(amadeus_query)
    if query.get("return_date"):
        round_trip_offers = split_round_trip_offers(offers)
        if round_trip_offers:
            return {"mode": "amadeus-round-trip", "offers": [], "round_trip_offers": round_trip_offers}
        return None
    return {"mode": "amadeus", "offers": pad_sparse_offers(offers, query)}

def search_flights(query: dict) -> dict:
    has_return_date = bool(query.get("return_date"))

    amadeus_failed_for_round_trip = False
    if has_return_date:
        try:
            amadeus_result = search_amadeus_offers(query)
            if amadeus_result:
                return amadeus_result
        except Exception:
            amadeus_failed_for_round_trip = True

    fallback_query = {**query, "return_date": None} if has_return_date else query

    travelpayouts_token = os.getenv("TRAVELPAYOUTS_API_TOKEN", "").strip()
    if travelpayouts_token:
        aviasales_query = AviasalesFlightSearchQuery(
            origin=fallback_query["origin"],
            destination=fallback_query["destination"],
            departure_date=fallback_query["departure_date"],
            return_date=fallback_query.get("return_date"),
            adults=fallback_query.get("adults", 1),
            currency=fallback_query.get("currency", "KRW"),
        )
        try:
            offers = AviasalesClient(
                token=travelpayouts_token,
                marker=os.getenv("TRAVELPAYOUTS_MARKER", "").strip() or None,
                base_url=os.getenv("TRAVELPAYOUTS_BASE_URL", "https://api.travelpayouts.com"),
            ).search_flight_offers(aviasales_query)
            return {"mode": "aviasales", "offers": pad_sparse_offers(offers, fallback_query)}
        except Exception:
            return {
                "mode": "aviasales-fallback",
                "offers": search_fixture_flights(fallback_query),
                "warning": "Travelpayouts/Aviasales search failed; returned fixture offers.",
            }

    kiwi_key = os.getenv("KIWI_TEQUILA_API_KEY", "").strip()
    if kiwi_key:
        kiwi_query = KiwiTequilaFlightSearchQuery(
            origin=fallback_query["origin"],
            destination=fallback_query["destination"],
            departure_date=fallback_query["departure_date"],
            return_date=fallback_query.get("return_date"),
            adults=fallback_query.get("adults", 1),
            currency=fallback_query.get("currency", "KRW"),
        )
        try:
            offers = KiwiTequilaClient(
                api_key=kiwi_key,
                base_url=os.getenv("KIWI_TEQUILA_BASE_URL", "https://api.tequila.kiwi.com"),
            ).search_flight_offers(kiwi_query)
            return {"mode": "kiwi-tequila", "offers": pad_sparse_offers(offers, fallback_query)}
        except Exception:
            return {
                "mode": "kiwi-fallback",
                "offers": search_fixture_flights(fallback_query),
                "warning": "Kiwi Tequila search failed; returned fixture offers.",
            }

    try:
        amadeus_result = None if amadeus_failed_for_round_trip else search_amadeus_offers(query)
        if amadeus_result:
            return amadeus_result
    except Exception:
        return {
            "mode": "fixture-fallback",
            "offers": search_fixture_flights(fallback_query),
            "warning": "Amadeus search failed; returned fixture offers.",
        }

    return {"mode": "fixture", "offers": search_fixture_flights(fallback_query)}
