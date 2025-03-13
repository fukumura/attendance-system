# Prisma Database Management

This directory contains the Prisma schema and database migration files for the attendance management system.

## Schema

The `schema.prisma` file defines the data models for the application:

- `User`: Represents system users (employees and administrators)
- `AttendanceRecord`: Represents attendance records (clock-in/clock-out)
- `LeaveRequest`: Represents leave requests (vacation, sick leave, etc.)

## Commands

### Generate Prisma Client

```bash
npm run prisma:generate
```

This command generates the Prisma Client based on your schema. Run this after making changes to the schema.

### Create Migration

```bash
npm run prisma:migrate
```

This command creates a new migration based on changes to the schema. It will prompt you to name the migration.

### Apply Migrations

```bash
npx prisma migrate deploy
```

This command applies all pending migrations to the database. Use this in production environments.

### Reset Database

```bash
npx prisma migrate reset
```

This command resets the database, applies all migrations, and runs the seed script. Use this for development only.

### Seed Database

```bash
npm run prisma:seed
```

This command populates the database with initial data defined in `seed.ts`.

## Seed Data

The seed script (`seed.ts`) creates:

- Admin user: admin@example.com / admin123
- Employee users: employee1@example.com, employee2@example.com / employee123
- Sample attendance records
- Sample leave requests

## Database URL

The database connection is configured using the `DATABASE_URL` environment variable in the `.env` file.

## Development Workflow

1. Make changes to `schema.prisma`
2. Run `npm run prisma:generate` to update the Prisma Client
3. Run `npm run prisma:migrate` to create a migration
4. Run `npx prisma migrate reset` to apply migrations and seed data
