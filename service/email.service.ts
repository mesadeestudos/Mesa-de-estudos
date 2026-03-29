// ========================
// IMPORTS
// ========================

// SDK oficial do Resend
import { Resend } from "resend"


// ========================
// CONFIGURAÇÃO DO CLIENTE
// ========================

// Cria instância do Resend usando a API KEY do .env
// Essa chave autentica sua aplicação para enviar emails
const resend = new Resend(process.env.RESEND_API_KEY)


// ========================
// FUNÇÃO PARA ENVIAR EMAIL
// ========================
export async function sendEmail(
  to: string,       // destinatário
  subject: string,  // assunto do email
  html: string      // conteúdo HTML do email
) {

  try {

    // Envia o email usando a API do Resend
    const response = await resend.emails.send({

      // Remetente (email que aparece para o usuário)
      // IMPORTANTE: em ambiente inicial use esse padrão
      // depois você pode configurar domínio próprio
      from: "onboarding@resend.dev",

      // Email do destinatário
      to,

      // Assunto do email
      subject,

      // Corpo do email em HTML
      html
    })

    // Log para debug (verifica se envio deu certo)
    console.log("📨 EMAIL ENVIADO:", response)

  } catch (error) {

    // Log de erro para debug
    console.error("❌ ERRO AO ENVIAR EMAIL:", error)

    // Lança erro para o service tratar
    throw new Error("Erro ao enviar email")
  }
}