const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const VerifyToken = require("../middleware/token");
const checkSuspended = require("../middleware/checkSuspended");
const StudentController = require("../data/student/controller");
const GraduationController = require("../data/graduation/controller");
const MonthlyPlanController = require("../data/monthlyPlans/controller");
const MonthlyFeeController = require("../data/monthlyFees/controller");
const MonthlyFee = require("../models/monthlyFee");

const StudentRouter = () => {
  let router = express.Router();

  // Middleware
  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rotas de Planos Mensais
  router.get("/available-plans", VerifyToken(), checkSuspended, async (req, res) => {
    try {
      const plans = await MonthlyPlanController.getAll();
      res.json(plans);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/plans", async (req, res) => {
    try {
      const plans = await MonthlyPlanController.getAll();
      res.json(plans);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/active-plan", VerifyToken(), checkSuspended, async (req, res) => {
    try {
      const plan = await MonthlyPlanController.getActivePlan(req.userId);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/choose-plan/:planId", VerifyToken(), checkSuspended, async (req, res) => {
    try {
      const result = await MonthlyPlanController.associatePlanToStudent(req.params.planId, req.userId);
      res.json(result);
    } catch (error) {
      // Se já tem plano ativo, retornar 409 Conflict
      if (error.message.includes("já tem um plano ativo")) {
        return res.status(409).json({ 
          error: error.message,
          message: "Para trocar de plano, primeiro cancele o plano atual usando DELETE /student/cancel-plan"
        });
      }
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/cancel-plan", VerifyToken(), async (req, res) => {
    try {
      const studentId = req.userId;

      // Verificar se o aluno tem mensalidades pendentes
      const hasUnpaid = await MonthlyFeeController.hasUnpaidFees(studentId);
      if (hasUnpaid) {
        return res.status(400).json({
          error: "Não é possível cancelar o plano com mensalidades pendentes",
          message: "Por favor, pague todas as mensalidades pendentes antes de cancelar o plano"
        });
      }

      // Cancelar o plano usando o MonthlyPlanController
      const result = await MonthlyPlanController.cancelActivePlan(studentId);
      res.status(200).json({
        message: "Plano cancelado com sucesso",
        data: result
      });
    } catch (error) {
      console.error("Erro ao cancelar plano:", error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/my-plans", VerifyToken(), checkSuspended, async (req, res) => {
    try {
      const plans = await MonthlyPlanController.getStudentPlans(req.userId);
      res.json(plans);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Rota para o aluno escolher um instrutor
  router.post(
    "/choose-instructor/:instructorId?",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const { instructorId: instructorIdParam } = req.params;
      const instructorId = instructorIdParam || req.body.instructorId;
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

  router.get(
    "/graduations",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      try {
        const {
          beltColor,
          date,
          availableSlots,
          sortField,
          sortOrder,
          page,
          limit,
        } = req.query;
        const filters = {
          beltColor,
          date,
          availableSlots,
        };
        const sort = {
          field: sortField,
          order: sortOrder,
        };
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        const result = await GraduationController.getAllGraduations(
          filters,
          sort,
          pageNumber,
          limitNumber
        );
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para inscrição em graduação
  router.post(
    "/enroll-graduation/:graduationId?",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const { graduationId: graduationIdParam } = req.params;
      const graduationId = graduationIdParam || req.body.graduationId;
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
        const graduation = await GraduationController.getGraduationById(
          graduationId
        );
        if (graduation.availableSlots <= 0) {
          return res
            .status(400)
            .json({ error: "Não há vagas disponíveis para esta graduação." });
        }

        const result = await StudentController.enrollInGraduation(
          studentId,
          graduationId
        );

        // Atualiza o número de vagas disponíveis
        graduation.availableSlots -= 1;
        await graduation.save();

        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao inscrever aluno na graduação:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  router.post(
    "/graduations/:id/enroll",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      try {
        const { id } = req.params;
        const studentId = req.userId;

        if (!studentId) {
          return res
            .status(400)
            .json({ error: "ID do aluno não encontrado no token." });
        }

        const graduation = await GraduationController.getGraduationById(id);
        if (!graduation) {
          return res.status(404).json({ error: "Graduação não encontrada." });
        }

        if (graduation.availableSlots <= 0) {
          return res
            .status(400)
            .json({ error: "Não há vagas disponíveis para esta graduação." });
        }

        const result = await StudentController.enrollInGraduation(
          studentId,
          id
        );

        // Atualiza o número de vagas disponíveis
        graduation.availableSlots -= 1;
        await graduation.save();

        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao inscrever aluno na graduação:", error.message);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para cancelar inscrição em uma graduação
  router.post(
    "/graduations/:id/cancel",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      try {
        const { id } = req.params;
        const studentId = req.userId;

        if (!studentId) {
          return res
            .status(400)
            .json({ error: "ID do aluno não encontrado no token." });
        }

        const result = await GraduationController.unenrollStudentFromGraduation(id, studentId);
        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao cancelar inscrição na graduação:", error.message);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para buscar graduações em que o aluno está inscrito
  router.get(
    "/enrolled-graduations",
    VerifyToken(),
    async (req, res) => {
      try {
        const studentId = req.userId;
        console.log("Buscando graduações para o estudante:", studentId);
        
        const student = await StudentController.getStudentById(studentId);
        console.log("Estudante encontrado:", student);
        
        if (!student) {
          return res.status(404).json({ error: "Estudante não encontrado" });
        }

        // Buscar todas as graduações em que o aluno está inscrito
        const enrolledGraduations = await GraduationController.getEnrolledGraduations(studentId);
        console.log("Graduações encontradas:", enrolledGraduations);
        
        res.status(200).json({
          graduations: enrolledGraduations
        });
      } catch (error) {
        console.error("Erro detalhado ao buscar graduações inscritas:", error);
        res.status(500).json({ 
          error: "Erro ao buscar graduações inscritas",
          details: error.message 
        });
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

  // Rota para listar todos os estudantes
  router.get("/all", VerifyToken(), async (req, res) => {
    try {
      const students = await Student.find()
        .populate('instructor')
        .populate('monthlyPlan')
        .select('-password'); // Exclude password field
      res.status(200).json(students || []);
    } catch (error) {
      console.error("Erro ao buscar estudantes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para remover associação com instrutor
  router.delete(
    "/remove-instructor",
    VerifyToken(),
    checkSuspended,
    async (req, res) => {
      const studentId = req.userId;

      if (!studentId) {
        return res
          .status(400)
          .json({ error: "ID do aluno não encontrado no token" });
      }

      try {
        const result = await StudentController.removeInstructor(studentId);
        res.status(200).json({ message: result });
      } catch (error) {
        console.error("Erro ao remover instrutor do aluno:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Rota para obter as mensalidades do estudante logado
  router.get("/my-monthly-fees", VerifyToken(), async (req, res) => {
    try {
      const studentId = req.userId;
      const monthlyFees = await MonthlyFee.find({ student: studentId })
        .sort({ dueDate: -1 })
        .select('amount dueDate status paymentDate receiptPath');

      res.status(200).json({
        message: "Mensalidades recuperadas com sucesso",
        data: monthlyFees
      });
    } catch (error) {
      console.error("Erro ao buscar mensalidades:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para visualizar o recibo
  router.get("/receipt/:monthlyFeeId", VerifyToken(), async (req, res) => {
    try {
      const studentId = req.userId;
      const monthlyFeeId = req.params.monthlyFeeId;

      const monthlyFee = await MonthlyFee.findOne({
        _id: monthlyFeeId,
        student: studentId,
        status: 'paid'
      });

      if (!monthlyFee) {
        return res.status(404).json({
          error: "Recibo não encontrado",
          message: "Mensalidade não encontrada ou não está paga"
        });
      }

      if (!monthlyFee.receiptPath) {
        return res.status(404).json({
          error: "Recibo não disponível",
          message: "O recibo desta mensalidade não está disponível"
        });
      }

      // Usar o caminho do recibo diretamente, já que ele já é absoluto
      const filePath = monthlyFee.receiptPath;
      console.log('Tentando acessar o recibo em:', filePath);

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        console.error('Arquivo não encontrado:', filePath);
        return res.status(404).json({
          error: "Arquivo não encontrado",
          message: "O arquivo do recibo não foi encontrado no servidor"
        });
      }

      // Enviar o arquivo
      res.sendFile(filePath);
    } catch (error) {
      console.error("Erro ao buscar recibo:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

module.exports = StudentRouter;
