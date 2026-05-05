from app.services.public_api_catalog import get_recommended_api_candidates


def test_flight_booking_candidates_include_verified_public_api_roles():
    candidates = get_recommended_api_candidates()

    roles = {candidate["role"] for candidate in candidates}
    assert {"flight_search", "aircraft_status", "weather", "currency", "airport_info"}.issubset(roles)

    amadeus = next(candidate for candidate in candidates if candidate["name"] == "Amadeus for Developers")
    assert amadeus["auth"] == "OAuth"
    assert amadeus["integration"] == "backend_proxy"
