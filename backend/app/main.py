import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.flights import router as flights_router
from app.routes.trip_context import router as trip_context_router


def frontend_origins() -> list[str]:
    configured = os.getenv("FRONTEND_ORIGIN", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return origins or ["http://localhost:5173", "http://127.0.0.1:5173", "https://skytrip.example.com"]


app = FastAPI(title="Flight Booking Helper")
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "flight-booking-helper"}


app.include_router(flights_router, prefix="/api/flights", tags=["flights"])
app.include_router(trip_context_router, prefix="/api/trip", tags=["trip"])
