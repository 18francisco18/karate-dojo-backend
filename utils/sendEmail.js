// utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmail(to, subject, text) {
  try {
    console.log('Configurando transportador de email com:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true"
    });

    // Configuração do transportador de e-mail usando variáveis do .env
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: process.env.EMAIL_PORT || 2525,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verifica se o transportador está funcionando
    await transporter.verify();
    console.log('Conexão com servidor de email estabelecida');

    // Detalhes do e-mail
    let mailOptions = {
      from: process.env.EMAIL_FROM || '"Karate Dojo" <noreply@karatedojo.com>',
      to: to,
      subject: subject,
      text: text,
    };

    console.log('Tentando enviar email com as opções:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      from: mailOptions.from
    });

    // Envia o e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro detalhado ao enviar email:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
}

// Exemplo de uso:
// sendEmail(
//   'luismaga14@hotmail.com',
//   'Aviso de Mensalidade Atrasada',
//   'Prezado(a) Luis,\n\nSua mensalidade com vencimento em 01/01/2025 está atrasada.\nValor: R$ 50\n\nPor favor, regularize o pagamento o mais breve possível para evitar a suspensão dos serviços.\n\nAtenciosamente,\nEquipe do Dojo'
// );

module.exports = sendEmail;
