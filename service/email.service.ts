import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await transporter.sendMail({
      from: `"Mesa de Estudos" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })

    console.log("📨 EMAIL ENVIADO:", response.messageId)
  } catch (error) {
    console.error("❌ ERRO AO ENVIAR EMAIL:", error)
    throw new Error("Erro ao enviar email")
  }
}
