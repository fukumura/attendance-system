import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/adminRoutes';
import companyRoutes from './routes/companyRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Initialize Prisma client with detailed logging
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Prismaのイベントリスナーを設定
prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

prisma.$on('query', (e) => {
  console.log('Prisma query:', e);
});

// データベース接続テスト
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    // プロセスを終了しない - エラーをログに記録するだけ
  }
}

// アプリケーション起動時にデータベース接続をテスト
testDatabaseConnection();

// CORSミドルウェアの設定 - 環境変数から設定を読み込む
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization', 'X-Company-ID', 'X-Requested-With', 'Origin', 'Accept', 'Access-Control-Allow-Headers'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'),
  preflightContinue: process.env.CORS_PREFLIGHT_CONTINUE === 'true',
  optionsSuccessStatus: parseInt(process.env.CORS_OPTIONS_SUCCESS_STATUS || '204')
}));

// Helmet.jsによるセキュリティヘッダー設定（CORS互換性を確保）
app.use(helmet({
  crossOriginResourcePolicy: { 
    policy: (process.env.HELMET_CROSS_ORIGIN_POLICY as 'same-origin' | 'cross-origin' | 'same-site') || 'cross-origin' 
  },
  contentSecurityPolicy: process.env.DISABLE_CONTENT_SECURITY_POLICY === 'true' ? false : undefined
}));

// OPTIONSリクエストを確実に処理するミドルウェア
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// ペイロードサイズの制限
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 全体的なレート制限
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 100, // IPアドレスごとに100リクエストまで
  standardHeaders: true, // 'RateLimit-*' ヘッダーを含める
  legacyHeaders: false, // 'X-RateLimit-*' ヘッダーを無効化
  message: { error: 'リクエスト数が多すぎます。しばらく経ってから再試行してください。' }
});

// 全体的なレート制限を適用（OPTIONSリクエストを除外）
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return generalLimiter(req, res, next);
});

// 認証エンドポイント用の厳格なレート制限
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 10, // IPアドレスごとに10リクエストまで
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '認証リクエスト数が多すぎます。しばらく経ってから再試行してください。' }
});

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'ポケット勤怠 API' });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// API routes - レート制限をOPTIONSリクエスト以外に適用
app.use('/api/auth/login', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return authLimiter(req, res, next);
});

app.use('/api/auth/register', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return authLimiter(req, res, next);
});
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
