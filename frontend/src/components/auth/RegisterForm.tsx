import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import PasswordStrengthMeter from '../common/PasswordStrengthMeter';

interface RegisterFormProps {
  onSuccess?: () => void;
  isAdminForm?: boolean;
}

const RegisterForm = ({ onSuccess, isAdminForm = false }: RegisterFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { handleRegister, isSubmitting } = useAuth();
  const error = useAuthStore((state) => state.error);

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError('パスワードは8文字以上である必要があります');
      return false;
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    if (!hasUppercase) {
      setPasswordError('パスワードには少なくとも1つの大文字を含める必要があります');
      return false;
    }
    
    if (!hasLowercase) {
      setPasswordError('パスワードには少なくとも1つの小文字を含める必要があります');
      return false;
    }
    
    if (!hasNumber) {
      setPasswordError('パスワードには少なくとも1つの数字を含める必要があります');
      return false;
    }
    
    if (!hasSpecial) {
      setPasswordError('パスワードには少なくとも1つの特殊文字を含める必要があります');
      return false;
    }
    
    // 一般的なパスワードのチェックはフロントエンドでは簡易的に行う
    const commonPasswords = ['password', 'password123', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      setPasswordError('このパスワードは一般的すぎるため使用できません');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    const success = await handleRegister(email, password, name, isAdminForm);
    
    if (success && onSuccess) {
      onSuccess();
      // 管理者フォームの場合はフォームをリセット
      if (isAdminForm) {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    }
  };

  return (
    <div className={`bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 ${!isAdminForm ? 'max-w-md w-full' : 'w-full'}`}>
      {!isAdminForm && (
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">アカウント登録</h1>
          <p className="text-gray-600 text-sm">
            新しいアカウントを作成して、勤怠の管理をしましょう
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            名前
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            placeholder="山田 太郎"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            placeholder="email@example.com"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            placeholder="********"
          />
          <PasswordStrengthMeter password={password} />
          <div className="mt-2 text-xs text-gray-500">
            <p>パスワードは以下の条件を満たす必要があります：</p>
            <ul className="list-disc pl-5 mt-1">
              <li>8文字以上</li>
              <li>大文字を1文字以上</li>
              <li>小文字を1文字以上</li>
              <li>数字を1文字以上</li>
              <li>特殊文字を1文字以上</li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
            パスワード（確認用）
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            placeholder="********"
          />
          {passwordError && (
            <p className="text-red-500 text-xs italic mt-1">{passwordError}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isSubmitting ? '登録中...' : 'アカウント登録'}
          </button>
        </div>
      </form>

      {!isAdminForm && (
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-700 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
