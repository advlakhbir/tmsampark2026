import { STAFF_ROLES } from '@tmsampark/shared';
import { connectDb, disconnectDb } from './config/db.js';
import { User } from './models/index.js';
import { hashPassword } from './services/auth.service.js';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = (arg('email') || process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = arg('password') || process.env.ADMIN_PASSWORD || '';
  const name = arg('name') || process.env.ADMIN_NAME || 'Administrator';
  const role = arg('role') || 'super_admin';
  if (!email || !password) {
    console.error('Usage: npm run create-admin -- --email you@company.com --password "at-least-12-chars" --name "Your Name"');
    process.exit(1);
  }
  if (password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('Password must be at least 12 characters and include a letter and a number.');
    process.exit(1);
  }
  if (!STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    console.error('Role must be a staff role.');
    process.exit(1);
  }
  await connectDb();
  const existing = await User.findOne({ email });
  if (existing) {
    console.error('A user with that email already exists. Refusing to overwrite it.');
    process.exit(1);
  }
  await User.create({
    email,
    name,
    role,
    status: 'active',
    passwordHash: await hashPassword(password),
    mustChangePassword: false,
  });
  console.log(`Created ${role} ${email}. Password was not written to logs.`);
  await disconnectDb();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : 'Admin creation failed');
  await disconnectDb();
  process.exit(1);
});
