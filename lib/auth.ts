import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const AUTH_COOKIE = 'authorization';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET obrigatorio em producao.');
  }
  return secret || 'dev-secret-change-me';
}

export async function autenticarUsuario(): Promise<bigint> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    throw Object.assign(new Error('Nao autenticado.'), { status: 401 });
  }

  const payload = jwt.verify(token, getJwtSecret()) as { id: number };
  return BigInt(payload.id);
}

export function toHttpError(err: unknown): { status: number; message: string } {
  const e = err as { status?: number; name?: string; message?: string };
  const status = e?.status ?? (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError' ? 401 : 500);
  const message = e?.message ?? String(e) ?? 'Erro desconhecido';
  return { status, message };
}
