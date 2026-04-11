const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.question.findMany().then(qs => {
    qs.forEach(q => {
        console.log('Title:', q.title);
        console.log('Sample Tests:', JSON.stringify(q.sampleTests, null, 2));
    });
    prisma.$disconnect();
});
