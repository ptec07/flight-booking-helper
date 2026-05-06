from app.services.flight_search import search_flights


def test_search_flights_uses_fixture_when_amadeus_credentials_are_missing(monkeypatch):
    monkeypatch.delenv("TRAVELPAYOUTS_API_TOKEN", raising=False)
    monkeypatch.delenv("KIWI_TEQUILA_API_KEY", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_ID", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_SECRET", raising=False)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "fixture"
    assert result["offers"][0]["id"] == "fixture-icn-nrt-1"


def test_search_flights_uses_amadeus_when_credentials_are_present(monkeypatch):
    monkeypatch.delenv("TRAVELPAYOUTS_API_TOKEN", raising=False)
    monkeypatch.delenv("KIWI_TEQUILA_API_KEY", raising=False)
    monkeypatch.setenv("AMADEUS_CLIENT_ID", "client-id")
    monkeypatch.setenv("AMADEUS_CLIENT_SECRET", "client-secret")

    class FakeAmadeusClient:
        def __init__(self, credentials, base_url="https://test.api.amadeus.com"):
            assert credentials.client_id == "client-id"
            assert credentials.client_secret == "client-secret"
            assert base_url == "https://test.api.amadeus.com"

        def search_flight_offers(self, query):
            assert query.origin == "ICN"
            assert query.destination == "NRT"
            return [{"id": "amadeus-1", "airline": "KE"}]

    monkeypatch.setattr("app.services.flight_search.AmadeusClient", FakeAmadeusClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "USD",
        }
    )

    assert result["mode"] == "amadeus"
    assert len(result["offers"]) >= 3
    assert result["offers"][0] == {"id": "amadeus-1", "airline": "KE"}


def test_search_flights_falls_back_to_fixture_when_amadeus_fails(monkeypatch):
    monkeypatch.delenv("TRAVELPAYOUTS_API_TOKEN", raising=False)
    monkeypatch.delenv("KIWI_TEQUILA_API_KEY", raising=False)
    monkeypatch.setenv("AMADEUS_CLIENT_ID", "client-id")
    monkeypatch.setenv("AMADEUS_CLIENT_SECRET", "client-secret")

    class FailingAmadeusClient:
        def __init__(self, credentials, base_url="https://test.api.amadeus.com"):
            pass

        def search_flight_offers(self, query):
            raise RuntimeError("amadeus unavailable")

    monkeypatch.setattr("app.services.flight_search.AmadeusClient", FailingAmadeusClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "NRT",
            "departure_date": "2026-06-01",
            "adults": 1,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "fixture-fallback"
    assert result["offers"][0]["id"] == "fixture-icn-nrt-1"
    assert result["warning"] == "Amadeus search failed; returned fixture offers."



def test_round_trip_search_prefers_amadeus_offers_when_credentials_are_present(monkeypatch):
    monkeypatch.setenv("TRAVELPAYOUTS_API_TOKEN", "travelpayouts-token")
    monkeypatch.delenv("KIWI_TEQUILA_API_KEY", raising=False)
    monkeypatch.setenv("AMADEUS_CLIENT_ID", "client-id")
    monkeypatch.setenv("AMADEUS_CLIENT_SECRET", "client-secret")

    class UnexpectedAviasalesClient:
        def __init__(self, *args, **kwargs):
            raise AssertionError("round-trip searches should try Amadeus before Aviasales")

    class FakeAmadeusClient:
        def __init__(self, credentials, base_url="https://test.api.amadeus.com"):
            assert credentials.client_id == "client-id"
            assert credentials.client_secret == "client-secret"

        def search_flight_offers(self, query):
            assert query.origin == "ICN"
            assert query.destination == "KIX"
            assert query.departure_date == "2026-05-11"
            assert query.return_date == "2026-05-16"
            return [
                {
                    "id": "amadeus-rt-1",
                    "airline": "KE",
                    "origin": "ICN",
                    "destination": "KIX",
                    "departure_time": "2026-05-11T09:00:00",
                    "arrival_time": "2026-05-11T10:50:00",
                    "duration": "1h 50m",
                    "stops": 0,
                    "price": 342000,
                    "currency": "KRW",
                    "booking_hint": "Amadeus Flight Offers Search sandbox 결과입니다.",
                    "round_trip": {
                        "outbound": {"origin": "ICN", "destination": "KIX", "departure_time": "2026-05-11T09:00:00", "arrival_time": "2026-05-11T10:50:00", "duration": "1h 50m", "stops": 0, "airline": "KE"},
                        "return": {"origin": "KIX", "destination": "ICN", "departure_time": "2026-05-16T14:00:00", "arrival_time": "2026-05-16T15:55:00", "duration": "1h 55m", "stops": 0, "airline": "KE"},
                    },
                }
            ]

    monkeypatch.setattr("app.services.flight_search.AviasalesClient", UnexpectedAviasalesClient)
    monkeypatch.setattr("app.services.flight_search.AmadeusClient", FakeAmadeusClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "KIX",
            "departure_date": "2026-05-11",
            "return_date": "2026-05-16",
            "adults": 2,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "amadeus-round-trip"
    assert result["round_trip_offers"][0]["id"] == "amadeus-rt-1"
    assert result["round_trip_offers"][0]["outbound"]["origin"] == "ICN"
    assert result["round_trip_offers"][0]["return"]["origin"] == "KIX"



def test_round_trip_fallback_searches_aviasales_outbound_only_when_amadeus_is_missing(monkeypatch):
    monkeypatch.setenv("TRAVELPAYOUTS_API_TOKEN", "travelpayouts-token")
    monkeypatch.delenv("KIWI_TEQUILA_API_KEY", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_ID", raising=False)
    monkeypatch.delenv("AMADEUS_CLIENT_SECRET", raising=False)

    class FakeAviasalesClient:
        def __init__(self, token, marker=None, base_url="https://api.travelpayouts.com"):
            assert token == "travelpayouts-token"

        def search_flight_offers(self, query):
            assert query.origin == "ICN"
            assert query.destination == "KIX"
            assert query.departure_date == "2026-05-11"
            assert query.return_date is None
            return [{"id": "aviasales-outbound-1", "airline": "7C"}]

    monkeypatch.setattr("app.services.flight_search.AviasalesClient", FakeAviasalesClient)

    result = search_flights(
        {
            "origin": "ICN",
            "destination": "KIX",
            "departure_date": "2026-05-11",
            "return_date": "2026-05-16",
            "adults": 2,
            "currency": "KRW",
        }
    )

    assert result["mode"] == "aviasales"
    assert result["offers"][0]["id"] == "aviasales-outbound-1"
