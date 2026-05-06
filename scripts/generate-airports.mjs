import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const frontendOutput = path.join(projectRoot, 'frontend', 'src', 'generated', 'airports.generated.json')
const backendOutput = path.join(projectRoot, 'backend', 'app', 'data', 'airports.generated.json')

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'SkyTrip airport catalog generator' } }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
          response.resume()
          return
        }
        response.setEncoding('utf8')
        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => resolve(body))
      })
      .on('error', reject)
  })
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows
  return dataRows
    .filter((values) => values.length === headers.length)
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function airportRank(row) {
  const typeScore = row.type === 'large_airport' ? 300 : row.type === 'medium_airport' ? 200 : 100
  const serviceScore = row.scheduled_service === 'yes' ? 50 : 0
  return typeScore + serviceScore
}

function toAirport(row) {
  const code = row.iata_code.trim().toUpperCase()
  const city = row.municipality.trim() || row.name.trim()
  const name = row.name.trim()
  const keywords = row.keywords
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
  const aliases = Array.from(new Set([code, city, name, row.ident, row.icao_code, ...keywords].filter(Boolean)))
  return {
    code,
    icao: row.icao_code.trim() || row.gps_code.trim() || row.ident.trim(),
    cityKo: city,
    cityEn: city,
    airportKo: name,
    airportEn: name,
    countryKo: row.iso_country.trim(),
    countryCode: row.iso_country.trim(),
    lat: Number.parseFloat(row.latitude_deg),
    lon: Number.parseFloat(row.longitude_deg),
    type: row.type,
    scheduledService: row.scheduled_service === 'yes',
    aliases,
  }
}

const csv = await fetchText(SOURCE_URL)
const byCode = new Map()
for (const row of parseCsv(csv)) {
  const code = row.iata_code.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(code)) continue
  if (!Number.isFinite(Number.parseFloat(row.latitude_deg)) || !Number.isFinite(Number.parseFloat(row.longitude_deg))) continue

  const existing = byCode.get(code)
  if (!existing || airportRank(row) > airportRank(existing)) {
    byCode.set(code, row)
  }
}

const airports = [...byCode.values()]
  .sort((a, b) => airportRank(b) - airportRank(a) || a.iata_code.localeCompare(b.iata_code))
  .map(toAirport)

for (const output of [frontendOutput, backendOutput]) {
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, `${JSON.stringify(airports, null, 2)}\n`)
}

console.log(JSON.stringify({ source: SOURCE_URL, count: airports.length, frontendOutput, backendOutput }, null, 2))
