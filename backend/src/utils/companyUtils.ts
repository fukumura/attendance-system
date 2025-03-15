import crypto from 'crypto';

/**
 * 企業の公開ID（ハッシュ値）を生成する
 * 
 * @param companyId 企業の内部ID
 * @returns ハッシュ化された公開ID（8文字の大文字英数字）
 */
export const generatePublicCompanyId = (companyId: string): string => {
  // 内部IDとシークレットを組み合わせてハッシュ化
  const secret = process.env.COMPANY_ID_SECRET || 'company-id-secret';
  const hash = crypto.createHmac('sha256', secret)
    .update(companyId)
    .digest('hex');
  
  // 先頭8文字を使用して大文字に変換
  return hash.substring(0, 8).toUpperCase();
};

/**
 * 公開IDから企業の内部IDを検索する
 * 
 * 注意: この関数は実際のデータベース検索を行うため、
 * Prismaクライアントを引数として受け取る必要があります。
 * 
 * @param prisma Prismaクライアントインスタンス
 * @param publicId 公開企業ID
 * @returns 企業の内部ID（見つからない場合はnull）
 */
export const findCompanyIdByPublicId = async (prisma: any, publicId: string): Promise<string | null> => {
  const company = await (prisma as any).company.findUnique({
    where: { publicId },
    select: { id: true }
  });
  
  return company ? company.id : null;
};
