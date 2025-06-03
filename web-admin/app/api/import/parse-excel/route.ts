import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    // TypeScript workaround for FormData.get() method
    const fileEntry = (formData as any).get('file')
    
    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    const file = fileEntry as File

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Use formatted strings
      dateNF: 'dd. mmm yyyy' // Date format
    })
    
    return NextResponse.json(jsonData)
  } catch (error) {
    console.error('Error parsing Excel file:', error)
    return NextResponse.json(
      { error: 'Failed to parse Excel file' },
      { status: 500 }
    )
  }
}