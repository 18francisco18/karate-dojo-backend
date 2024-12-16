// routes/graduationRoutes.js
const express = require("express");
const bodyParser = require("body-parser");
const GraduationController = require("../data/graduation/controller");
const verifyTokenMiddleware = require("../middleware/token");

const GraduationRouter = () => {
  let router = express.Router();
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // 1. Rota para criar graduação (apenas Admin)
  router.post("/create", verifyTokenMiddleware("Admin"), async (req, res) => {
    try {
      const { level, instructorId, location, date, availableSlots, scope } = req.body;
      const graduation = await GraduationController.createGraduation(
        level,
        instructorId,
        location,
        date,
        availableSlots,
        scope
      );
      res.status(201).json(graduation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 2. Rota para avaliar graduação (apenas Admin)
  router.patch(
    "/evaluate/:id",
    verifyTokenMiddleware("Admin"),
    async (req, res) => {
      try {
        const { score, comments } = req.body;
        const { id } = req.params;
        const instructorId = req.userId;

        const result = await GraduationController.evaluateGraduation(
          id,
          score,
          comments,
          instructorId
        );

        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao avaliar graduação:", error.message);
        if (error.message.includes("já foi avaliada")) {
          res.status(400).json({ message: "Esta graduação já foi avaliada." });
        } else {
          res.status(500).json({ message: error.message });
        }
      }
    }
  );

  // 3. Rota para obter todas as graduações de um usuário (rota protegida)
  router.get("/user/:userId?", verifyTokenMiddleware(), async (req, res) => {
    const userId = req.params.userId || req.body.userId;
    try {
      const graduations = await GraduationController.getUserGraduations(userId);
      res.status(200).json(graduations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 4. Rota para obter uma graduação por ID (rota protegida)
  router.get("/:id", verifyTokenMiddleware(), async (req, res) => {
    try {
      const graduation = await GraduationController.getGraduationById(
        req.params.id
      );
      res.status(200).json(graduation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 5. Rota para atualizar graduação (apenas Admin)
  router.put(
    "/update/:id",
    verifyTokenMiddleware("Admin"),
    async (req, res) => {
      try {
        const { score, comment, certificateUrl } = req.body;
        const updatedGraduation = await GraduationController.updateGraduation(
          req.params.id,
          score,
          comment,
          certificateUrl
        );
        res.status(200).json(updatedGraduation);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // 6. Rota para deletar graduação (apenas Admin)
  router.delete(
    "/delete/:id",
    verifyTokenMiddleware("Admin"),
    async (req, res) => {
      try {
        const result = await GraduationController.deleteGraduation(
          req.params.id
        );
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // 7. Rota para inscrever aluno em uma graduação
  router.post("/enroll", verifyTokenMiddleware(), async (req, res) => {
    try {
      const { graduationId, studentId } = req.body;
      const result = await GraduationController.enrollStudentInGraduation(graduationId, studentId);
      res.status(200).json(result);
    } catch (error) {
      // Se o erro for relacionado a restrições de plano ou outras validações
      if (error.message.includes("plano") || error.message.includes("não permite")) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Rota para listar todas as graduações com filtros e paginação
  router.get("/", verifyTokenMiddleware(), async (req, res) => {
    try {
      const { 
        beltColor, 
        date, 
        availableSlots, 
        sortField, 
        sortOrder,
        page = 1,
        limit = 10 
      } = req.query;

      const filters = {
        beltColor,
        date,
        availableSlots
      };

      const sort = {
        field: sortField,
        order: sortOrder
      };

      const graduations = await GraduationController.getAllGraduations(
        filters,
        sort,
        parseInt(page),
        parseInt(limit)
      );

      // Ensure we're sending an array
      res.status(200).json(Array.isArray(graduations) ? graduations : []);
    } catch (error) {
      console.error("Erro ao buscar graduações:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};

module.exports = GraduationRouter;
