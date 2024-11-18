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
  // Endpoint para o instrutor criar uma nova graduação
  router.post("/create", verifyTokenMiddleware("Admin"), async (req, res) => {
    try {
      const { level, instructorId, location, date } = req.body;
      const graduation = await GraduationController.createGraduation(
        level,
        instructorId,
        location,
        date
      );
      res.status(201).json(graduation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 2. Rota para avaliar graduação (apenas Admin)
  router.patch(
    "/evaluate/:id",
    verifyTokenMiddleware("Admin"), // Middleware para validar o token e permissões
    async (req, res) => {
      try {
        const { score, comments } = req.body; // Removido instructorId do body
        const { id } = req.params; // ID da graduação
        const instructorId = req.userId; // Obtém o ID do instrutor diretamente do token

        // Chama o controlador com o instructorId do token
        const result = await GraduationController.evaluateGraduation(
          id,
          score,
          comments,
          instructorId
        );
        res.status(200).json(result);
      } catch (error) {
        console.log("Erro ao avaliar graduação:", error.message);
        res.status(500).json({ message: error.message });
      }
    }
  );

  // 3. Rota para obter todas as graduações de um usuário (rota protegida)
  router.get("/user/:userId", verifyTokenMiddleware(), async (req, res) => {
    try {
      const graduations = await GraduationController.getUserGraduations(
        req.params.userId
      );
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
        const updatedGraduation = await GraduationController.updateGraduation(
          req.params.id,
          req.body
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

  return router;
};

module.exports = GraduationRouter;
