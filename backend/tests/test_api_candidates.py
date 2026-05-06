from app.services.public_api_catalog import get_recommended_api_candidates


def test_flight_booking_candidates_include_verified_public_api_roles():
    candidates = get_recommended_api_candidates()

    roles = {candidate["role"] for candidate in candidates}
    assert {"flight_search", "aircraft_status", "weather", "currency", "airport_info"}.issubset(roles)

    aviasales = next(candidate for candidate in candidates if candidate["name"] == "Travelpayouts / Aviasales")
    assert aviasales["auth"] == "apiKey"
    assert aviasales["integration"] == "backend_proxy"
