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
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 mb-4">
          <p>勤怠状態の取得中にエラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchTodayStatus()}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">今日の勤怠状態</h2>
      
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">出勤時間:</span>
          <span className="font-medium">
            {todayStatus?.isClockedIn 
              ? formatTime(todayStatus.record?.clockInTime) 
              : '--:--'}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">退勤時間:</span>
          <span className="font-medium">
            {todayStatus?.isClockedOut 
              ? formatTime(todayStatus.record?.clockOutTime) 
              : '--:--'}
          </span>
        </div>
        {todayStatus?.isClockedOut && (
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">勤務時間:</span>
            <span className="font-medium">{calculateWorkingHours()}</span>
          </div>
        )}
      </div>
      
      {!todayStatus?.isClockedIn ? (
        <button
          onClick={onClockIn}
          className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          出勤打刻
        </button>
      ) : !todayStatus?.isClockedOut ? (
        <button
          onClick={onClockOut}
          className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          退勤打刻
        </button>
      ) : (
        <div className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded text-center">
          本日の勤務は終了しました
        </div>
      )}
      
      {todayStatus?.record?.location && (
        <div className="mt-4 text-sm text-gray-500">
          勤務場所: {todayStatus.record.location}
        </div>
      )}
      {todayStatus?.record?.notes && (
        <div className="mt-2 text-sm text-gray-500">
          備考: {todayStatus.record.notes}
        </div>
      )}
    </div>
  );
};

export default AttendanceStatusCard;
