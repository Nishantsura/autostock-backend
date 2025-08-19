require('dotenv/config');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-minimum-32-characters-long';
// Only use DATABASE_URL if provided externally (e.g., Postgres). Do not set a default here.
process.env.PORT = process.env.PORT || '0';


