export type Airport = {
  code: string
  cityKo: string
  cityEn: string
  airportKo: string
  airportEn: string
  countryKo: string
  aliases: string[]
}

export const airports: Airport[] = [
  { code: 'ICN', cityKo: '서울', cityEn: 'Seoul', airportKo: '인천국제공항', airportEn: 'Incheon International Airport', countryKo: '대한민국', aliases: ['서울', '인천', '인천공항', '인천국제공항', 'seoul', 'incheon', 'icn'] },
  { code: 'GMP', cityKo: '서울', cityEn: 'Seoul', airportKo: '김포공항', airportEn: 'Gimpo International Airport', countryKo: '대한민국', aliases: ['서울', '김포', '김포공항', 'gimpo', 'seoul', 'gmp'] },
  { code: 'PUS', cityKo: '부산', cityEn: 'Busan', airportKo: '김해공항', airportEn: 'Gimhae International Airport', countryKo: '대한민국', aliases: ['부산', '김해', '김해공항', 'busan', 'gimhae', 'pus'] },
  { code: 'CJU', cityKo: '제주', cityEn: 'Jeju', airportKo: '제주공항', airportEn: 'Jeju International Airport', countryKo: '대한민국', aliases: ['제주', '제주도', '제주공항', 'jeju', 'cju'] },
  { code: 'NRT', cityKo: '도쿄', cityEn: 'Tokyo', airportKo: '나리타공항', airportEn: 'Narita International Airport', countryKo: '일본', aliases: ['도쿄', '동경', '나리타', '나리타공항', 'tokyo', 'narita', 'nrt'] },
  { code: 'HND', cityKo: '도쿄', cityEn: 'Tokyo', airportKo: '하네다공항', airportEn: 'Haneda Airport', countryKo: '일본', aliases: ['도쿄', '동경', '하네다', '하네다공항', 'tokyo', 'haneda', 'hnd'] },
  { code: 'KIX', cityKo: '오사카', cityEn: 'Osaka', airportKo: '간사이공항', airportEn: 'Kansai International Airport', countryKo: '일본', aliases: ['오사카', '간사이', '간사이공항', 'osaka', 'kansai', 'kix'] },
  { code: 'FUK', cityKo: '후쿠오카', cityEn: 'Fukuoka', airportKo: '후쿠오카공항', airportEn: 'Fukuoka Airport', countryKo: '일본', aliases: ['후쿠오카', 'fukuoka', 'fuk'] },
  { code: 'CTS', cityKo: '삿포로', cityEn: 'Sapporo', airportKo: '신치토세공항', airportEn: 'New Chitose Airport', countryKo: '일본', aliases: ['삿포로', '신치토세', '치토세', 'sapporo', 'chitose', 'cts'] },
  { code: 'BKK', cityKo: '방콕', cityEn: 'Bangkok', airportKo: '수완나품공항', airportEn: 'Suvarnabhumi Airport', countryKo: '태국', aliases: ['방콕', '수완나품', 'bangkok', 'suvarnabhumi', 'bkk'] },
  { code: 'DMK', cityKo: '방콕', cityEn: 'Bangkok', airportKo: '돈므앙공항', airportEn: 'Don Mueang Airport', countryKo: '태국', aliases: ['방콕', '돈므앙', 'don mueang', 'bangkok', 'dmk'] },
  { code: 'SIN', cityKo: '싱가포르', cityEn: 'Singapore', airportKo: '창이공항', airportEn: 'Changi Airport', countryKo: '싱가포르', aliases: ['싱가포르', '창이', 'singapore', 'changi', 'sin'] },
  { code: 'CXR', cityKo: '나트랑', cityEn: 'Nha Trang', airportKo: '깜라인공항', airportEn: 'Cam Ranh International Airport', countryKo: '베트남', aliases: ['나트랑', '냐짱', '깜라인', '캄란', 'nha trang', 'nhatrang', 'cam ranh', 'camranh', 'cxr'] },
  { code: 'DAD', cityKo: '다낭', cityEn: 'Da Nang', airportKo: '다낭공항', airportEn: 'Da Nang International Airport', countryKo: '베트남', aliases: ['다낭', 'danang', 'da nang', 'dad'] },
  { code: 'SGN', cityKo: '호치민', cityEn: 'Ho Chi Minh City', airportKo: '떤선녓공항', airportEn: 'Tan Son Nhat International Airport', countryKo: '베트남', aliases: ['호치민', '호찌민', '사이공', 'ho chi minh', 'hochiminh', 'saigon', 'tan son nhat', 'sgn'] },
  { code: 'HAN', cityKo: '하노이', cityEn: 'Hanoi', airportKo: '노이바이공항', airportEn: 'Noi Bai International Airport', countryKo: '베트남', aliases: ['하노이', 'hanoi', 'noi bai', 'han'] },
  { code: 'PQC', cityKo: '푸꾸옥', cityEn: 'Phu Quoc', airportKo: '푸꾸옥공항', airportEn: 'Phu Quoc International Airport', countryKo: '베트남', aliases: ['푸꾸옥', '푸꿕', 'phu quoc', 'phuquoc', 'pqc'] },
  { code: 'HKT', cityKo: '푸켓', cityEn: 'Phuket', airportKo: '푸켓공항', airportEn: 'Phuket International Airport', countryKo: '태국', aliases: ['푸켓', 'phuket', 'hkt'] },
  { code: 'CNX', cityKo: '치앙마이', cityEn: 'Chiang Mai', airportKo: '치앙마이공항', airportEn: 'Chiang Mai International Airport', countryKo: '태국', aliases: ['치앙마이', 'chiang mai', 'chiangmai', 'cnx'] },
  { code: 'TPE', cityKo: '타이베이', cityEn: 'Taipei', airportKo: '타오위안공항', airportEn: 'Taiwan Taoyuan International Airport', countryKo: '대만', aliases: ['타이베이', '타이페이', '타오위안', 'taipei', 'taoyuan', 'tpe'] },
  { code: 'HKG', cityKo: '홍콩', cityEn: 'Hong Kong', airportKo: '홍콩국제공항', airportEn: 'Hong Kong International Airport', countryKo: '홍콩', aliases: ['홍콩', 'hong kong', 'hongkong', 'hkg'] },
  { code: 'MNL', cityKo: '마닐라', cityEn: 'Manila', airportKo: '니노이 아키노 공항', airportEn: 'Ninoy Aquino International Airport', countryKo: '필리핀', aliases: ['마닐라', 'manila', 'ninoy aquino', 'mnl'] },
  { code: 'CRK', cityKo: '클락', cityEn: 'Clark', airportKo: '클락공항', airportEn: 'Clark International Airport', countryKo: '필리핀', aliases: ['클락', '앙헬레스', 'clark', 'angeles', 'crk'] },
  { code: 'MPH', cityKo: '보라카이', cityEn: 'Boracay', airportKo: '카티클란공항', airportEn: 'Godofredo P. Ramos Airport', countryKo: '필리핀', aliases: ['보라카이', '카티클란', 'boracay', 'caticlan', 'mph'] },
  { code: 'DPS', cityKo: '발리', cityEn: 'Bali', airportKo: '응우라라이공항', airportEn: 'Ngurah Rai International Airport', countryKo: '인도네시아', aliases: ['발리', '덴파사르', 'bali', 'denpasar', 'dps'] },
  { code: 'KUL', cityKo: '쿠알라룸푸르', cityEn: 'Kuala Lumpur', airportKo: '쿠알라룸푸르공항', airportEn: 'Kuala Lumpur International Airport', countryKo: '말레이시아', aliases: ['쿠알라룸푸르', '쿠알라', 'kuala lumpur', 'kl', 'kul'] },
  { code: 'GUM', cityKo: '괌', cityEn: 'Guam', airportKo: '괌 안토니오 B. 원 팻 공항', airportEn: 'Antonio B. Won Pat International Airport', countryKo: '미국령 괌', aliases: ['괌', 'guam', 'gum'] },
  { code: 'SPN', cityKo: '사이판', cityEn: 'Saipan', airportKo: '사이판공항', airportEn: 'Saipan International Airport', countryKo: '북마리아나제도', aliases: ['사이판', 'saipan', 'spn'] },
  { code: 'CEB', cityKo: '세부', cityEn: 'Cebu', airportKo: '막탄 세부공항', airportEn: 'Mactan-Cebu International Airport', countryKo: '필리핀', aliases: ['세부', '막탄', 'cebu', 'mactan', 'ceb'] },
  { code: 'JFK', cityKo: '뉴욕', cityEn: 'New York', airportKo: '존 F. 케네디 공항', airportEn: 'John F. Kennedy International Airport', countryKo: '미국', aliases: ['뉴욕', '케네디', 'new york', 'jfk'] },
  { code: 'LAX', cityKo: '로스앤젤레스', cityEn: 'Los Angeles', airportKo: '로스앤젤레스공항', airportEn: 'Los Angeles International Airport', countryKo: '미국', aliases: ['로스앤젤레스', '엘에이', 'la', 'los angeles', 'lax'] },
  { code: 'SFO', cityKo: '샌프란시스코', cityEn: 'San Francisco', airportKo: '샌프란시스코공항', airportEn: 'San Francisco International Airport', countryKo: '미국', aliases: ['샌프란시스코', 'san francisco', 'sfo'] },
  { code: 'LHR', cityKo: '런던', cityEn: 'London', airportKo: '히스로공항', airportEn: 'Heathrow Airport', countryKo: '영국', aliases: ['런던', '히스로', 'london', 'heathrow', 'lhr'] },
  { code: 'CDG', cityKo: '파리', cityEn: 'Paris', airportKo: '샤를드골공항', airportEn: 'Charles de Gaulle Airport', countryKo: '프랑스', aliases: ['파리', '샤를드골', 'paris', 'charles de gaulle', 'cdg'] },
]

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function airportText(airport: Airport) {
  return [airport.code, airport.cityKo, airport.cityEn, airport.airportKo, airport.airportEn, airport.countryKo, ...airport.aliases]
    .map(normalize)
    .join(' ')
}

export function airportDisplayName(airport: Airport) {
  return `${airport.cityKo} · ${airport.code}`
}

export function findAirportByCode(code: string) {
  const normalizedCode = normalize(code).toUpperCase()
  return airports.find((airport) => airport.code === normalizedCode)
}

export function searchAirports(query: string, limit = 6) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []

  return airports
    .map((airport, index) => {
      const exactCode = airport.code.toLowerCase() === normalizedQuery
      const exactAlias = airport.aliases.some((alias) => normalize(alias) === normalizedQuery)
      const startsWithAlias = airport.aliases.some((alias) => normalize(alias).startsWith(normalizedQuery))
      const contains = airportText(airport).includes(normalizedQuery)
      const score = exactCode ? 100 : exactAlias ? 80 : startsWithAlias ? 60 : contains ? 30 : 0
      return { airport, score, index }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.airport)
}
