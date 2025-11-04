// Script to import data directly to production via API
// This calls the production API endpoints to import data

const PROD_URL = process.env.PROD_URL || 'https://farmtrackr-7g6xkshq0-danas-projects-3d9348e4.vercel.app'

async function importToProduction() {
  try {
    console.log(`\n🚀 Importing Cielo data to production: ${PROD_URL}\n`)
    
    // First, import via Google Sheets API endpoint
    const response = await fetch(`${PROD_URL}/api/google-sheets/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ farm: 'Cielo' }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.error === 'Unable to access Google Sheet directly') {
        console.log('❌ Sheet is private')
        console.log('📝 Message:', data.message)
        console.log('\n💡 Options:')
        console.log('   1. Make sheet publicly viewable temporarily')
        console.log('   2. Export as CSV and use file upload on the Import & Export page')
        return
      }
      console.error('❌ Error:', data.error || data.message)
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
  }
}

importToProduction()

