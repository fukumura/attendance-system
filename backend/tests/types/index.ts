import { User, AttendanceRecord, LeaveRequest, Company } from '@prisma/client';

// User related types
export type UserCreateInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
  companyId?: string | null;
  isEmailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
};

export type UserResponse = Omit<User, 'password'>;

// Attendance related types
export type AttendanceRecordCreateInput = {
  userId: string;
  date: Date;
  clockInTime: Date;
  clockOutTime?: Date | null;
  notes?: string | null;
  location?: string | null;
};

export type AttendanceRecordResponse = AttendanceRecord;

// Leave related types
export type LeaveRequestCreateInput = {
  userId: string;
  startDate: Date;
  endDate: Date;
  leaveType: string;
  reason?: string | null;
  status?: string;
  comment?: string | null;
};

export type LeaveRequestResponse = LeaveRequest;

// Company related types
export type CompanyCreateInput = {
  name: string;
  publicId?: string;
  logoUrl?: string | null;
  settings?: any;
};

export type CompanyResponse = Company;

// Pagination types
export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginationResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Mock function types for Jest
export type MockResolvedValueFunction<T> = jest.Mock<Promise<T>, []>;
export type MockRejectedValueFunction = jest.Mock<Promise<never>, [Error]>;

// Prisma mock return types
export type PrismaMockReturnTypes = {
  user: {
    findUnique: MockResolvedValueFunction<User | null>;
    findFirst: MockResolvedValueFunction<User | null>;
    findMany: MockResolvedValueFunction<User[]>;
    create: MockResolvedValueFunction<User>;
    update: MockResolvedValueFunction<User>;
    delete: MockResolvedValueFunction<User>;
    count: MockResolvedValueFunction<number>;
  };
  attendanceRecord: {
    findUnique: MockResolvedValueFunction<AttendanceRecord | null>;
    findFirst: MockResolvedValueFunction<AttendanceRecord | null>;
    findMany: MockResolvedValueFunction<AttendanceRecord[]>;
    create: MockResolvedValueFunction<AttendanceRecord>;
    update: MockResolvedValueFunction<AttendanceRecord>;
    delete: MockResolvedValueFunction<AttendanceRecord>;
    count: MockResolvedValueFunction<number>;
  };
  leaveRequest: {
    findUnique: MockResolvedValueFunction<LeaveRequest | null>;
    findFirst: MockResolvedValueFunction<LeaveRequest | null>;
    findMany: MockResolvedValueFunction<LeaveRequest[]>;
    create: MockResolvedValueFunction<LeaveRequest>;
    update: MockResolvedValueFunction<LeaveRequest>;
    delete: MockResolvedValueFunction<LeaveRequest>;
    count: MockResolvedValueFunction<number>;
  };
  company: {
    findUnique: MockResolvedValueFunction<Company | null>;
    findFirst: MockResolvedValueFunction<Company | null>;
    findMany: MockResolvedValueFunction<Company[]>;
    create: MockResolvedValueFunction<Company>;
    update: MockResolvedValueFunction<Company>;
    delete: MockResolvedValueFunction<Company>;
    count: MockResolvedValueFunction<number>;
  };
};
