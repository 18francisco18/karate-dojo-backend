// utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail(to, subject, text) {
  try {
    // Configuração do transportador de e-mail usando SMTP (ajuste de acordo com o seu provedor)
    let transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "16273252cae631",
        pass: "1b4171bcd26880",
      },
    });

    // Detalhes do e-mail
    let mailOptions = {
      from: "cobrakaisupport@gmail.com", // De quem está enviando
      to: to, // Destinatário
      subject: subject, // Assunto do e-mail
      text: text, // Conteúdo do e-mail
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
