export async function parseCSV(file: File): Promise<any[]> {
  const text = await file.text()
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) return []
  
  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }
  }
  
  return data
}

function parseCSVLine(line: string): string[] {
  const result = []
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

export async function parseExcel(file: File): Promise<any[]> {
  // For now, we'll need to handle Excel files on the server side
  // This is a placeholder that will send the file to an API endpoint
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/import/parse-excel', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('Failed to parse Excel file')
  }
  
  return response.json()
}