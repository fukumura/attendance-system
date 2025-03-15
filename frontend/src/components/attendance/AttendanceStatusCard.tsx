import React, { useEffect } from 'react';
import { useAttendanceStore } from '../../store/attendanceStore';

interface AttendanceStatusCardProps {
  onClockIn: () => void;
  onClockOut: () => void;
}

const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({ onClockIn, onClockOut }) => {
  const { todayStatus, isLoading, error, fetchTodayStatus } = useAttendanceStore();

  // コンポーネントマウント時に今日の勤怠状態を取得
  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  // 日付フォーマット関数
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  // 勤務時間計算関数
  const calculateWorkingHours = () => {
    if (!todayStatus?.record?.clockInTime || !todayStatus?.record?.clockOutTime) return '--:--';
    
    const clockIn = new Date(todayStatus.record.clockInTime);
    const clockOut = new Date(todayStatus.record.clockOutTime);
    const diffMs = clockOut.getTime() - clockIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}時間${diffMinutes}分`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 animate-pulse h-full">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-3 sm:mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4"></div>
        <div className="h-9 sm:h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 h-full">
        <div className="text-red-500 mb-3 sm:mb-4">
          <p className="text-sm sm:text-base">勤怠状態の取得中にエラーが発生しました</p>
          <p className="text-xs sm:text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchTodayStatus()}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 h-full flex flex-col">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">今日の勤怠状態</h2>
      
      <div className="mb-4 flex-grow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 pb-2 border-b border-gray-100">
          <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">出勤時間:</span>
          <span className="text-base sm:text-lg font-medium text-gray-900">
            {todayStatus?.isClockedIn 
              ? formatTime(todayStatus.record?.clockInTime) 
              : '--:--'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 pb-2 border-b border-gray-100">
          <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">退勤時間:</span>
          <span className="text-base sm:text-lg font-medium text-gray-900">
            {todayStatus?.isClockedOut 
              ? formatTime(todayStatus.record?.clockOutTime) 
              : '--:--'}
          </span>
        </div>
        {todayStatus?.isClockedOut && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 pb-2 border-b border-gray-100">
            <span className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-0">勤務時間:</span>
            <span className="text-base sm:text-lg font-medium text-gray-900">{calculateWorkingHours()}</span>
          </div>
        )}
      </div>
      
      {!todayStatus?.isClockedIn ? (
        <button
          onClick={onClockIn}
          className="w-full py-2 sm:py-3 px-4 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          出勤打刻
        </button>
      ) : !todayStatus?.isClockedOut ? (
        <button
          onClick={onClockOut}
          className="w-full py-2 sm:py-3 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          退勤打刻
        </button>
      ) : (
        <div className="w-full py-2 sm:py-3 px-4 bg-gray-100 text-gray-600 rounded text-center text-sm sm:text-base">
          本日の勤務は終了しました
        </div>
      )}
      
      {(todayStatus?.record?.location || todayStatus?.record?.notes) && (
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-md">
          {todayStatus?.record?.location && (
            <div className="flex items-start">
              <span className="text-xs sm:text-sm text-gray-500 font-medium mr-2">勤務場所:</span>
              <span className="text-xs sm:text-sm text-gray-700">{todayStatus.record.location}</span>
            </div>
          )}
          {todayStatus?.record?.notes && (
            <div className="flex items-start mt-1">
              <span className="text-xs sm:text-sm text-gray-500 font-medium mr-2">備考:</span>
              <span className="text-xs sm:text-sm text-gray-700">{todayStatus.record.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceStatusCard;
