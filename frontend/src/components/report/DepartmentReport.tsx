import React, { useEffect, useState } from 'react';
import { useReportStore } from '../../store/reportStore';

const DepartmentReport: React.FC = () => {
  const { departmentReport, isLoading, error, fetchDepartmentReport } = useReportStore();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  // コンポーネントマウント時にレポートを取得
  useEffect(() => {
    fetchDepartmentReport({ year, month });
  }, [fetchDepartmentReport, year, month]);

  // 年月選択肢の生成
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (isLoading && !departmentReport) {
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
        <h2 className="text-xl font-semibold">部門レポート</h2>
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
            onClick={() => fetchDepartmentReport({ year, month })}
            className="mt-2 text-blue-500 hover:underline"
          >
            再読み込み
          </button>
        </div>
      ) : departmentReport ? (
        <div>
          {/* 期間情報 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">期間</h3>
            <p className="font-medium">
              {formatDate(departmentReport.period.startDate)} 〜 {formatDate(departmentReport.period.endDate)}
            </p>
          </div>
          
          {/* 部門サマリー */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">部門サマリー</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">総ユーザー数</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.totalUsers}人</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">総勤務日数</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.totalWorkingDays}日</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">総勤務時間</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.totalWorkingHours.toFixed(1)}時間</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 mb-1">平均勤務時間/ユーザー</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.averageWorkingHoursPerUser.toFixed(1)}時間</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">総休暇日数</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.totalLeaveDays}日</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">有給休暇消化率</p>
                <p className="text-2xl font-bold">
                  {departmentReport.departmentSummary.totalLeaveDays > 0
                    ? ((departmentReport.departmentSummary.leaveCountByType.PAID / departmentReport.departmentSummary.totalLeaveDays) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
          
          {/* ユーザー別レポート */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">ユーザー別レポート</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務日数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務時間</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">休暇日数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentReport.userReports.map((userReport) => (
                    <tr key={userReport.user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userReport.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userReport.attendance.totalWorkingDays}日
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userReport.attendance.totalWorkingHours.toFixed(1)}時間
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userReport.leave.totalLeaveDays}日
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userReport.user.role === 'ADMIN' 
                          ? '管理者' 
                          : userReport.user.role === 'SUPER_ADMIN'
                            ? 'スーパー管理者'
                            : '従業員'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 休暇種別サマリー */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">休暇種別サマリー</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">有給休暇</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.leaveCountByType.PAID}日</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">無給休暇</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.leaveCountByType.UNPAID}日</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">病気休暇</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.leaveCountByType.SICK}日</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">その他</p>
                <p className="text-2xl font-bold">{departmentReport.departmentSummary.leaveCountByType.OTHER}日</p>
              </div>
            </div>
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

export default DepartmentReport;
