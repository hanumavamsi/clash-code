const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('prisma/seeded_problems.json', 'utf8'));

  for (const q of data) {
    const sampleTests = q.tests.filter(t => t.isSample).map(t => ({ input: t.input, expected: t.expected }));
    const hiddenTests = q.tests.filter(t => !t.isSample).map(t => ({ input: t.input, expected: t.expected }));

    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        args: q.args,
        returnType: q.returnType,
        sampleTests,
        hiddenTests
      },
      create: {
        id: q.id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        args: q.args,
        returnType: q.returnType,
        sampleTests,
        hiddenTests
      }
    });
    console.log(`Seeded question: ${q.title} with ${sampleTests.length} samples and ${hiddenTests.length} hidden tests.`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
