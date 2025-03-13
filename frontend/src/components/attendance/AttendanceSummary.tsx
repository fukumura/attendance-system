import React, { useEffect, useState } from 'react';
import { useAttendanceStore } from '../../store/attendanceStore';

interface AttendanceSummaryProps {
  userId?: string;
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ userId }) => {
  const { summary, isLoading, error, fetchSummary } = useAttendanceStore();
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  
  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (period === 'week') {
      // 今週の開始日（日曜日）と終了日（土曜日）を計算
      const day = today.getDay(); // 0: 日曜日, 1: 月曜日, ...
      startDate = new Date(today);
      startDate.setDate(today.getDate() - day);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      // 今月の開始日と終了日を計算
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    fetchSummary({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    });
  }, [fetchSummary, period]);

  if (isLoading && !summary) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded col-span-1"></div>
            <div className="h-4 bg-gray-200 rounded col-span-1"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded col-span-1"></div>
            <div className="h-4 bg-gray-200 rounded col-span-1"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded col-span-1"></div>
            <div className="h-4 bg-gray-200 rounded col-span-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">勤務時間サマリー</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded text-sm ${
              period === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            今週
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded text-sm ${
              period === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            今月
          </button>
        </div>
      </div>
      
      {error ? (
        <div className="text-red-500 mb-4">
          <p>勤務時間サマリーの取得中にエラーが発生しました</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              const today = new Date();
              let startDate: Date;
              let endDate: Date;
              
              if (period === 'week') {
                const day = today.getDay();
                startDate = new Date(today);
                startDate.setDate(today.getDate() - day);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
              } else {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              }
              
              const formattedStartDate = startDate.toISOString().split('T')[0];
              const formattedEndDate = endDate.toISOString().split('T')[0];
              
              fetchSummary({
                startDate: formattedStartDate,
                endDate: formattedEndDate,
              });
            }}
            className="mt-2 text-blue-500 hover:underline"
          >
            再読み込み
          </button>
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">総勤務日数</p>
              <p className="text-2xl font-bold">{summary.totalWorkingDays}日</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">総勤務時間</p>
              <p className="text-2xl font-bold">{summary.totalWorkingHours.toFixed(1)}時間</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">平均勤務時間</p>
              <p className="text-2xl font-bold">{summary.averageWorkingHours.toFixed(1)}時間/日</p>
            </div>
          </div>
          
          {summary.dailyWorkingHours.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">日別勤務時間</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務時間</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.dailyWorkingHours.map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.hours.toFixed(1)}時間
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          勤務時間データがありません
        </div>
      )}
    </div>
  );
};

export default AttendanceSummary;
