const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const VerifyToken = require("../middleware/token");
const StudentController = require("../data/student/controller");

const StudentRouter = () => {
  let router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para obter os planos disponíveis
  router.get("/available-plans", async (req, res) => {
    try {
      const plans = await StudentController.getAvailablePlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para o aluno escolher um plano
  router.post("/choose-plan", async (req, res) => {
    const { studentId, planType } = req.body;

    // Verifica se os parâmetros foram passados corretamente
    if (!studentId || !planType) {
      return res.status(400).json({ error: "Parâmetros inválidos." });
    }

    try {
      // Chama o método choosePlan do StudentController
      const result = await StudentController.choosePlan(studentId, planType);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para obter os detalhes do estudante (plano e mensalidade)
  router.get("/student/:id/details", async (req, res) => {
    try {
      const studentId = req.params.id;

      // Chama a função para obter os detalhes do aluno, populando os planos e mensalidades
      const studentDetails = await StudentController.getStudentDetails(
        studentId
      );

      if (!studentDetails) {
        return res.status(404).json({ error: "Aluno não encontrado." });
      }

      // Retorna os detalhes do aluno, incluindo planos e mensalidades
      return res.status(200).json(studentDetails);
    } catch (error) {
      console.error("Erro ao buscar detalhes do aluno:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Verifica o token de autenticação antes de permitir acesso às rotas
  router.use(VerifyToken);

  return router;
};

module.exports = StudentRouter;
