const { execSync } = require('node:child_process');

module.exports = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Integration tests that require DB will likely fail.');
    return;
  }
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to prepare database for tests');
    throw e;
  }
};



