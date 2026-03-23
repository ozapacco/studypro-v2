import { db } from '../src/lib/db';

function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}

async function seed() {
  console.log('Seeding database...');
  
  await db.exams.create({
    name: 'Polícia Civil SC 2024',
    examDate: addWeeks(new Date(), 16),
    cutoffScore: 70
  });
  
  const subjects = ['Penal', 'Proc. Penal', 'Constitucional', 'Administrativo', 'Português', 'Informática'];
  for (const name of subjects) {
    await db.subjects.create({
      name,
      weight: 100 / subjects.length,
      targetAccuracy: 70
    });
  }
  
  console.log('✓ Database seeded');
}

seed().catch(console.error);
