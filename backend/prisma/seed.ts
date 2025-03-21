import { PrismaClient, Role, LeaveType, LeaveStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// 日付ユーティリティ関数
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const setTime = (date: Date, hours: number, minutes: number = 0): Date => {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

// 曜日判定（0: 日曜日, 6: 土曜日）
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

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
  await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      password: superAdminPassword,
      name: 'スーパー管理者',
      role: Role.SUPER_ADMIN,
      // companyId is null
    },
  });
  
  console.log('Created super admin');

  // Create users for company 1
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: '管理者 太郎',
      role: Role.ADMIN,
      companyId: company1.id,
      isEmailVerified: true, // メール認証済みに設定
    },
  });

  // 株式会社サンプルの従業員を増やす（コンプライアンスレポート用）
  const company1EmployeeIds: string[] = [];
  
  // 既存の従業員
  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@example.com',
      password: employeePassword,
      name: '社員 一郎',
      role: Role.EMPLOYEE,
      companyId: company1.id,
      isEmailVerified: true,
    },
  });
  company1EmployeeIds.push(employee1.id);

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@example.com',
      password: employeePassword,
      name: '社員 二郎',
      role: Role.EMPLOYEE,
      companyId: company1.id,
      isEmailVerified: true,
    },
  });
  company1EmployeeIds.push(employee2.id);
  
  // 追加の従業員（コンプライアンスレポート用）
  const lastNames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
  const firstNames = ['太郎', '次郎', '三郎', '四郎', '五郎', '花子', '幸子', '裕子', '和子', '恵子'];
  
  for (let i = 3; i <= 15; i++) {
    const lastNameIndex = Math.floor(Math.random() * lastNames.length);
    const firstNameIndex = Math.floor(Math.random() * firstNames.length);
    
    const employee = await prisma.user.create({
      data: {
        email: `employee${i}@example.com`,
        password: employeePassword,
        name: `${lastNames[lastNameIndex]} ${firstNames[firstNameIndex]}`,
        role: Role.EMPLOYEE,
        companyId: company1.id,
        isEmailVerified: true,
      },
    });
    
    company1EmployeeIds.push(employee.id);
  }
  
  // Create users for company 2
  await prisma.user.create({
    data: {
      email: 'admin2@example.com',
      password: adminPassword,
      name: '管理者 花子',
      role: Role.ADMIN,
      companyId: company2.id,
    },
  });
  
  await prisma.user.create({
    data: {
      email: 'employee3@example.com',
      password: employeePassword,
      name: '社員 三郎',
      role: Role.EMPLOYEE,
      companyId: company2.id,
    },
  });

  console.log(`Created ${company1EmployeeIds.length + 3} users`);

  // 勤怠記録の作成（コンプライアンスレポート用）
  // 3月のデータを作成（2025年3月を想定）
  const currentYear = 2025;
  const currentMonth = 2; // 0-indexed (0: 1月, 1: 2月, 2: 3月, ...)
  
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);
  
  console.log(`Creating attendance records from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  // 従業員の勤怠パターンを設定
  // 残業多めの従業員（月45時間超過）
  const overtimeEmployeeIds = [company1EmployeeIds[0], company1EmployeeIds[3], company1EmployeeIds[7]];
  
  // 深夜勤務が多い従業員
  const nightWorkEmployeeIds = [company1EmployeeIds[1], company1EmployeeIds[4], company1EmployeeIds[8]];
  
  // 休日出勤が多い従業員
  const holidayWorkEmployeeIds = [company1EmployeeIds[2], company1EmployeeIds[5], company1EmployeeIds[9]];
  
  // 休憩不足の従業員
  const insufficientBreakEmployeeIds = [company1EmployeeIds[6], company1EmployeeIds[10]];
  
  // 有給休暇取得が少ない従業員
  const lowPaidLeaveEmployeeIds = [company1EmployeeIds[11], company1EmployeeIds[12]];
  
  // 有給休暇取得が多い従業員（5日以上）
  const highPaidLeaveEmployeeIds = [company1EmployeeIds[13], company1EmployeeIds[14]];
  
  // 日付ごとに勤怠記録を作成
  for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
    const isWeekendDay = isWeekend(date);
    
    // 各従業員の勤怠記録を作成
    for (const employeeId of company1EmployeeIds) {
      // 休日出勤パターン
      if (isWeekendDay) {
        // 休日出勤する従業員
        if (holidayWorkEmployeeIds.includes(employeeId) && Math.random() < 0.4) {
          const clockInTime = setTime(date, 10, Math.floor(Math.random() * 30));
          const clockOutTime = setTime(date, 16 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
          
          await prisma.attendanceRecord.create({
            data: {
              userId: employeeId,
              date: new Date(date),
              clockInTime,
              clockOutTime,
              location: Math.random() < 0.7 ? 'オフィス' : 'リモート',
              notes: '休日出勤',
            },
          });
        }
        continue;
      }
      
      // 欠勤確率（5%）
      if (Math.random() < 0.05) continue;
      
      // 基本の出退勤時間
      let clockInHour = 8 + Math.floor(Math.random() * 2);
      let clockInMinute = Math.floor(Math.random() * 30);
      let clockOutHour = 17 + Math.floor(Math.random() * 2);
      let clockOutMinute = 30 + Math.floor(Math.random() * 30);
      let notes = '';
      
      // 残業パターン
      if (overtimeEmployeeIds.includes(employeeId)) {
        clockOutHour += 2 + Math.floor(Math.random() * 3); // 19時〜21時
        if (clockOutHour >= 22) {
          notes = '深夜残業';
        } else {
          notes = '残業';
        }
      }
      
      // 深夜勤務パターン
      if (nightWorkEmployeeIds.includes(employeeId) && Math.random() < 0.3) {
        if (Math.random() < 0.5) {
          // 夜遅くまで勤務
          clockOutHour = 22 + Math.floor(Math.random() * 3);
          notes = '深夜勤務';
        } else {
          // 早朝勤務
          clockInHour = 4 + Math.floor(Math.random() * 2);
          notes = '早朝勤務';
        }
      }
      
      // 休憩不足パターン（9時間以上勤務だが休憩時間が短い）
      if (insufficientBreakEmployeeIds.includes(employeeId) && clockOutHour - clockInHour >= 9) {
        notes = notes || '休憩時間短め（30〜50分）';
      }
      
      const clockInTime = setTime(date, clockInHour, clockInMinute);
      const clockOutTime = setTime(date, clockOutHour, clockOutMinute);
      
      await prisma.attendanceRecord.create({
        data: {
          userId: employeeId,
          date: new Date(date),
          clockInTime,
          clockOutTime,
          location: Math.random() < 0.7 ? 'オフィス' : 'リモート',
          notes,
        },
      });
    }
  }
  
  console.log('Created attendance records');
  
  // 有給休暇申請の作成
  // 有給休暇取得が多い従業員
  for (const employeeId of highPaidLeaveEmployeeIds) {
    // 5日以上の有給休暇
    const leaveCount = 5 + Math.floor(Math.random() * 3); // 5〜7日
    
    for (let i = 0; i < leaveCount; i++) {
      const startDay = 5 + Math.floor(Math.random() * 20); // 5日〜25日
      const startDate = new Date(currentYear, currentMonth, startDay);
      const endDate = new Date(startDate);
      
      // 1〜3日の連続休暇
      if (Math.random() < 0.3 && i < leaveCount - 2) {
        endDate.setDate(endDate.getDate() + 1 + Math.floor(Math.random() * 2));
        i += endDate.getDate() - startDate.getDate();
      }
      
      await prisma.leaveRequest.create({
        data: {
          userId: employeeId,
          startDate,
          endDate,
          leaveType: LeaveType.PAID,
          reason: '有給休暇',
          status: LeaveStatus.APPROVED,
          comment: '承認済み',
        },
      });
    }
  }
  
  // 有給休暇取得が少ない従業員
  for (const employeeId of lowPaidLeaveEmployeeIds) {
    // 1〜2日の有給休暇
    const leaveCount = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < leaveCount; i++) {
      const startDay = 5 + Math.floor(Math.random() * 20);
      const startDate = new Date(currentYear, currentMonth, startDay);
      
      await prisma.leaveRequest.create({
        data: {
          userId: employeeId,
          startDate,
          endDate: startDate, // 1日のみ
          leaveType: LeaveType.PAID,
          reason: '有給休暇',
          status: LeaveStatus.APPROVED,
          comment: '承認済み',
        },
      });
    }
  }
  
  // その他の従業員の休暇申請
  for (const employeeId of company1EmployeeIds) {
    if (
      highPaidLeaveEmployeeIds.includes(employeeId) ||
      lowPaidLeaveEmployeeIds.includes(employeeId)
    ) {
      continue; // すでに処理済み
    }
    
    // 有給休暇（2〜4日）
    if (Math.random() < 0.7) {
      const leaveCount = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < leaveCount; i++) {
        const startDay = 5 + Math.floor(Math.random() * 20);
        const startDate = new Date(currentYear, currentMonth, startDay);
        const endDate = new Date(startDate);
        
        // 連続休暇の可能性
        if (Math.random() < 0.2) {
          endDate.setDate(endDate.getDate() + 1);
          i++;
        }
        
        await prisma.leaveRequest.create({
          data: {
            userId: employeeId,
            startDate,
            endDate,
            leaveType: LeaveType.PAID,
            reason: '有給休暇',
            status: LeaveStatus.APPROVED,
            comment: '承認済み',
          },
        });
      }
    }
    
    // 病気休暇（0〜2日）
    if (Math.random() < 0.3) {
      const startDay = 5 + Math.floor(Math.random() * 20);
      const startDate = new Date(currentYear, currentMonth, startDay);
      const endDate = new Date(startDate);
      
      if (Math.random() < 0.3) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      await prisma.leaveRequest.create({
        data: {
          userId: employeeId,
          startDate,
          endDate,
          leaveType: LeaveType.SICK,
          reason: '体調不良のため',
          status: LeaveStatus.APPROVED,
          comment: '承認済み',
        },
      });
    }
    
    // その他の休暇（0〜1日）
    if (Math.random() < 0.2) {
      const startDay = 5 + Math.floor(Math.random() * 20);
      const startDate = new Date(currentYear, currentMonth, startDay);
      
      await prisma.leaveRequest.create({
        data: {
          userId: employeeId,
          startDate,
          endDate: startDate,
          leaveType: Math.random() < 0.5 ? LeaveType.UNPAID : LeaveType.OTHER,
          reason: Math.random() < 0.5 ? '私用のため' : '冠婚葬祭',
          status: LeaveStatus.APPROVED,
          comment: '承認済み',
        },
      });
    }
  }
  
  // 申請中の休暇
  for (let i = 0; i < 3; i++) {
    const employeeIndex = Math.floor(Math.random() * company1EmployeeIds.length);
    const employeeId = company1EmployeeIds[employeeIndex];
    
    const startDay = new Date().getDate() + 5 + Math.floor(Math.random() * 10);
    const startDate = new Date(currentYear, currentMonth, startDay);
    const endDate = new Date(startDate);
    
    if (Math.random() < 0.3) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    await prisma.leaveRequest.create({
      data: {
        userId: employeeId,
        startDate,
        endDate,
        leaveType: Math.random() < 0.7 ? LeaveType.PAID : LeaveType.OTHER,
        reason: '予定あり',
        status: LeaveStatus.PENDING,
      },
    });
  }
  
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
