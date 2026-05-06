import { describe, expect, it } from 'vitest'
import { findAirportByCode, searchAirports } from '../airports'

describe('airport catalog search', () => {
  it('finds airports by Korean city, English city, airport name aliases, and IATA code', () => {
    expect(searchAirports('서울')[0]).toMatchObject({ code: 'ICN', cityKo: '서울' })
    expect(searchAirports('tokyo').map((airport) => airport.code)).toEqual(expect.arrayContaining(['NRT', 'HND']))
    expect(searchAirports('하네다')[0]).toMatchObject({ code: 'HND', airportKo: '하네다공항' })
    expect(searchAirports('kix')[0]).toMatchObject({ code: 'KIX', cityKo: '오사카' })
    expect(searchAirports('나트랑')[0]).toMatchObject({ code: 'CXR', cityKo: '나트랑' })
    expect(searchAirports('냐짱')[0]).toMatchObject({ code: 'CXR', cityKo: '나트랑' })
    expect(searchAirports('nha trang')[0]).toMatchObject({ code: 'CXR', cityKo: '나트랑' })
  })

  it('limits noisy results and supports exact code lookup', () => {
    expect(searchAirports('')).toEqual([])
    expect(searchAirports('a')).toHaveLength(6)
    expect(findAirportByCode('nrt')).toMatchObject({ code: 'NRT', cityKo: '도쿄' })
  })

  it('covers popular Korean outbound city aliases in the local catalog', () => {
    const popularQueries = [
      '나트랑',
      '다낭',
      '하노이',
      '호치민',
      '푸꾸옥',
      '푸켓',
      '치앙마이',
      '타이베이',
      '홍콩',
      '마닐라',
      '클락',
      '보라카이',
      '발리',
      '쿠알라룸푸르',
      '괌',
      '사이판',
    ]

    expect(popularQueries.filter((query) => searchAirports(query).length === 0)).toEqual([])
  })
})
