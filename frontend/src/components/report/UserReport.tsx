import React, { useEffect, useState } from 'react';
import { useReportStore } from '../../store/reportStore';
import { useAuthStore } from '../../store/authStore';

interface UserReportProps {
  userId?: string;
}

const UserReport: React.FC<UserReportProps> = ({ userId }) => {
  const { user } = useAuthStore();
  const { userReport, isLoading, error, fetchUserReport, exportReport } = useReportStore();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  // コンポーネントマウント時にレポートを取得
  useEffect(() => {
    const targetUserId = userId || user?.id;
    if (targetUserId) {
      fetchUserReport(targetUserId, { year, month });
    }
  }, [fetchUserReport, userId, user?.id, year, month]);

  // 年月選択肢の生成
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };

  const handleExport = (type: 'attendance' | 'leave') => {
    const targetUserId = userId || user?.id;
    if (targetUserId) {
      exportReport({
        userId: targetUserId,
        year,
        month,
        type,
      });
    }
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (isLoading && !userReport) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">ユーザーレポート</h2>
        <div className="flex space-x-4">
          <div>
            <label htmlFor="year" className="block text-sm text-gray-600 mb-1">年</label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {generateYearOptions().map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month" className="block text-sm text-gray-600 mb-1">月</label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {error ? (
        <div className="text-red-500 mb-4">
          <p>レポートの取得中にエラーが発生しました</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              const targetUserId = userId || user?.id;
              if (targetUserId) {
                fetchUserReport(targetUserId, { year, month });
              }
            }}
            className="mt-2 text-blue-500 hover:underline"
          >
            再読み込み
          </button>
        </div>
      ) : userReport ? (
        <div>
          {/* ユーザー情報 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">ユーザー情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">名前</p>
                <p className="font-medium">{userReport.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">メール</p>
                <p className="font-medium">{userReport.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">期間</p>
                <p className="font-medium">
                  {formatDate(userReport.period.startDate)} 〜 {formatDate(userReport.period.endDate)}
                </p>
              </div>
            </div>
          </div>
          
          {/* 勤怠サマリー */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">勤怠サマリー</h3>
              <button
                onClick={() => handleExport('attendance')}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                CSVエクスポート
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">総勤務日数</p>
                <p className="text-2xl font-bold">{userReport.attendance.totalWorkingDays}日</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">総勤務時間</p>
                <p className="text-2xl font-bold">{userReport.attendance.totalWorkingHours.toFixed(1)}時間</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">平均勤務時間</p>
                <p className="text-2xl font-bold">{userReport.attendance.averageWorkingHours.toFixed(1)}時間/日</p>
              </div>
            </div>
            
            {userReport.attendance.dailyWorkingHours.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務時間</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userReport.attendance.dailyWorkingHours.map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.hours.toFixed(1)}時間
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* 休暇サマリー */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">休暇サマリー</h3>
              <button
                onClick={() => handleExport('leave')}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                CSVエクスポート
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">総休暇日数</p>
                <p className="text-2xl font-bold">{userReport.leave.totalLeaveDays}日</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">有給休暇</p>
                <p className="text-2xl font-bold">{userReport.leave.leaveCountByType.PAID}日</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">病気休暇</p>
                <p className="text-2xl font-bold">{userReport.leave.leaveCountByType.SICK}日</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">その他休暇</p>
                <p className="text-2xl font-bold">{userReport.leave.leaveCountByType.OTHER + userReport.leave.leaveCountByType.UNPAID}日</p>
              </div>
            </div>
            
            {userReport.leave.requests.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">期間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userReport.leave.requests.map((leave) => {
                      const startDate = new Date(leave.startDate);
                      const endDate = new Date(leave.endDate);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                        <tr key={leave.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(leave.startDate)} 〜 {formatDate(leave.endDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {diffDays}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.leaveType === 'PAID' ? '有給休暇' :
                             leave.leaveType === 'UNPAID' ? '無給休暇' :
                             leave.leaveType === 'SICK' ? '病気休暇' : 'その他'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {leave.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          レポートデータがありません
        </div>
      )}
    </div>
  );
};

export default UserReport;
