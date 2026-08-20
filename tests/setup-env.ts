// Runs before every test file — point Prisma at the test database
// before lib/db is imported anywhere.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://sahara:sahara@localhost:5433/sahara_test";
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DIRECT_URL = TEST_DATABASE_URL;
process.env.SESSION_SECRET = "test-secret";
process.env.APP_URL = "http://localhost:3000";
