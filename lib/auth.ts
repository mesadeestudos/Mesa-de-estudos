import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export async function autenticarUsuario(): Promise<bigint> {
  const cookieStore = await cookies();
  const token = cookieStore.get('authorization')?.value;

  if (!token) {
    throw Object.assign(new Error('Nao autenticado.'), { status: 401 });
  }

  const payload = jwt.verify(token, SECRET) as { id: number };
  return BigInt(payload.id);
}

export function toHttpError(err: unknown): { status: number; message: string } {
  const e = err as { status?: number; name?: string; message?: string };
  const status = e?.status ?? (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError' ? 401 : 500);
  const message = e?.message ?? String(e) ?? 'Erro desconhecido';
  return { status, message };
}
