const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const VerifyToken = require("../middleware/token");
const checkSuspended = require("../middleware/checkSuspended");
const StudentController = require("../data/student/controller");
const GraduationController = require("../data/graduation/controller");
const MonthlyPlanController = require("../data/monthlyPlans/controller");

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

  router.delete("/cancel-plan", VerifyToken(), checkSuspended, async (req, res) => {
    try {
      const result = await MonthlyPlanController.cancelActivePlan(req.userId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
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
