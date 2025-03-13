import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  AttendanceStatusCard,
  AttendanceRecordList,
  AttendanceClockModal,
  AttendanceSummary,
} from '../../components/attendance';

const AttendancePage: React.FC = () => {
  const { user } = useAuthStore();
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'records' | 'summary'>('status');

  const handleClockIn = () => {
    setShowClockInModal(true);
  };

  const handleClockOut = () => {
    setShowClockOutModal(true);
  };

  const handleClockSuccess = () => {
    // モーダルを閉じた後に勤怠状態を更新するためのコールバック
    // 特に何もしなくても、AttendanceStatusCardコンポーネント内で
    // 状態が更新されるため、ここでは空の関数としています
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">勤怠管理</h1>
      
      {/* タブナビゲーション */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'status'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('status')}
        >
          勤怠状態
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'records'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('records')}
        >
          勤怠記録
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          勤務時間サマリー
        </button>
      </div>
      
      {/* タブコンテンツ */}
      <div className="mb-8">
        {activeTab === 'status' && (
          <div className="max-w-md mx-auto">
            <AttendanceStatusCard
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
            />
          </div>
        )}
        
        {activeTab === 'records' && (
          <AttendanceRecordList />
        )}
        
        {activeTab === 'summary' && (
          <AttendanceSummary userId={user?.id} />
        )}
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

export default AttendancePage;
