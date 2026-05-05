from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.services.flight_search import search_flights as run_flight_search

router = APIRouter()


class FlightQuery(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: str | None = None
    adults: int = Field(default=1, ge=1)
    currency: str = "KRW"


@router.get("/search")
def search_flights(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    departure_date: str = Query(...),
    return_date: str | None = None,
    adults: int = Query(1, ge=1),
    currency: str = "KRW",
) -> dict:
    query = FlightQuery(
        origin=origin.upper(),
        destination=destination.upper(),
        departure_date=departure_date,
        return_date=return_date,
        adults=adults,
        currency=currency.upper(),
    )
    search_result = run_flight_search(query.model_dump())
    return {"query": query.model_dump(), **search_result}
