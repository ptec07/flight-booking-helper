import { describe, expect, it } from 'vitest'
import { findAirportByCode, searchAirports } from '../airports'

describe('airport catalog search', () => {
  it('finds airports by Korean city, English city, airport name aliases, and IATA code', () => {
    expect(searchAirports('서울')[0]).toMatchObject({ code: 'ICN', cityKo: '서울' })
    expect(searchAirports('tokyo').map((airport) => airport.code)).toEqual(expect.arrayContaining(['NRT', 'HND']))
    expect(searchAirports('하네다')[0]).toMatchObject({ code: 'HND', airportKo: '하네다공항' })
    expect(searchAirports('kix')[0]).toMatchObject({ code: 'KIX', cityKo: '오사카' })
  })

  it('limits noisy results and supports exact code lookup', () => {
    expect(searchAirports('')).toEqual([])
    expect(searchAirports('a')).toHaveLength(6)
    expect(findAirportByCode('nrt')).toMatchObject({ code: 'NRT', cityKo: '도쿄' })
  })
})
