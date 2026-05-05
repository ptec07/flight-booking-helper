# Flight Booking Helper

`public-apis` 기반 비행기 예약 보조 MVP입니다.

## 목표

항공권 검색 후보, 공항 정보, 운항/항공기 상태, 날씨, 환율을 한 화면에서 비교합니다.

## 현재 구현 범위

- FastAPI backend
  - `GET /health`
  - `GET /api/flights/search`
  - `GET /api/trip/context`
  - public-apis 후보 카탈로그 서비스
  - Amadeus OAuth client-credentials + Flight Offers Search sandbox adapter
  - Amadeus credential이 없으면 백업 데이터, Amadeus 호출 실패 시 백업 데이터 반환
  - `live=true`일 때 Open-Meteo 현재 날씨/3일 예보, Frankfurter 또는 ExchangeRate-API Open 환율 조회
  - `FRONTEND_ORIGIN` 기반 CORS 설정
- Vite + React frontend
  - 흰 배경/하늘색 카드형 UI
  - 편도/왕복 토글, 귀국일, 성인 수, 통화 선택
  - 공항 코드 자동 대문자 보정, 인기 노선 빠른 선택, 날짜 검증, 검색 조건 요약
  - `/api/flights/search`, `/api/trip/context` FastAPI 호출
  - 도착지 3일 날씨, 강수 확률, 환율 기준 시각, 여행 코멘트 표시
  - Google Flights / Skyscanner 검색 링크 연결
  - 항공권 상세 보기 모달
  - 관심 항공편 localStorage 저장
  - 저장한 항공편 목록, 개수 배지, 상세 재열기, 개별 삭제, 전체 삭제
- 배포 준비
  - Frontend: Vercel
  - Backend: Render
  - `frontend/vercel.json`, `render.yaml` 포함
- TDD 테스트
  - backend route/service/live-wrapper/Amadeus/CORS tests
  - frontend API client/render/interaction/deploy config tests

## 실제 API 연동 전략

MVP는 Amadeus credential이 없으면 안전하게 백업 데이터로 동작하고, credential이 있으면 backend에서만 Amadeus sandbox를 호출합니다. no-auth 보조 API도 일부 실제 wrapper를 붙였습니다.

- Amadeus: `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`이 있으면 `/api/flights/search`에서 OAuth token 발급 후 Flight Offers Search sandbox 호출
- Amadeus 실패/미설정: 백업 항공권 후보 반환
- Open-Meteo: `/api/trip/context?live=true`에서 도착 공항 좌표 기준 현재 날씨와 3일 예보 조회
- Frankfurter: `/api/trip/context?live=true`에서 지정 금액의 KRW 환산 조회
- ExchangeRate-API Open: Frankfurter가 차단/실패하거나 KRW rate를 못 주면 no-auth backup으로 환율 조회
- 두 API 계층은 네트워크/서비스 오류 시 백업 데이터로 응답합니다.

Amadeus 항공권 검색 실연동 순서:

1. Amadeus sandbox OAuth 발급
2. `backend/.env`에 `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` 저장
3. FastAPI backend wrapper에서 Amadeus Flight Offers Search 호출
4. OpenSky/Open-Meteo/Frankfurter 같은 no-auth API를 보조 정보로 연결
5. 프론트는 외부 API가 아니라 항상 `/api/...`만 호출

## 실행 방법

### Backend

```bash
cd /home/ptec07/.hermes/hermes-agent/workforce/flight-booking-helper/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest -q -o 'addopts='
# Amadeus 실연동 또는 CORS origin을 켤 때만: set -a && source .env && set +a
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd /home/ptec07/.hermes/hermes-agent/workforce/flight-booking-helper/frontend
npm install
npm test -- --run
npm run build
npm run dev
```

## 배포 메모

### Frontend: Vercel

- 루트 디렉터리: `frontend`
- 빌드 명령: `npm run build`
- 출력 디렉터리: `dist`
- SPA rewrite: `frontend/vercel.json`
- backend가 Render에 배포되면 Vercel production 환경변수에 backend origin을 넣습니다.
  - `VITE_API_BASE_URL=https://<render-service>.onrender.com`
  - frontend API helper가 `/api/...`를 붙이므로 끝에 `/api`를 붙이지 않습니다.

### Backend: Render

- 설정 파일: `render.yaml`
- 루트 디렉터리: `backend`
- 시작 명령: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`은 Render secret env로만 저장합니다.
- `FRONTEND_ORIGIN`에는 최종 Vercel origin을 넣습니다.
- `AMADEUS_CLIENT_SECRET` 같은 비밀값은 프론트엔드에 노출하지 않습니다.

## 구조

- `backend/`: FastAPI API wrapper
- `frontend/`: Vite + React UI
- `docs/`: 기획/검증 문서

## 주의

- 이 앱은 1차로 “예약 보조/검색/비교” 앱입니다.
- 직접 결제, PNR 생성, 발권, 환불/변경은 public/free APIs만으로 처리하기 어렵고 Amadeus/Sabre 등 상용 계약 검토가 필요합니다.
- API key는 절대 프론트엔드에 넣지 않습니다.
