const { PrismaClient } = require('@prisma/client');

// Global singleton PrismaClient - reuse across the entire application.
// Creating multiple PrismaClient instances opens multiple connection pools,
// which can exhaust database connection limits (especially on Neon/planetscale).
// This file should be imported everywhere instead of `new PrismaClient()`.
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

module.exports = prisma;