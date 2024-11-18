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

  // ===================== ROTAS =====================

  // Rota para obter todos os instrutores
  router.get("/instructors", VerifyToken, async (req, res) => {
    try {
      const instructors = await InstructorController.getInstructors();
      res.status(200).json(instructors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

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

  // Rota para criar um novo instrutor
  router.post("/instructor", VerifyToken, async (req, res) => {
    const instructorData = req.body;
    try {
      const newInstructor = await InstructorController.createInstructor(
        instructorData
      );
      res.status(201).json(newInstructor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para atualizar detalhes do instrutor
  router.put("/instructor/:id", VerifyToken, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedInstructor =
        await InstructorController.updateInstructorDetails(id, updates);
      res.status(200).json(updatedInstructor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para remover um instrutor pelo ID
  router.delete("/instructor/:id", VerifyToken, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await InstructorController.removeInstructorById(id);
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para adicionar um aluno a um instrutor
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

  // Rota para remover um aluno de um instrutor
  router.delete(
    "/instructor/:id/remove-student",
    VerifyToken,
    async (req, res) => {
      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "ID do estudante é necessário" });
      }

      try {
        const result = await InstructorController.removeStudentFromInstructor(
          id,
          studentId
        );
        res.status(200).json({ message: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
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

  // 10. Marcar uma mensalidade como paga
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
