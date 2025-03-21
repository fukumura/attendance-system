import React, { useEffect, useState } from 'react';
import { useReportStore } from '../../store/reportStore';

const CompanyComplianceReport: React.FC = () => {
  const { companyComplianceReport, isLoading, error, fetchCompanyComplianceReport } = useReportStore();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  // コンポーネントマウント時にレポートを取得
  useEffect(() => {
    fetchCompanyComplianceReport({ year, month });
  }, [fetchCompanyComplianceReport, year, month]);

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

  // パーセント表示用フォーマット関数
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // 時間表示用フォーマット関数
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}時間`;
  };

  if (isLoading && !companyComplianceReport) {
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
        <h2 className="text-xl font-semibold">会社コンプライアンスレポート</h2>
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
            onClick={() => fetchCompanyComplianceReport({ year, month })}
            className="mt-2 text-blue-500 hover:underline"
          >
            再読み込み
          </button>
        </div>
      ) : companyComplianceReport ? (
        <div>
          {/* 期間情報 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">期間</h3>
            <p className="font-medium">
              {formatDate(companyComplianceReport.period.startDate)} 〜 {formatDate(companyComplianceReport.period.endDate)}
            </p>
          </div>
          
          {/* 会社サマリー */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">会社サマリー</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">総ユーザー数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.companySummary.totalUsers}人</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">アクティブユーザー数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.companySummary.activeUsers}人</p>
                <p className="text-sm text-gray-500">
                  ({formatPercent(companyComplianceReport.companySummary.activeUsers / companyComplianceReport.companySummary.totalUsers * 100)})
                </p>
              </div>
            </div>
          </div>
          
          {/* 残業時間状況 */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-3">残業時間状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">総残業時間</p>
                <p className="text-2xl font-bold">{formatHours(companyComplianceReport.complianceReport.overtimeStatus.totalOvertimeHours)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">平均残業時間/ユーザー</p>
                <p className="text-2xl font-bold">{formatHours(companyComplianceReport.complianceReport.overtimeStatus.averageOvertimeHours)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">月45時間超過者数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.overtimeStatus.excessiveOvertimeCount}人</p>
                <p className="text-sm text-gray-500">
                  ({formatPercent(companyComplianceReport.complianceReport.overtimeStatus.excessiveOvertimeRate)})
                </p>
              </div>
            </div>
            
            {/* 残業時間トップ10 */}
            {companyComplianceReport.complianceReport.overtimeStatus.topOvertimeUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">残業時間トップ10</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">残業時間</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">法定超過日数</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyComplianceReport.complianceReport.overtimeStatus.topOvertimeUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(user.overtimeHours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.excessDays}日
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* 休憩取得状況 */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-3">休憩取得状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">総勤務日数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.breakTimeStatus.totalWorkingDays}日</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">休憩不足日数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.breakTimeStatus.insufficientBreakDays}日</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">休憩取得率</p>
                <p className="text-2xl font-bold">{formatPercent(companyComplianceReport.complianceReport.breakTimeStatus.breakComplianceRate)}</p>
              </div>
            </div>
            
            {/* 休憩不足ユーザー */}
            {companyComplianceReport.complianceReport.breakTimeStatus.insufficientBreakUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">休憩不足ユーザー</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務日数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">休憩不足日数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">休憩取得率</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyComplianceReport.complianceReport.breakTimeStatus.insufficientBreakUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.workingDays}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.insufficientBreakDays}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPercent(user.breakComplianceRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* 休日労働状況 */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-3">休日労働状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">休日労働日数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.holidayWorkStatus.totalHolidayWorkDays}日</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">休日労働時間</p>
                <p className="text-2xl font-bold">{formatHours(companyComplianceReport.complianceReport.holidayWorkStatus.totalHolidayWorkHours)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">休日出勤者数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.holidayWorkStatus.holidayWorkUsers}人</p>
                <p className="text-sm text-gray-500">
                  ({formatPercent(companyComplianceReport.complianceReport.holidayWorkStatus.holidayWorkRate)})
                </p>
              </div>
            </div>
            
            {/* 休日労働トップユーザー */}
            {companyComplianceReport.complianceReport.holidayWorkStatus.topHolidayWorkUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">休日労働トップユーザー</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">休日出勤日数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">休日労働時間</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyComplianceReport.complianceReport.holidayWorkStatus.topHolidayWorkUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.holidayWorkDays}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(user.holidayWorkHours)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* 深夜労働状況 */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-3">深夜労働状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">深夜労働日数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.nightWorkStatus.totalNightWorkDays}日</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">深夜労働時間</p>
                <p className="text-2xl font-bold">{formatHours(companyComplianceReport.complianceReport.nightWorkStatus.totalNightWorkHours)}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 mb-1">深夜勤務者数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.nightWorkStatus.nightWorkUsers}人</p>
                <p className="text-sm text-gray-500">
                  ({formatPercent(companyComplianceReport.complianceReport.nightWorkStatus.nightWorkRate)})
                </p>
              </div>
            </div>
            
            {/* 深夜労働トップユーザー */}
            {companyComplianceReport.complianceReport.nightWorkStatus.topNightWorkUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">深夜労働トップユーザー</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">深夜勤務日数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">深夜労働時間</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyComplianceReport.complianceReport.nightWorkStatus.topNightWorkUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.nightWorkDays}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(user.nightWorkHours)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* 有給休暇取得状況 */}
          <div className="mb-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-3">有給休暇取得状況</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">総有給休暇取得日数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.paidLeaveStatus.totalPaidLeaveDays}日</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">平均有給休暇取得日数</p>
                <p className="text-2xl font-bold">{companyComplianceReport.complianceReport.paidLeaveStatus.averagePaidLeaveDays.toFixed(1)}日</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">年5日取得達成率</p>
                <p className="text-2xl font-bold">{formatPercent(companyComplianceReport.complianceReport.paidLeaveStatus.targetAchievedRate)}</p>
                <p className="text-sm text-gray-500">
                  ({companyComplianceReport.complianceReport.paidLeaveStatus.targetAchievedUsers}人/{companyComplianceReport.companySummary.totalUsers}人)
                </p>
              </div>
            </div>
            
            {/* 有給休暇取得率の低いユーザー */}
            {companyComplianceReport.complianceReport.paidLeaveStatus.lowPaidLeaveUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">有給休暇取得率の低いユーザー</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有給休暇取得日数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目標日数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">残り必要日数</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyComplianceReport.complianceReport.paidLeaveStatus.lowPaidLeaveUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.paidLeaveDays}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.paidLeaveTarget}日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.remainingDays}日
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* コンプライアンス注意事項 */}
          <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2 text-yellow-800">コンプライアンス注意事項</h3>
            <ul className="list-disc pl-5 space-y-2 text-yellow-800">
              {companyComplianceReport.complianceReport.overtimeStatus.excessiveOvertimeCount > 0 && (
                <li>月45時間を超える残業が{companyComplianceReport.complianceReport.overtimeStatus.excessiveOvertimeCount}名に発生しています。労働基準法の上限規制に注意してください。</li>
              )}
              {companyComplianceReport.complianceReport.breakTimeStatus.insufficientBreakDays > 0 && (
                <li>法定休憩時間（8時間労働で1時間以上）が不足している可能性があります。適切な休憩時間の確保を徹底してください。</li>
              )}
              {companyComplianceReport.complianceReport.holidayWorkStatus.holidayWorkUsers > 0 && (
                <li>休日労働が発生しています。代休の付与や割増賃金の支払いなど、適切な対応を行ってください。</li>
              )}
              {companyComplianceReport.complianceReport.paidLeaveStatus.targetAchievedRate < 100 && (
                <li>年次有給休暇5日取得義務を達成していないユーザーがいます。計画的な有給休暇の取得を促進してください。</li>
              )}
            </ul>
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

export default CompanyComplianceReport;
