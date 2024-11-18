const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const VerifyToken = require("../middleware/token");
const InstructorController = require("../data/instructor/controller");
const MonthlyFeeController = require("../data/monthlyFees/controller");

const InstructorRouter = () => {
  const router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para obter um instrutor pelo ID
  router.get("/instructor/:id", VerifyToken, async (req, res) => {
    const { id } = req.params;
    try {
      const instructor =
        await InstructorController.getInstructorDetailsWithStudents(id);
      if (!instructor) {
        return res.status(404).json({ error: "Instrutor não encontrado" });
      }
      res.status(200).json(instructor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para adicionar um aluno a um instrutor (nao esta a ser usada pois o aluno é adicionado ao instrutor na rota /)
  router.post("/instructor/:id/add-student", VerifyToken, async (req, res) => {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "ID do estudante é necessário" });
    }

    try {
      const result = await InstructorController.addStudentToInstructor(
        id,
        studentId
      );
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post(
    "/instructor/remove-student",
    VerifyToken(),
    async (req, res) => {
      const { studentId } = req.body;
      const instructorId = req.userId; // ID do instrutor obtido do token

      // Verificar se o ID do instrutor está presente
      if (!instructorId) {
        return res.status(403).json({
          error: "Acesso negado. Apenas instrutores podem remover alunos.",
        });
      }

      if (!studentId) {
        return res.status(400).json({ error: "ID do estudante é necessário" });
      }

      try {
        const result = await InstructorController.removeStudentFromInstructor(
          instructorId,
          studentId
        );
        return res.status(200).json({ message: result });
      } catch (error) {
        console.error("Erro na rota /remove-student:", error.message);
        return res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para obter todos os estudantes associados a um instrutor pelo ID
  router.get("/instructor/:id/students", VerifyToken, async (req, res) => {
    const { id } = req.params;
    try {
      const students = await InstructorController.getStudentsByInstructor(id);
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para obter estudantes associados a um instrutor pelo email
  router.get("/instructor/students-by-email", VerifyToken, async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email do instrutor é necessário" });
    }
    try {
      const students = await InstructorController.getStudentsByInstructorEmail(
        email
      );
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para listar todos os estudantes no sistema
  router.get("/students", VerifyToken, async (req, res) => {
    try {
      const students = await InstructorController.getAllStudents();
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para remover todos os estudantes de um instrutor
  router.delete(
    "/instructor/:id/remove-all-students",
    VerifyToken,
    async (req, res) => {
      const { id } = req.params;
      try {
        const result =
          await InstructorController.removeAllStudentsFromInstructor(id);
        res.status(200).json({ message: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para marcar uma mensalidade como paga
  router.patch("/monthly-fees/:id/pay", async (req, res) => {
    try {
      const monthlyFeeId = req.params.id;
      const updatedMonthlyFee = await MonthlyFeeController.markMonthlyFeeAsPaid(
        monthlyFeeId
      );
      res.status(200).json({
        message: "Mensalidade marcada como paga",
        data: updatedMonthlyFee,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  return router;
};

module.exports = InstructorRouter;
