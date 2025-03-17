import { PrismaClient, Role, LeaveType, LeaveStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('Seeding database...');
  
  // Create companies
  const company1 = await prisma.company.create({
    data: {
      name: '株式会社サンプル',
      publicId: crypto.randomBytes(8).toString('hex'),
      logoUrl: 'https://via.placeholder.com/150?text=Sample+Inc',
    },
  });
  
  const company2 = await prisma.company.create({
    data: {
      name: 'テスト企業株式会社',
      publicId: crypto.randomBytes(8).toString('hex'),
      logoUrl: 'https://via.placeholder.com/150?text=Test+Corp',
    },
  });
  
  console.log('Created companies');
  
  // Create super admin (not associated with any company)
  const superAdminPassword = await bcrypt.hash('SuperAdmin123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      password: superAdminPassword,
      name: 'スーパー管理者',
      role: Role.SUPER_ADMIN,
      // companyId is null
      isEmailVerified: true, // メール認証済みに設定
    },
  });
  
  console.log('Created super admin');

  // Create users for company 1
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: '管理者 太郎',
      role: Role.ADMIN,
      companyId: company1.id,
      isEmailVerified: true, // メール認証済みに設定
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@example.com',
      password: employeePassword,
      name: '社員 一郎',
      role: Role.EMPLOYEE,
      companyId: company1.id,
      isEmailVerified: true, // メール認証済みに設定
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@example.com',
      password: employeePassword,
      name: '社員 二郎',
      role: Role.EMPLOYEE,
      companyId: company1.id,
    },
  });
  
  // Create users for company 2
  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@example.com',
      password: adminPassword,
      name: '管理者 花子',
      role: Role.ADMIN,
      companyId: company2.id,
    },
  });
  
  const employee3 = await prisma.user.create({
    data: {
      email: 'employee3@example.com',
      password: employeePassword,
      name: '社員 三郎',
      role: Role.EMPLOYEE,
      companyId: company2.id,
    },
  });

  console.log('Created users');

  // Create attendance records
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Employee 1 attendance records
  await prisma.attendanceRecord.create({
    data: {
      userId: employee1.id,
      date: twoDaysAgo,
      clockInTime: new Date(twoDaysAgo.setHours(9, 0, 0)),
      clockOutTime: new Date(twoDaysAgo.setHours(18, 0, 0)),
      location: 'オフィス',
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      userId: employee1.id,
      date: yesterday,
      clockInTime: new Date(yesterday.setHours(9, 15, 0)),
      clockOutTime: new Date(yesterday.setHours(18, 30, 0)),
      location: 'オフィス',
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      userId: employee1.id,
      date: today,
      clockInTime: new Date(today.setHours(9, 5, 0)),
      clockOutTime: null,
      location: 'リモート',
    },
  });

  // Employee 2 attendance records
  await prisma.attendanceRecord.create({
    data: {
      userId: employee2.id,
      date: twoDaysAgo,
      clockInTime: new Date(twoDaysAgo.setHours(8, 45, 0)),
      clockOutTime: new Date(twoDaysAgo.setHours(17, 30, 0)),
      location: 'オフィス',
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      userId: employee2.id,
      date: yesterday,
      clockInTime: new Date(yesterday.setHours(8, 50, 0)),
      clockOutTime: new Date(yesterday.setHours(17, 45, 0)),
      location: 'オフィス',
    },
  });

  console.log('Created attendance records');

  // Create leave requests
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const weekAfterNext = new Date(nextWeek);
  weekAfterNext.setDate(weekAfterNext.getDate() + 7);

  await prisma.leaveRequest.create({
    data: {
      userId: employee1.id,
      startDate: nextWeek,
      endDate: nextWeek,
      leaveType: LeaveType.PAID,
      reason: '私用のため',
      status: LeaveStatus.PENDING,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      userId: employee2.id,
      startDate: weekAfterNext,
      endDate: new Date(weekAfterNext.setDate(weekAfterNext.getDate() + 2)),
      leaveType: LeaveType.PAID,
      reason: '夏季休暇',
      status: LeaveStatus.APPROVED,
      comment: '承認しました。',
    },
  });

  console.log('Created leave requests');
  console.log('Database seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
