// Quick script to verify imported data
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  const total = await prisma.farmContact.count()
  const cielo = await prisma.farmContact.findMany({
    where: { farm: 'Cielo' },
    select: {
      firstName: true,
      lastName: true,
      email1: true,
      phoneNumber1: true,
      city: true,
      state: true,
    },
    take: 5,
  })
  
  console.log(`\n📊 Total contacts in database: ${total}`)
  console.log(`🏡 Cielo contacts: ${await prisma.farmContact.count({ where: { farm: 'Cielo' } })}`)
  console.log(`\n📋 Sample Cielo contacts:`)
  cielo.forEach(c => {
    console.log(`   - ${c.firstName} ${c.lastName} (${c.city}, ${c.state})`)
  })
  console.log('')
}

verify()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); process.exit(1) })

