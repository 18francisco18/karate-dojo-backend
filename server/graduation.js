// routes/graduationRoutes.js
const express = require("express");
const bodyParser = require("body-parser");
const GraduationController = require("../data/graduation/controller");
const verifyTokenMiddleware = require("../middleware/token");

const GraduationRouter = () => {
  let router = express.Router();
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // 1. Rota para criar graduação
  router.post("/create", async (req, res) => {
    try {
      const { user, level, instructorId, location, date } = req.body; // Desestruturar os parâmetros do corpo da requisição

      const graduation = await GraduationController.createGraduation(
        user,
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

  // Rota para avaliar graduação
  router.patch("/evaluate/:id", async (req, res) => {
    try {
      const { score, comments, instructorId } = req.body; // Inclui o instructorId
      const { id } = req.params;

      const result = await GraduationController.evaluateGraduation(
        id,
        score,
        comments,
        instructorId // Passa o instructorId
      );
      res.status(200).json(result);
    } catch (error) {
      console.log("Erro ao avaliar graduação:", error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // 3. Rota para obter todas as graduações de um usuário
  router.get("/user/:userId", async (req, res) => {
    try {
      const graduations = await GraduationController.getUserGraduations(
        req.params.userId
      );
      res.status(200).json(graduations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 4. Rota para obter uma graduação por ID
  router.get("/:id", async (req, res) => {
    try {
      const graduation = await GraduationController.getGraduationById(
        req.params.id
      );
      res.status(200).json(graduation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 5. Rota para atualizar graduação
  router.put("/update/:id", async (req, res) => {
    try {
      const updatedGraduation = await GraduationController.updateGraduation(
        req.params.id,
        req.body
      );
      res.status(200).json(updatedGraduation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 6. Rota para deletar graduação
  router.delete("/delete/:id", async (req, res) => {
    try {
      const result = await GraduationController.deleteGraduation(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};

module.exports = GraduationRouter;
