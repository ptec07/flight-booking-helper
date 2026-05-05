from app.services.amadeus import AmadeusClient, AmadeusCredentials, AmadeusFlightSearchQuery


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class RecordingClient:
    def __init__(self):
        self.calls = []

    def post(self, url, data, headers=None):
        self.calls.append({"method": "POST", "url": url, "data": data, "headers": headers})
        return FakeResponse({"access_token": "token-123"})

    def get(self, url, params, headers=None):
        self.calls.append({"method": "GET", "url": url, "params": params, "headers": headers})
        return FakeResponse(
            {
                "data": [
                    {
                        "id": "1",
                        "validatingAirlineCodes": ["KE"],
                        "itineraries": [
                            {
                                "duration": "PT2H20M",
                                "segments": [
                                    {
                                        "departure": {"iataCode": "ICN", "at": "2026-06-01T09:10:00"},
                                        "arrival": {"iataCode": "NRT", "at": "2026-06-01T11:30:00"},
                                        "carrierCode": "KE",
                                    }
                                ],
                            }
                        ],
                        "price": {"grandTotal": "210.40", "currency": "USD"},
                    }
                ]
            }
        )


def test_amadeus_client_gets_oauth_token_and_normalizes_flight_offers():
    http = RecordingClient()
    client = AmadeusClient(
        credentials=AmadeusCredentials(client_id="client-id", client_secret="client-secret"),
        http_client=http,
    )

    offers = client.search_flight_offers(
        AmadeusFlightSearchQuery(
            origin="ICN",
            destination="NRT",
            departure_date="2026-06-01",
            adults=1,
            currency="USD",
        )
    )

    assert http.calls[0] == {
        "method": "POST",
        "url": "https://test.api.amadeus.com/v1/security/oauth2/token",
        "data": {
            "grant_type": "client_credentials",
            "client_id": "client-id",
            "client_secret": "client-secret",
        },
        "headers": {"Content-Type": "application/x-www-form-urlencoded"},
    }
    assert http.calls[1]["url"] == "https://test.api.amadeus.com/v2/shopping/flight-offers"
    assert http.calls[1]["headers"] == {"Authorization": "Bearer token-123"}
    assert http.calls[1]["params"] == {
        "originLocationCode": "ICN",
        "destinationLocationCode": "NRT",
        "departureDate": "2026-06-01",
        "adults": 1,
        "currencyCode": "USD",
        "max": 5,
    }
    assert offers == [
        {
            "id": "amadeus-1",
            "airline": "KE",
            "origin": "ICN",
            "destination": "NRT",
            "departure_time": "2026-06-01T09:10:00",
            "arrival_time": "2026-06-01T11:30:00",
            "duration": "2h 20m",
            "stops": 0,
            "price": 210.4,
            "currency": "USD",
            "booking_hint": "Amadeus Flight Offers Search sandbox 결과입니다. 예약/발권은 별도 링크/상용 계약이 필요합니다.",
        }
    ]
