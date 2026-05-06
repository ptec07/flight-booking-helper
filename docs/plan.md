# 비행기 예약 보조 앱 기획

## MVP 범위
- Travelpayouts / Aviasales: 항공권 가격 검색 후보, API token은 backend에서만 사용
- Kiwi Tequila: magic-link/가입 문제가 있을 때를 대비한 legacy fallback 후보
- OpenSky: 실시간 항공기 상태 참고
- AviationWeather: 항공 기상
- Open-Meteo: 도착지 날씨
- ExchangeRate-API Open / Frankfurter: 환율 변환
- airportsapi: 공항 정보

## 비범위
- 직접 결제/발권/PNR 생성
- 환불/변경 처리

## v0.1 기능
1. 출발/도착 공항과 날짜 입력
2. Travelpayouts API token이 있으면 Aviasales 가격 검색, 없으면 fixture-backed 항공권 후보 표시
3. 날씨/환율/항공 기상 요약 표시
4. 관심 항공편 저장은 로컬 UI 상태로 시작
