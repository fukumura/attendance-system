import { z } from 'zod';

// 一般的なパスワードのリスト（小規模な例）
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', 'qwerty', 'admin', 'welcome',
  'letmein', 'monkey', 'abc123', '111111', '12345678', 'dragon',
  'baseball', 'football', 'soccer', 'hockey', 'master', 'sunshine',
  'iloveyou', 'trustno1', 'princess', 'admin123', 'welcome123', 'login',
  'admin1234', 'access', 'flower', 'passw0rd', 'shadow', 'superman',
  'hello123', 'charlie', 'michael', 'michelle', 'jennifer', 'daniel',
  'maggie', 'qwerty123', 'hunter', 'buster', 'soccer123', 'football123',
  'liverpool', 'barcelona', 'pokemon', 'starwars'
];

/**
 * 一般的なパスワードかどうかをチェックする
 * @param password チェックするパスワード
 * @returns 一般的なパスワードの場合はtrue、そうでない場合はfalse
 */
export const isCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
};

/**
 * パスワードの強度をチェックする
 * @param password チェックするパスワード
 * @returns 0-5の強度スコア
 */
export const checkPasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return strength;
};

/**
 * 強化されたパスワードバリデーションスキーマ
 */
export const passwordSchema = z.string()
  .min(8, 'パスワードは8文字以上である必要があります')
  .regex(/[A-Z]/, 'パスワードには少なくとも1つの大文字を含める必要があります')
  .regex(/[a-z]/, 'パスワードには少なくとも1つの小文字を含める必要があります')
  .regex(/[0-9]/, 'パスワードには少なくとも1つの数字を含める必要があります')
  .regex(/[^A-Za-z0-9]/, 'パスワードには少なくとも1つの特殊文字を含める必要があります')
  .refine(password => !isCommonPassword(password), {
    message: 'このパスワードは一般的すぎるため使用できません。より安全なパスワードを選択してください。'
  });
