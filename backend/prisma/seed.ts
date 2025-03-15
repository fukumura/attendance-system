import { PrismaClient, Role, LeaveType, LeaveStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: '管理者 太郎',
      role: Role.ADMIN,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@example.com',
      password: employeePassword,
      name: '社員 一郎',
      role: Role.EMPLOYEE,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@example.com',
      password: employeePassword,
      name: '社員 二郎',
      role: Role.EMPLOYEE,
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
