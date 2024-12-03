const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const StudentService = require("../data/student/service");
const InstructorService = require("../data/instructor/service");
const bcrypt = require("bcrypt");
const ResetPasswordService = require("../data/resetPassword/service");

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
      console.log("Forgot Password Request Received:", req.body);
      
      const { email } = req.body;
      
      if (!email) {
        console.error("Validation Error: Email is required");
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      console.log("Searching for user with email:", email);
      const userInfo = await findUserByEmail(email);

      if (!userInfo) {
        console.warn("No user found with email:", email);
        // Resposta vaga por segurança
        return res.status(200).json({ 
          message: "Se um usuário com este email existir, você receberá um email com instruções." 
        });
      }

      console.log("User found:", userInfo.type);

      // Gerar código de recuperação
      const resetCode = generateResetCode();
      console.log("Generated reset code:", resetCode);

      // Criar solicitação de redefinição de senha
      console.log("Creating reset request for email:", email);
      await ResetPasswordService.createResetRequest(email, resetCode);

      // Configurar transporte de email
      console.log("Configuring email transporter");
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Configurar email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Recuperação de Senha - Karate Dojo',
        text: `Recuperação de Senha\n\nVocê solicitou a recuperação de senha.\n\nUse o código a seguir para alterar sua senha:\n\n${resetCode}\n\nEste código expira em 1 hora.\n\nSe você não solicitou esta recuperação, ignore este email.`
      };

      // Enviar email
      console.log("Sending recovery email to:", email);
      await transporter.sendMail(mailOptions);

      console.log("Password recovery process completed successfully");
      return res.status(200).json({ 
        message: "Email de recuperação enviado com sucesso." 
      });

    } catch (error) {
      console.error("CRITICAL ERROR in forgot-password route:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        requestBody: req.body
      });
      return res.status(500).json({ 
        error: "Erro interno do servidor",
        details: error.message,
        name: error.name
      });
    }
  });

  // Rota para redefinir a senha com código de recuperação
  router.post("/reset-password", async (req, res) => {
    try {
      console.log("Reset Password Request Received:", req.body);
      
      const { email, resetCode, newPassword } = req.body;
      
      if (!email || !resetCode || !newPassword) {
        console.error("Validation Error: Missing required fields", { email, resetCode, newPassword });
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      console.log("Searching for user with email:", email);
      const userInfo = await findUserByEmail(email);

      if (!userInfo) {
        console.error("User not found for email:", email);
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      console.log("User found:", userInfo.user._id);

      console.log("Checking reset request for:", { email, resetCode });
      const resetRequest = await ResetPasswordService.findValidResetRequest(
        email, 
        resetCode
      );

      if (!resetRequest) {
        console.error("Invalid or expired reset request:", { email, resetCode });
        return res.status(400).json({ 
          error: "Código de recuperação inválido ou expirado" 
        });
      }

      console.log("Reset request found, hashing password");
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      console.log("Updating password for user:", userInfo.user._id);
      const updatedUser = await userInfo.service.updatePassword(
        userInfo.user._id, 
        hashedPassword
      );

      console.log("Invalidating reset request");
      await ResetPasswordService.invalidateResetRequest(email, resetCode);

      return res.status(200).json({ 
        message: "Senha redefinida com sucesso",
        userId: updatedUser._id
      });

    } catch (error) {
      console.error("CRITICAL ERROR in reset-password route:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        requestBody: req.body
      });

      return res.status(500).json({ 
        error: "Erro interno do servidor",
        details: error.message,
        name: error.name
      });
    }
  });

  return router;
}

module.exports = RecoverPassword;
