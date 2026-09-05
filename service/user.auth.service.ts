import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/auth';
import { sendEmail } from '@/service/email.service';
import { LoginDTO } from '@/dto/login.dto';
import { CadastroDTO } from '@/dto/cadastro.dto';
import { RequestResetDTO, ResetPasswordDTO } from '@/dto/reset.dto';
import { requestResetSchema, resetPasswordSchema } from '@/schema/reset.schema';
import {
  findUserByEmail,
  createUser,
  createSession,
  saveResetToken,
  findByToken,
  updatePassword,
} from '@/repository/user.repository';

const SESSION_TTL_SECONDS = 60 * 60 * 8;

type AuthUser = NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>;

function createToken(user: AuthUser) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome,
      primeiro_acesso: user.primeiroAcesso,
    },
    getJwtSecret(),
    { expiresIn: SESSION_TTL_SECONDS },
  );
}

export async function cadastroService(body: CadastroDTO) {
  const userExistente = await findUserByEmail(body.email);
  if (userExistente) {
    throw new Error('Usuario ja cadastrado');
  }

  const senhaHash = await bcrypt.hash(body.senha, 10);
  return createUser({
    nome: body.nome,
    email: body.email,
    senha: senhaHash,
  });
}

export async function loginService(body: LoginDTO) {
  const user = await findUserByEmail(body.email);
  if (!user || !user.senha) {
    throw new Error('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
  }

  const senhaValida = await bcrypt.compare(body.senha, user.senha);
  if (!senhaValida) {
    throw new Error('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
  }

  const token = createToken(user);
  await createSession({
    id_usuario: Number(user.id),
    refresh_token: token,
    expira_em: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });

  return {
    idUsuario: user.id,
    token,
    primeiroAcesso: user.primeiroAcesso,
    expiresIn: SESSION_TTL_SECONDS,
  };
}

export async function requestResetService(data: RequestResetDTO) {
  const parsed = requestResetSchema.parse(data);
  const user = await findUserByEmail(parsed.email);

  if (!user) {
    return true;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expire = new Date(Date.now() + 1000 * 60 * 15);
  await saveResetToken(parsed.email, token, expire);

  const link = `${process.env.APP_URL || 'http://localhost:3000'}/redefinir?token=${token}`;
  await sendEmail(
    parsed.email,
    'Recuperacao de senha',
    `
    <h2>Recuperacao de senha</h2>
    <p>Ola!</p>
    <p>Clique no link abaixo para redefinir sua senha da plataforma Mesa de Estudos:</p>
    <a href="${link}">${link}</a>
    <p>Esse link expira em 15 minutos.</p>
    `,
  );

  return true;
}

export async function resetPasswordService(data: ResetPasswordDTO) {
  const parsed = resetPasswordSchema.parse(data);
  const user = await findByToken(parsed.token);

  if (!user) {
    throw new Error('Token invalido ou expirado');
  }

  const senhaHash = await bcrypt.hash(parsed.senha, 10);
  await updatePassword(user.id, senhaHash);
  return true;
}
