import React, { useEffect, useState } from 'react';
import { useAttendanceStore, AttendanceRecord } from '../../store/attendanceStore';

interface AttendanceRecordListProps {
  limit?: number;
}

const AttendanceRecordList: React.FC<AttendanceRecordListProps> = ({ limit = 10 }) => {
  const { records, isLoading, error, fetchRecords } = useAttendanceStore();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // コンポーネントマウント時に勤怠記録を取得
  useEffect(() => {
    // デフォルトでは今月の記録を表示
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const formattedFirstDay = firstDayOfMonth.toISOString().split('T')[0];
    const formattedLastDay = lastDayOfMonth.toISOString().split('T')[0];
    
    setStartDate(formattedFirstDay);
    setEndDate(formattedLastDay);
    
    fetchRecords({
      startDate: formattedFirstDay,
      endDate: formattedLastDay,
      page: currentPage,
      limit,
    });
  }, [fetchRecords, currentPage, limit]);

  // 日付フィルター適用
  const handleFilterApply = () => {
    if (startDate && endDate) {
      setCurrentPage(1);
      fetchRecords({
        startDate,
        endDate,
        page: 1,
        limit,
      });
    }
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  // 勤務時間計算関数
  const calculateWorkingHours = (record: AttendanceRecord) => {
    if (!record.clockInTime || !record.clockOutTime) return '--:--';
    
    const clockIn = new Date(record.clockInTime);
    const clockOut = new Date(record.clockOutTime);
    const diffMs = clockOut.getTime() - clockIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}時間${diffMinutes}分`;
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">勤怠記録</h2>
      
      {/* フィルター */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label htmlFor="startDate" className="text-sm text-gray-600 mb-1">開始日</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="endDate" className="text-sm text-gray-600 mb-1">終了日</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFilterApply}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            適用
          </button>
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">
          <p>勤怠記録の取得中にエラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* 勤怠記録テーブル */}
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出勤時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退勤時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務場所</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(record.clockInTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(record.clockOutTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{calculateWorkingHours(record)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.location || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          該当する勤怠記録がありません
        </div>
      )}
      
      {/* ページネーション */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className={`px-4 py-2 rounded ${
            currentPage === 1 || isLoading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          前へ
        </button>
        <span className="text-sm text-gray-600">ページ {currentPage}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={records.length < limit || isLoading}
          className={`px-4 py-2 rounded ${
            records.length < limit || isLoading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default AttendanceRecordList;
