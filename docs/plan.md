# 비행기 예약 보조 앱 기획

## MVP 범위
- Kiwi Tequila: 항공권 검색 후보, API key는 backend에서만 사용
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
2. Kiwi Tequila API key가 있으면 실검색, 없으면 fixture-backed 항공권 후보 표시
3. 날씨/환율/항공 기상 요약 표시
4. 관심 항공편 저장은 로컬 UI 상태로 시작
