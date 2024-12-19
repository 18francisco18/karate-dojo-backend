const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const VerifyToken = require("../middleware/token");
const InstructorController = require("../data/instructor/controller");
const MonthlyFeeController = require("../data/monthlyFees/controller");
const GraduationController = require("../data/graduation/controller");
const MonthlyPlanController = require("../data/monthlyPlans/controller");
const path = require("path");

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

  // Rota para adicionar um aluno a um instrutor
  router.post(
    "/instructor/:id/add-student/:studentId?",
    VerifyToken,
    async (req, res) => {
      const { id, studentId: studentIdParam } = req.params;
      const studentId = studentIdParam || req.body.studentId;

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
    }
  );

  // Rota para remover um aluno de um instrutor
  router.post(
    "/instructor/remove-student/:studentId?",
    VerifyToken(),
    async (req, res) => {
      const studentId = req.params.studentId || req.body.studentId; // ID do estudante obtido da URL ou do corpo da requisição
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
  router.get("/students", VerifyToken("Admin"), async (req, res) => {
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
  router.patch("/monthly-fees/:id/pay", VerifyToken(), async (req, res) => {
    try {
      const monthlyFeeId = req.params.id;
      const { paymentMethod } = req.body;

      if (!paymentMethod) {
        return res.status(400).json({ 
          error: "Método de pagamento é obrigatório",
          message: "Por favor, especifique o método de pagamento (ex: 'credit_card', 'debit_card', 'cash', 'pix')"
        });
      }

      const result = await MonthlyFeeController.markMonthlyFeeAsPaid(
        monthlyFeeId,
        paymentMethod
      );
      
      console.log('Resultado do pagamento:', result); // Para debug
      
      res.status(200).json({
        message: "Mensalidade marcada como paga com sucesso",
        data: result.monthlyFee,
        receiptPath: result.receiptPath
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Rota para obter todas as mensalidades
  router.get("/monthly-fees", VerifyToken(), async (req, res) => {
    try {
      const monthlyFees = await MonthlyFeeController.getAllMonthlyFees();
      console.log('Mensalidades encontradas:', monthlyFees); // Para debug
      res.status(200).json({
        message: "Mensalidades recuperadas com sucesso",
        data: monthlyFees
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para remover suspensão de um aluno
  router.post(
    "/unsuspend-student/:studentId?",
    VerifyToken(),
    async (req, res) => {
      const studentId = req.params.studentId || req.body.studentId;

      if (!studentId) {
        return res.status(400).json({ error: "ID do aluno é necessário" });
      }

      try {
        // Chama a função para retirar a suspensão do aluno
        const unsuspendedStudent =
          await MonthlyFeeController.manuallyUnsuspendStudent(studentId);
        res.status(200).json({
          message: "Suspensão do aluno removida com sucesso.",
          student: unsuspendedStudent,
        });
      } catch (error) {
        console.error("Erro ao remover suspensão do aluno:", error.message);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para convidar um aluno para uma graduação
  router.post(
    "/graduations/:id/invite/:studentEmail?",
    VerifyToken(),
    async (req, res) => {
      try {
        const { id, studentEmail: emailParam } = req.params;
        const studentEmail = emailParam || req.body.studentEmail;

        if (!studentEmail) {
          return res
            .status(400)
            .json({ error: "Email do aluno é obrigatório." });
        }

        const graduation = await GraduationController.getGraduationById(id);
        if (!graduation) {
          return res.status(404).json({ error: "Graduação não encontrada." });
        }

        const emailResult =
          await GraduationController.sendGraduationInvitationEmail(
            studentEmail,
            graduation
          );
        res.status(200).json({ message: emailResult });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rotas de Planos Mensais
  router.get("/plans", VerifyToken("Admin"), async (req, res) => {
    try {
      const plans = await MonthlyPlanController.getAll();
      res.json(plans);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/plans/create", VerifyToken("Admin"), async (req, res) => {
    try {
      const { name, price, graduationScopes } = req.body;
      const result = await MonthlyPlanController.createPlan(name, price, graduationScopes);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put("/plans/:planId", VerifyToken("Admin"), async (req, res) => {
    try {
      const { price, graduationScopes } = req.body;
      const result = await MonthlyPlanController.updatePlan(req.params.planId, price, graduationScopes);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/plans/:planId", VerifyToken("Admin"), async (req, res) => {
    try {
      const result = await MonthlyPlanController.deletePlan(req.params.planId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Servir arquivos de recibo
  router.get("/receipt/:filename", VerifyToken(), (req, res) => {
    const filename = req.params.filename;
    const receiptPath = path.join(__dirname, '..', 'receipts', filename);
    res.sendFile(receiptPath);
  });

  return router;
};

module.exports = InstructorRouter;
