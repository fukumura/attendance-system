import { useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore, Company } from '../../store/authStore';
import { companyApi } from '../../services/companyApi';

interface RegisterFormProps {
  onSuccess?: () => void;
  isAdminForm?: boolean;
}

const RegisterForm = ({ onSuccess, isAdminForm = false }: RegisterFormProps) => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const currentCompany = useAuthStore((state) => state.company);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const [passwordError, setPasswordError] = useState('');
  const { handleRegister, isSubmitting } = useAuth();
  const error = useAuthStore((state) => state.error);
  
  // 企業一覧を取得（スーパー管理者の場合のみ）
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isSuperAdmin) return;
      
      setIsLoadingCompanies(true);
      try {
        const response = await companyApi.getCompanies();
        if (response.status === 'success') {
          // APIから返されるデータ形式に合わせて変換
          setCompanies(response.data);
        }
      } catch (error) {
        console.error('企業一覧の取得に失敗しました:', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    
    fetchCompanies();
  }, [isSuperAdmin]);
  
  // 管理者の場合は自分の企業IDを設定
  useEffect(() => {
    if (isAdmin && currentCompany) {
      setCompanyId(currentCompany.publicId);
    }
  }, [isAdmin, currentCompany]);
  
  // URLパラメータから企業IDを取得
  useEffect(() => {
    const companyIdParam = searchParams.get('companyId');
    if (companyIdParam) {
      setCompanyId(companyIdParam);
    }
  }, [searchParams]);

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
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setPasswordError('パスワードは大文字、小文字、数字を含む必要があります');
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
    
    const success = await handleRegister(email, password, name, companyId, isAdminForm);
    
    if (success && onSuccess) {
      onSuccess();
      // 管理者フォームの場合はフォームをリセット
      if (isAdminForm) {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setCompanyId('');
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
          <p className="text-gray-600 text-xs italic mt-1">
            8文字以上で、大文字、小文字、数字を含めてください
          </p>
        </div>

        <div className="mb-4">
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

        {/* 企業選択フィールド - スーパー管理者の場合はプルダウン、管理者の場合は自分の企業を表示 */}
        <div className="mb-6">
          <label htmlFor="companyId" className="block text-gray-700 text-sm font-bold mb-2">
            所属企業
          </label>
          {isSuperAdmin ? (
            // スーパー管理者の場合は企業一覧のプルダウン
            <div className="relative">
              <select
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={isLoadingCompanies}
              >
                <option value="">企業を選択してください</option>
                {companies.map((company) => (
                  <option key={company.publicId} value={company.publicId}>
                    {company.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          ) : isAdmin && currentCompany ? (
            // 管理者の場合は自分の企業を表示（編集不可）
            <div className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100">
              {currentCompany.name}
              <input type="hidden" id="companyId" value={companyId} />
            </div>
          ) : (
            // 一般ユーザーまたはログインしていない場合は非表示
            <div className="text-gray-500 italic">
              企業情報は管理者によって設定されます
            </div>
          )}
          <p className="text-gray-600 text-xs italic mt-1">
            {isSuperAdmin ? '所属企業を選択してください' : ''}
          </p>
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
