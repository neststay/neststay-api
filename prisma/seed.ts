import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { ulid } from 'ulid';
import { faker } from '@faker-js/faker';

const SALT_ROUNDS = 10;

const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Goa',
  'Jaipur',
  'Udaipur',
  'Kochi',
  'Manali',
  'Rishikesh',
  'Pondicherry',
];

const PLACE_TYPES = [
  'Apartment',
  'Villa',
  'House',
  'Cottage',
  'Farmhouse',
  'Resort',
  'Guesthouse',
  'Homestay',
];

async function main(): Promise<void> {
  if (process.env.APP_ENV === 'production') {
    console.log('Skipping seed in production');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedUsers(prisma);
    await seedLocations(prisma);
    await seedPlaceTypes(prisma);
    await seedProperties(prisma);
    console.log('Seeding completed successfully');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function seedUsers(prisma: PrismaClient): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';
  const userCount = parseInt(process.env.SEED_USER_COUNT || '10', 10);
  const userPassword = process.env.SEED_USER_PASSWORD || 'password123';

  // Upsert admin user
  const hashedAdminPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      slug: ulid(),
      name: 'Admin',
      email: adminEmail,
      password: hashedAdminPassword,
    },
  });

  console.log(`Admin user ensured: ${adminEmail}`);

  // Generate and insert fake users
  const hashedUserPassword = await bcrypt.hash(userPassword, SALT_ROUNDS);
  const fakeUsers = Array.from({ length: userCount }).map(() => ({
    slug: ulid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: hashedUserPassword,
  }));

  try {
    await prisma.user.createMany({
      data: fakeUsers,
      skipDuplicates: true,
    });
    console.log(`Generated and inserted fake users (up to ${userCount})`);
  } catch (error) {
    console.error('Error inserting fake users:', error);
    throw error;
  }
}

async function seedLocations(prisma: PrismaClient): Promise<void> {
  await prisma.location.createMany({
    data: INDIAN_CITIES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log(`Locations ensured: ${INDIAN_CITIES.join(', ')}`);
}

async function seedPlaceTypes(prisma: PrismaClient): Promise<void> {
  await prisma.placeType.createMany({
    data: PLACE_TYPES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log(`Place types ensured: ${PLACE_TYPES.join(', ')}`);
}

async function seedProperties(prisma: PrismaClient): Promise<void> {
  const propertyCount = parseInt(process.env.SEED_PROPERTY_COUNT || '10', 10);

  const [locations, placeTypes, users] = await Promise.all([
    prisma.location.findMany({ select: { id: true } }),
    prisma.placeType.findMany({ select: { id: true } }),
    prisma.user.findMany({ select: { id: true } }),
  ]);

  const fakeProperties = Array.from({ length: propertyCount }).map(() => ({
    slug: ulid(),
    hostId: faker.helpers.arrayElement(users).id,
    locationId: faker.helpers.arrayElement(locations).id,
    placeTypeId: faker.helpers.arrayElement(placeTypes).id,
    nightlyRate: faker.number.float({ min: 20, max: 500, fractionDigits: 2 }),
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    numberOfGuests: faker.number.int({ min: 1, max: 10 }),
    numberOfBedrooms: faker.number.int({ min: 1, max: 5 }),
    numberOfBathrooms: faker.number.int({ min: 1, max: 4 }),
  }));

  try {
    await prisma.property.createMany({
      data: fakeProperties,
      skipDuplicates: true,
    });
    console.log(
      `Generated and inserted fake properties (up to ${propertyCount})`,
    );
  } catch (error) {
    console.error('Error inserting fake properties:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
