// utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmail(to, subject, text) {
  try {
    // Configuração do transportador de e-mail usando variáveis do .env
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Detalhes do e-mail
    let mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      text: text,
    };

    // Envia o e-mail
    await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error.message);
    throw error;
  }
}

module.exports = sendEmail;
