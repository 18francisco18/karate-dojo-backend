const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const VerifyToken = require("../middleware/token");
const InstructorService = require("../data/instructor/service"); // Ajuste o caminho conforme necessário

const AuthInstructorRouter = () => {
  const router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para criar um novo instrutor
  router.post("/register", async (req, res) => {
    try {
      const newInstructor = await InstructorService.createInstructor(req.body);
      res.status(201).json(newInstructor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para autenticação de instrutor (login)
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    try {
      const instructor = await InstructorService.findInstructorByEmail(email);
      if (!instructor) {
        return res.status(404).json({ error: "Instrutor não encontrado" });
      }

      const isMatch = await InstructorService.comparePassword(
        password,
        instructor.password
      );
      if (!isMatch) {
        return res.status(401).json({ error: "Senha incorreta" });
      }

      const token = InstructorService.createToken(instructor);
      res.status(200).json({ auth: true, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar todos os instrutores (rota protegida)
  router.get("/instructors", VerifyToken, async (req, res) => {
    try {
      const instructors = await InstructorService.findAllInstructors();
      res.status(200).json(instructors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar um instrutor pelo ID (rota protegida)
  router.get("/instructor/:id", VerifyToken, async (req, res) => {
    try {
      const instructor = await InstructorService.findInstructorById(
        req.params.id
      );
      if (!instructor) {
        return res.status(404).json({ error: "Instrutor não encontrado" });
      }
      res.status(200).json(instructor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para atualizar informações de um instrutor (rota protegida)
  router.put("/instructor/:id", VerifyToken, async (req, res) => {
    try {
      const updatedInstructor = await InstructorService.updateInstructor(
        req.params.id,
        req.body
      );
      if (!updatedInstructor) {
        return res.status(404).json({ error: "Instrutor não encontrado" });
      }
      res.status(200).json(updatedInstructor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para remover um instrutor (rota protegida)
  router.delete("/instructor/:id", VerifyToken, async (req, res) => {
    try {
      const message = await InstructorService.removeInstructorById(
        req.params.id
      );
      res.status(200).json({ message });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para gerar QR Code com credenciais do instrutor (rota protegida)
  router.get("/instructor/:id/qrcode", VerifyToken, async (req, res) => {
    try {
      const instructor = await InstructorService.findInstructorById(
        req.params.id
      );
      if (!instructor) {
        return res.status(404).json({ error: "Instrutor não encontrado" });
      }
      const qrCodeUrl = await InstructorService.generateQRCodeWithCredentials(
        instructor
      );
      res.status(200).json({ qrCode: qrCodeUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para verificar o token JWT
  router.get("/verify-token", VerifyToken, async (req, res) => {
    try {
      const decoded = await InstructorService.verifyToken(
        req.headers["x-access-token"]
      );
      res.status(200).json({ valid: true, decoded });
    } catch (error) {
      res.status(401).json({ error: "Token inválido ou expirado" });
    }
  });

  return router;
};

module.exports = AuthInstructorRouter;
