const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const VerifyToken = require("../middleware/token");
const StudentService = require("../data/student/service");

const AuthStudentRouter = () => {
  const router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para registrar um novo estudante
  router.post("/register", async (req, res) => {
    try {
      const newStudent = await StudentService.createStudent(req.body);
      res.status(201).json(newStudent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para autenticação de estudante (login)
  // Rota para autenticação de estudante (login)
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    try {
      const student = await StudentService.findStudentByEmail(email);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }

      const isMatch = await StudentService.comparePassword(
        password,
        student.password
      );
      if (!isMatch) {
        return res.status(401).json({ error: "Senha incorreta" });
      }

      const token = StudentService.createToken(student);

      // Adiciona o token aos cookies e envia a resposta
      res
        .cookie("authToken", token, {
          httpOnly: true, // Torna o cookie inacessível ao JavaScript no navegador (por segurança)
          secure: process.env.NODE_ENV === "production", // Define o cookie como seguro somente em produção
          maxAge: 24 * 60 * 60 * 1000, // Expira em 1 dia
        })
        .status(200)
        .json({ auth: true, message: "Login bem-sucedido" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar todos os estudantes (rota protegida)
  router.get("/students", VerifyToken, async (req, res) => {
    try {
      const students = await StudentService.findAllStudents();
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar um estudante pelo ID (rota protegida)
  router.get("/student/:id", VerifyToken, async (req, res) => {
    try {
      const student = await StudentService.findStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }
      res.status(200).json(student);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para atualizar informações de um estudante (rota protegida)
  router.put("/student/:id", VerifyToken, async (req, res) => {
    try {
      const updatedStudent = await StudentService.updateStudent(
        req.params.id,
        req.body
      );
      if (!updatedStudent) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }
      res.status(200).json(updatedStudent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para remover um estudante (rota protegida)
  router.delete("/student/:id", VerifyToken, async (req, res) => {
    try {
      const message = await StudentService.removeStudentById(req.params.id);
      res.status(200).json({ message });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para gerar QR Code com credenciais do estudante (rota protegida)
  router.get("/student/:id/qrcode", VerifyToken, async (req, res) => {
    try {
      const student = await StudentService.findStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }
      const qrCodeUrl = await StudentService.generateQRCodeWithCredentials(
        student
      );
      res.status(200).json({ qrCode: qrCodeUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para verificar o token JWT
  router.get("/verify-token", VerifyToken, async (req, res) => {
    try {
      const decoded = await StudentService.verifyToken(
        req.headers["x-access-token"]
      );
      res.status(200).json({ valid: true, decoded });
    } catch (error) {
      res.status(401).json({ error: "Token inválido ou expirado" });
    }
  });

  return router;
};

module.exports = AuthStudentRouter;
