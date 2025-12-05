import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function parseCSV(content: string): { headers: string[], rows: string[][] } {
  const lines = content.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(line => parseCSVLine(line))
  return { headers, rows }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export async function GET() {
  try {
    // Use the MCP server's data directory (tenant-leasing)
    const mcpDataDir = path.join(process.cwd(), '..', 'MCP', 'kurt-data', 'tenant-info')
    
    // Fallback to local data directory if MCP data not found
    const localDataDir = path.join(process.cwd(), 'data')
    const dataDir = fs.existsSync(mcpDataDir) ? mcpDataDir : localDataDir
    
    // Read guest cards
    const guestCardsPath = path.join(dataDir, 'synthetic_guest_cards.csv')
    const guestCardsContent = fs.readFileSync(guestCardsPath, 'utf-8')
    const guestCards = parseCSV(guestCardsContent)
    
    // Read nearby units
    const nearbyUnitsPath = path.join(dataDir, 'nearby_advertised_units.csv')
    const nearbyUnitsContent = fs.readFileSync(nearbyUnitsPath, 'utf-8')
    const nearbyUnits = parseCSV(nearbyUnitsContent)
    
    return NextResponse.json({
      guestCards: {
        headers: guestCards.headers,
        rows: guestCards.rows
      },
      nearbyUnits: {
        headers: nearbyUnits.headers,
        rows: nearbyUnits.rows
      },
      dataSource: dataDir.includes('MCP') ? 'tenant-leasing MCP' : 'local'
    })
  } catch (error) {
    console.error('Error reading CSV files:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}


