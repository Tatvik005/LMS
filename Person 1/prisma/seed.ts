import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const facultyPassword = await bcrypt.hash('Faculty@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);

  // Seed Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      name: 'Super Admin',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  // Seed 2 Faculty
  for (let i = 1; i <= 2; i++) {
    await prisma.user.upsert({
      where: { email: `faculty${i}@lms.com` },
      update: {},
      create: {
        email: `faculty${i}@lms.com`,
        name: `Faculty ${i}`,
        password: facultyPassword,
        role: Role.FACULTY,
      },
    });
  }

  // Seed 3 Students
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `student${i}@lms.com` },
      update: {},
      create: {
        email: `student${i}@lms.com`,
        name: `Student ${i}`,
        password: studentPassword,
        role: Role.STUDENT,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
