const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const config = require("../config");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const bcryptjs = require("bcryptjs");

function RecoverPassword() {
  const router = express();

  router.use(bodyParser.json({ limit: "10mb" }));
  router.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  router.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const user = await User.findOne({ email });

      if (!user) {
        // Resposta vaga por segurança
        return res.status(200).json({ 
          message: "Se um usuário com este email existir, você receberá um email com instruções." 
        });
      }

      const token = jwt.sign(
        { email: user.email }, 
        config.secret,
        { expiresIn: "1h" }
      );

      // Atualiza o token de reset no usuário
      user.passwordResetToken = token;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hora
      await user.save();

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
        to: user.email,
        subject: "Recuperação de Senha - Karate Dojo",
        text: `Você solicitou a recuperação de senha. Use o token a seguir para alterar sua senha: ${token}\n\nEste token expira em 1 hora.`,
        html: `
          <h2>Recuperação de Senha</h2>
          <p>Você solicitou a recuperação de senha.</p>
          <p>Use o token a seguir para alterar sua senha:</p>
          <p><strong>${token}</strong></p>
          <p>Este token expira em 1 hora.</p>
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
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ 
          error: "Token e nova senha são obrigatórios" 
        });
      }

      // Verifica o token e sua expiração
      const decoded = jwt.verify(token, config.secret);
      const user = await User.findOne({
        email: decoded.email,
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ 
          error: "Token inválido ou expirado" 
        });
      }

      // Valida a força da senha
      if (newPassword.length < 8) {
        return res.status(400).json({ 
          error: "A senha deve ter pelo menos 8 caracteres" 
        });
      }

      // Hash da nova senha
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);

      // Atualiza a senha e limpa os campos de reset
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.status(200).json({ 
        message: "Senha alterada com sucesso" 
      });
    } catch (error) {
      console.error("Erro na redefinição de senha:", error);
      if (error.name === "JsonWebTokenError") {
        return res.status(400).json({ error: "Token inválido" });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  return router;
}

module.exports = RecoverPassword;
