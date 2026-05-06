from app.services.flight_search import search_flights


def test_search_flights_uses_fixture_when_amadeus_credentials_are_missing(monkeypatch):
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

    assert result == {"mode": "amadeus", "offers": [{"id": "amadeus-1", "airline": "KE"}]}


def test_search_flights_falls_back_to_fixture_when_amadeus_fails(monkeypatch):
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
