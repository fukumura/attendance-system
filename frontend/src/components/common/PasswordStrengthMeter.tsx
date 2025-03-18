import React, { useEffect, useState } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // パスワード強度を計算
    let currentStrength = 0;
    
    if (password.length >= 8) currentStrength += 1;
    if (/[A-Z]/.test(password)) currentStrength += 1;
    if (/[a-z]/.test(password)) currentStrength += 1;
    if (/[0-9]/.test(password)) currentStrength += 1;
    if (/[^A-Za-z0-9]/.test(password)) currentStrength += 1;
    
    setStrength(currentStrength);
    
    // フィードバックメッセージ
    if (currentStrength === 0) {
      setFeedback('');
    } else if (currentStrength <= 2) {
      setFeedback('弱いパスワード');
    } else if (currentStrength <= 4) {
      setFeedback('まあまあのパスワード');
    } else {
      setFeedback('強力なパスワード');
    }
  }, [password]);

  // 強度に応じた色を設定
  const getColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (strength <= 2) return 'text-red-500';
    if (strength <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div 
          className={`h-full rounded-full ${getColor()}`} 
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
      <p className={`text-xs mt-1 ${getTextColor()}`}>
        {feedback}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
