// frontend/src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAttendanceStore } from '../../store/attendanceStore';
import { useLeaveStore } from '../../store/leaveStore';
import { AttendanceStatusCard } from '../../components/attendance';
import { AttendanceClockModal } from '../../components/attendance';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { todayStatus, fetchTodayStatus } = useAttendanceStore();
  const { requests, fetchRequests } = useLeaveStore();
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState<number>(0);
  const [approvedLeaves, setApprovedLeaves] = useState<number>(0);

  // コンポーネントマウント時に勤怠状態と休暇申請を取得
  useEffect(() => {
    fetchTodayStatus();
    
    // 休暇申請を取得
    fetchRequests().then(() => {
      // 申請中と承認済みの休暇数をカウント
      const pending = requests.filter(req => req.status === 'PENDING').length;
      const approved = requests.filter(req => req.status === 'APPROVED').length;
      setPendingLeaves(pending);
      setApprovedLeaves(approved);
    });
  }, [fetchTodayStatus, fetchRequests]);

  const handleClockIn = () => {
    setShowClockInModal(true);
  };

  const handleClockOut = () => {
    setShowClockOutModal(true);
  };

  const handleClockSuccess = () => {
    // モーダルを閉じた後に勤怠状態を更新
    fetchTodayStatus();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* 勤怠状態カード */}
        <div className="flex flex-col h-full">
          <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-4 text-gray-800">今日の勤怠状態</h2>
          <div className="flex-grow">
            <AttendanceStatusCard
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
            />
          </div>
        </div>
        
        {/* 休暇状況カード */}
        <div className="flex flex-col h-full">
          <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-4 text-gray-800">休暇状況</h2>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-yellow-600 mb-1">申請中の休暇</p>
                <p className="text-xl sm:text-2xl font-bold">{pendingLeaves}件</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-green-600 mb-1">承認済みの休暇</p>
                <p className="text-xl sm:text-2xl font-bold">{approvedLeaves}件</p>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Link
                to="/leave"
                className="text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
              >
                休暇申請一覧を見る
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* クイックリンク */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-4 text-gray-800">クイックリンク</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/attendance"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-900">勤怠管理</h3>
            <p className="text-sm text-gray-600 flex-grow">勤怠記録の確認や勤務時間サマリーを表示します</p>
            <div className="mt-2 text-blue-600 text-sm flex items-center">
              詳細を見る
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
          <Link
            to="/leave"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-900">休暇申請</h3>
            <p className="text-sm text-gray-600 flex-grow">休暇の申請や申請状況の確認ができます</p>
            <div className="mt-2 text-blue-600 text-sm flex items-center">
              詳細を見る
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
          <Link
            to="/reports"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-900">レポート</h3>
            <p className="text-sm text-gray-600 flex-grow">勤怠や休暇のレポートを確認できます</p>
            <div className="mt-2 text-blue-600 text-sm flex items-center">
              詳細を見る
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
      
      {/* 出勤打刻モーダル */}
      <AttendanceClockModal
        isOpen={showClockInModal}
        type="in"
        onClose={() => setShowClockInModal(false)}
        onSuccess={handleClockSuccess}
      />
      
      {/* 退勤打刻モーダル */}
      <AttendanceClockModal
        isOpen={showClockOutModal}
        type="out"
        onClose={() => setShowClockOutModal(false)}
        onSuccess={handleClockSuccess}
      />
    </div>
  );
};

export default DashboardPage;
