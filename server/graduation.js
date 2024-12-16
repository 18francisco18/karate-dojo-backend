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
      const { level, location, date, availableSlots, scope } = req.body;
      const instructorId = req.userId; // Usar o ID do Admin logado

      if (!level || !location || !date || !availableSlots || !scope) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
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
      console.error("Erro ao criar graduação:", error);
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
        if (!score || !comments) {
          return res.status(400).json({ message: "Nota e comentários são obrigatórios" });
        }
        const result = await GraduationController.evaluateGraduation(
          id,
          score,
          comments,
          instructorId
        );

        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao avaliar graduação:", error);
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
    if (!userId) {
      return res.status(400).json({ message: "UserId é obrigatório" });
    }
    try {
      const graduations = await GraduationController.getUserGraduations(userId);
      res.status(200).json(graduations);
    } catch (error) {
      console.error("Erro ao obter graduações do usuário:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 4. Rota para obter uma graduação por ID (rota protegida)
  router.get("/:id", verifyTokenMiddleware(), async (req, res) => {
    try {
      const graduation = await GraduationController.getGraduationById(
        req.params.id
      );
      if (!graduation) {
        return res.status(404).json({ message: "Graduação não encontrada" });
      }
      res.status(200).json(graduation);
    } catch (error) {
      console.error("Erro ao obter graduação:", error);
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
        if (!score && !comment && !certificateUrl) {
          return res.status(400).json({ message: "Pelo menos um campo é obrigatório" });
        }
        const updatedGraduation = await GraduationController.updateGraduation(
          req.params.id,
          score,
          comment,
          certificateUrl
        );
        res.status(200).json(updatedGraduation);
      } catch (error) {
        console.error("Erro ao atualizar graduação:", error);
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
        if (!result) {
          return res.status(404).json({ message: "Graduação não encontrada" });
        }
        res.status(200).json(result);
      } catch (error) {
        console.error("Erro ao deletar graduação:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  // 7. Rota para inscrever aluno em uma graduação
  router.post("/enroll", verifyTokenMiddleware(), async (req, res) => {
    try {
      const { graduationId, studentId } = req.body;
      console.log('Recebida requisição de inscrição:', { graduationId, studentId });
      
      if (!graduationId || !studentId) {
        return res.status(400).json({ 
          message: "GraduationId e StudentId são obrigatórios",
          received: { graduationId, studentId }
        });
      }

      const result = await GraduationController.enrollStudentInGraduation(graduationId, studentId);
      console.log('Resultado da inscrição:', result);
      
      res.status(200).json({ 
        message: "Inscrição realizada com sucesso",
        graduation: result 
      });
    } catch (error) {
      console.error('Erro na rota de inscrição:', error);
      res.status(500).json({ 
        message: error.message || "Erro ao realizar inscrição",
        error: error.toString()
      });
    }
  });

  // 8. Rota para cancelar inscrição em uma graduação
  router.post("/unenroll", verifyTokenMiddleware(), async (req, res) => {
    try {
      const { graduationId, studentId } = req.body;
      console.log('Received unenroll request:', { graduationId, studentId });
      
      if (!graduationId || !studentId) {
        return res.status(400).json({ 
          message: "GraduationId e StudentId são obrigatórios",
          received: { graduationId, studentId }
        });
      }

      const result = await GraduationController.unenrollStudentFromGraduation(graduationId, studentId);
      console.log('Unenroll result:', result);
      
      res.status(200).json({ 
        message: "Inscrição cancelada com sucesso",
        graduation: result 
      });
    } catch (error) {
      console.error('Error in unenroll route:', error);
      res.status(500).json({ 
        message: error.message || "Erro ao cancelar inscrição",
        error: error.toString()
      });
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
      console.error("Erro ao listar graduações:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};

module.exports = GraduationRouter;
