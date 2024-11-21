const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const StudentService = require("../data/student/service");
const InstructorService = require("../data/instructor/service");

function RecoverPassword() {
  const router = express();

  router.use(bodyParser.json({ limit: "10mb" }));
  router.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  // Função para gerar código de 4 dígitos
  function generateResetCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Função para encontrar usuário pelo email
  async function findUserByEmail(email) {
    // Tenta encontrar primeiro como instrutor
    const instructor = await InstructorService.findInstructorByEmail(email);
    if (instructor) {
      return { user: instructor, service: InstructorService, type: 'instructor' };
    }

    // Se não encontrar como instrutor, tenta como estudante
    const student = await StudentService.findStudentByEmail(email);
    if (student) {
      return { user: student, service: StudentService, type: 'student' };
    }

    return null;
  }

  router.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const userInfo = await findUserByEmail(email);

      if (!userInfo) {
        // Resposta vaga por segurança
        return res.status(200).json({ 
          message: "Se um usuário com este email existir, você receberá um email com instruções." 
        });
      }

      // Gera código de 4 dígitos
      const resetCode = generateResetCode();

      // Atualiza o código de reset no usuário
      userInfo.user.passwordResetToken = resetCode;
      userInfo.user.passwordResetExpires = Date.now() + 3600000; // 1 hora
      await userInfo.user.save();

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: userInfo.user.email,
        subject: "Recuperação de Senha - Karate Dojo",
        text: `Você solicitou a recuperação de senha. Use o código a seguir para alterar sua senha: ${resetCode}\n\nEste código expira em 1 hora.`,
        html: `
          <h2>Recuperação de Senha</h2>
          <p>Você solicitou a recuperação de senha.</p>
          <p>Use o código a seguir para alterar sua senha:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${resetCode}</p>
          <p>Este código expira em 1 hora.</p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ 
        message: "Se um usuário com este email existir, você receberá um email com instruções." 
      });
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  router.post("/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ 
          error: "Email, código e nova senha são obrigatórios" 
        });
      }

      const userInfo = await findUserByEmail(email);

      if (!userInfo || 
          userInfo.user.passwordResetToken !== code || 
          userInfo.user.passwordResetExpires < Date.now()) {
        return res.status(400).json({ 
          error: "Código inválido ou expirado" 
        });
      }

      // Atualiza a senha usando o serviço apropriado
      const hashPassword = await userInfo.service.createPassword(newPassword);
      userInfo.user.password = hashPassword;
      userInfo.user.passwordResetToken = undefined;
      userInfo.user.passwordResetExpires = undefined;
      await userInfo.user.save();

      res.status(200).json({ 
        message: "Senha alterada com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  return router;
}

module.exports = RecoverPassword;
