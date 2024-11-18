const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const VerifyToken = require("../middleware/token");
const InstructorService = require("../data/instructor/service");

const AuthInstructorRouter = () => {
  const router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para criar um novo instrutor (Admin apenas)
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

  // Rota para buscar todos os instrutores (Admin apenas)
  router.get("/instructors", VerifyToken("Admin"), async (req, res) => {
    try {
      const instructors = await InstructorService.findAllInstructors();
      res.status(200).json(instructors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar um instrutor pelo ID (Admin apenas)
  router.get("/instructor/:id", VerifyToken("Admin"), async (req, res) => {
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

  // Rota para atualizar informações de um instrutor (Admin apenas)
  router.put("/instructor/:id", VerifyToken("Admin"), async (req, res) => {
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

  // Rota para remover um instrutor (Admin apenas)
  router.delete("/instructor/:id", VerifyToken("Admin"), async (req, res) => {
    try {
      const message = await InstructorService.removeInstructorById(
        req.params.id
      );
      res.status(200).json({ message });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

module.exports = AuthInstructorRouter;
