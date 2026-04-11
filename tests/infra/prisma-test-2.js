const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'], errorFormat: 'pretty', logQueries: true });
console.log(prisma !== undefined ? "Success" : "Fail");
