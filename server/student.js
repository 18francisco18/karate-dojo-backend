const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const VerifyToken = require("../middleware/token");
const checkSuspended = require("../middleware/checkSuspended");
const StudentController = require("../data/student/controller");
const GraduationController = require("../data/graduation/controller");

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
  router.post(
    "/choose-plan",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const { planType } = req.body;
      const studentId = req.userId;

      if (!studentId || !planType) {
        return res.status(400).json({ error: "Parâmetros inválidos." });
      }

      try {
        const result = await StudentController.choosePlan(studentId, planType);
        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao escolher plano:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para cancelar o plano
  router.delete(
    "/cancel-plan",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const studentId = req.userId;

      if (!studentId) {
        return res.status(400).json({ error: "ID do aluno não encontrado." });
      }

      try {
        const result = await StudentController.cancelPlan(studentId);
        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao cancelar plano:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para o aluno escolher um instrutor
  router.post(
    "/choose-instructor",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const { instructorId } = req.body;
      const studentId = req.userId;

      if (!studentId) {
        return res
          .status(400)
          .json({ error: "ID do aluno não encontrado no token" });
      }

      if (!instructorId) {
        return res
          .status(400)
          .json({ error: "ID do instrutor não encontrado" });
      }

      try {
        const result = await StudentController.chooseInstructor(
          studentId,
          instructorId
        );
        res.status(200).json({ message: result });
      } catch (error) {
        console.error("Erro ao associar aluno ao instrutor:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para inscrição em graduação
  router.post(
    "/enroll-graduation",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const { graduationId } = req.body;
      const studentId = req.userId;

      if (!studentId) {
        return res
          .status(400)
          .json({ error: "ID do aluno não encontrado no token" });
      }

      if (!graduationId) {
        return res
          .status(400)
          .json({ error: "ID da graduação não encontrado" });
      }

      try {
        const result = await StudentController.enrollInGraduation(
          studentId,
          graduationId
        );
        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao inscrever aluno na graduação:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para obter os detalhes do estudante
  router.get("/details", VerifyToken(), async (req, res) => {
    const studentId = req.userId; // O ID do aluno vem do token verificado no middleware

    try {
      const studentDetails = await StudentController.getStudentDetails(
        studentId
      );

      if (!studentDetails) {
        return res.status(404).json({ error: "Aluno não encontrado." });
      }

      return res.status(200).json(studentDetails);
    } catch (error) {
      console.error("Erro ao buscar detalhes do aluno:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
};

module.exports = StudentRouter;
