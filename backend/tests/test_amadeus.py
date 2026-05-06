

from app.services.amadeus import normalize_amadeus_offer


def test_normalize_amadeus_round_trip_offer_preserves_outbound_and_return_itineraries():
    offer = {
        "id": "1",
        "validatingAirlineCodes": ["KE"],
        "price": {"grandTotal": "342000.00", "currency": "KRW"},
        "itineraries": [
            {
                "duration": "PT1H50M",
                "segments": [
                    {"carrierCode": "KE", "departure": {"iataCode": "ICN", "at": "2026-05-11T09:00:00"}, "arrival": {"iataCode": "KIX", "at": "2026-05-11T10:50:00"}}
                ],
            },
            {
                "duration": "PT1H55M",
                "segments": [
                    {"carrierCode": "KE", "departure": {"iataCode": "KIX", "at": "2026-05-16T14:00:00"}, "arrival": {"iataCode": "ICN", "at": "2026-05-16T15:55:00"}}
                ],
            },
        ],
    }

    normalized = normalize_amadeus_offer(offer)

    assert normalized["id"] == "amadeus-1"
    assert normalized["price"] == 342000.0
    assert normalized["round_trip"] == {
        "outbound": {
            "origin": "ICN",
            "destination": "KIX",
            "departure_time": "2026-05-11T09:00:00",
            "arrival_time": "2026-05-11T10:50:00",
            "duration": "1h 50m",
            "stops": 0,
            "airline": "KE",
        },
        "return": {
            "origin": "KIX",
            "destination": "ICN",
            "departure_time": "2026-05-16T14:00:00",
            "arrival_time": "2026-05-16T15:55:00",
            "duration": "1h 55m",
            "stops": 0,
            "airline": "KE",
        },
    }
