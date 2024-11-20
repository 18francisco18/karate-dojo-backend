const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const VerifyToken = require("../middleware/token");
const StudentService = require("../data/student/service");

const AuthStudentRouter = () => {
  const router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "10mb" }));
  router.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  // Rota para registrar um novo estudante
  router.post("/register", async (req, res) => {
    try {
      // Validação básica dos campos obrigatórios
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ 
          error: "Nome, email e senha são obrigatórios" 
        });
      }

      const newStudent = await StudentService.createStudent(req.body);
      res.status(201).json({
        message: "Estudante criado com sucesso",
        student: {
          id: newStudent._id,
          name: newStudent.name,
          email: newStudent.email,
          belt: newStudent.belt
        }
      });
    } catch (error) {
      console.error("Erro ao criar estudante:", error);
      if (error.code === 11000) {
        return res.status(400).json({ 
          error: "Email já está em uso" 
        });
      }
      res.status(500).json({ 
        error: error.message || "Erro ao criar estudante" 
      });
    }
  });

  // Rota para autenticação de estudante (login)
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ 
          error: "Email e senha são obrigatórios" 
        });
      }

      const student = await StudentService.findStudentByEmail(email);
      if (!student) {
        return res.status(404).json({ 
          error: "Estudante não encontrado" 
        });
      }

      if (student.suspended) {
        return res.status(403).json({ 
          error: "Conta suspensa. Entre em contato com seu instrutor." 
        });
      }

      const isMatch = await StudentService.comparePassword(password, student.password);
      if (!isMatch) {
        return res.status(401).json({ 
          error: "Senha incorreta" 
        });
      }

      const token = StudentService.createToken(student);
      
      // Configuração dos cookies com opções de segurança
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.status(200).json({
        message: "Login realizado com sucesso",
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          belt: student.belt
        }
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ 
        error: "Erro ao realizar login" 
      });
    }
  });

  // Rota para logout
  router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ 
      auth: false, 
      message: "Logout realizado com sucesso" 
    });
  });

  // Rota para verificar autenticação
  router.get("/check-auth", VerifyToken(), async (req, res) => {
    try {
      const student = await StudentService.findStudentById(req.userId);
      if (!student) {
        return res.status(404).json({ 
          error: "Estudante não encontrado" 
        });
      }

      res.json({
        auth: true,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          belt: student.belt,
          instructor: student.instructor
        }
      });
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor" 
      });
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
