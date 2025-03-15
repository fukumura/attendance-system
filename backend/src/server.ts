import app from './app';

const PORT = process.env.PORT || 5000;

// グローバルな未処理の例外ハンドラー
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // プロセスを終了しない - エラーをログに記録するだけ
});

// グローバルな未処理のPromise拒否ハンドラー
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  // プロセスを終了しない - エラーをログに記録するだけ
});

// サーバー起動時のエラーハンドリング
try {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')}`);
  });

  // サーバーエラーハンドリング
  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
  });
} catch (error) {
  console.error('Failed to start server:', error);
}
