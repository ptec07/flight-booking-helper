def get_recommended_api_candidates() -> list[dict[str, str]]:
    """Return vetted public-apis candidates for the flight-booking-helper MVP.

    These are integration roles, not credentials. Authenticated providers must be
    called through the backend so keys/OAuth secrets never reach the browser.
    """

    return [
        {
            "role": "flight_search",
            "name": "Kiwi Tequila",
            "category": "Transportation",
            "auth": "apiKey",
            "https": "Yes",
            "cors": "Unknown",
            "integration": "backend_proxy",
            "url": "https://tequila.kiwi.com/portal/docs/tequila_api",
        },
        {
            "role": "aircraft_status",
            "name": "OpenSky Network",
            "category": "Transportation",
            "auth": "No",
            "https": "Yes",
            "cors": "Unknown",
            "integration": "backend_proxy",
            "url": "https://openskynetwork.github.io/opensky-api/rest.html",
        },
        {
            "role": "weather",
            "name": "Open-Meteo",
            "category": "Weather",
            "auth": "No",
            "https": "Yes",
            "cors": "Yes",
            "integration": "direct_or_backend",
            "url": "https://open-meteo.com/",
        },
        {
            "role": "aviation_weather",
            "name": "AviationWeather",
            "category": "Weather",
            "auth": "No",
            "https": "Yes",
            "cors": "Unknown",
            "integration": "backend_proxy",
            "url": "https://aviationweather.gov/data/api/",
        },
        {
            "role": "currency",
            "name": "Frankfurter",
            "category": "Currency Exchange",
            "auth": "No",
            "https": "Yes",
            "cors": "Yes",
            "integration": "direct_or_backend",
            "url": "https://www.frankfurter.app/docs",
        },
        {
            "role": "airport_info",
            "name": "airportsapi",
            "category": "Transportation",
            "auth": "No",
            "https": "Yes",
            "cors": "Unknown",
            "integration": "backend_proxy",
            "url": "https://airport-web.appspot.com/api/docs/",
        },
    ]
