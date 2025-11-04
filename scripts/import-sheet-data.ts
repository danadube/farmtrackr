// Script to import data from Google Sheets via API
// This requires the server to be running: npm run dev

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function importFromGoogleSheet(farm: string) {
  try {
    console.log(`\n🚀 Importing data for ${farm}...\n`)
    
    const response = await fetch(`${API_URL}/api/google-sheets/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ farm }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', data.error)
      if (data.message) {
        console.log('📝', data.message)
      }
      if (data.spreadsheetUrl) {
        console.log('🔗 Spreadsheet:', data.spreadsheetUrl)
      }
      return
    }

    console.log(`✅ Success!`)
    console.log(`   📊 Total rows: ${data.total}`)
    console.log(`   ✅ Imported: ${data.imported}`)
    console.log(`   ⏭️  Skipped: ${data.skipped}`)
    console.log(`   ❌ Errors: ${data.errors}`)
    console.log(`\n📝 ${data.message}\n`)
  } catch (error) {
    console.error('💥 Failed to import:', error)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
  }
}

// Import Cielo data
importFromGoogleSheet('Cielo')
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

