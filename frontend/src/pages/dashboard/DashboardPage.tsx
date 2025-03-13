// frontend/src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAttendanceStore } from '../../store/attendanceStore';
import { useLeaveStore } from '../../store/leaveStore';
import { AttendanceStatusCard } from '../../components/attendance';
import { AttendanceClockModal } from '../../components/attendance';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 勤怠状態カード */}
        <div>
          <h2 className="text-lg font-medium mb-4">今日の勤怠状態</h2>
          <AttendanceStatusCard
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        </div>
        
        {/* 休暇状況カード */}
        <div>
          <h2 className="text-lg font-medium mb-4">休暇状況</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">申請中の休暇</p>
                <p className="text-2xl font-bold">{pendingLeaves}件</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 mb-1">承認済みの休暇</p>
                <p className="text-2xl font-bold">{approvedLeaves}件</p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/leave"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                休暇申請一覧を見る →
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* クイックリンク */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">クイックリンク</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/attendance"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">勤怠管理</h3>
            <p className="text-gray-600">勤怠記録の確認や勤務時間サマリーを表示します</p>
          </a>
          <a
            href="/leave"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">休暇申請</h3>
            <p className="text-gray-600">休暇の申請や申請状況の確認ができます</p>
          </a>
          <a
            href="/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium mb-2">レポート</h3>
            <p className="text-gray-600">勤怠や休暇のレポートを確認できます</p>
          </a>
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
