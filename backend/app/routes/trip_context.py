from fastapi import APIRouter, Query

from app.services.trip_context import build_trip_context

router = APIRouter()


@router.get("/context")
def trip_context(
    destination: str = Query(..., min_length=3, max_length=3),
    amount: float = Query(0, ge=0),
    currency: str = Query("USD", min_length=3, max_length=3),
    live: bool = Query(False),
) -> dict:
    return build_trip_context(destination=destination.upper(), amount=amount, currency=currency.upper(), live=live)
