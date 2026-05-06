import { describe, expect, it } from 'vitest'
import generatedAirports from '../generated/airports.generated.json'

describe('generated OurAirports catalog', () => {
  it('contains thousands of IATA airports with coordinates and searchable metadata', () => {
    expect(generatedAirports.length).toBeGreaterThanOrEqual(4000)
    expect(generatedAirports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ZRH', cityEn: 'Zurich' }),
        expect.objectContaining({ code: 'IST', cityEn: 'Istanbul' }),
        expect.objectContaining({ code: 'CAI', cityEn: 'Cairo' }),
        expect.objectContaining({ code: 'LIM', cityEn: 'Lima' }),
        expect.objectContaining({ code: 'DOH', cityEn: 'Doha' }),
      ]),
    )
  })
})
