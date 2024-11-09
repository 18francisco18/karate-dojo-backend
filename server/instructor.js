const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const VerifyToken = require("../middleware/token");
const InstructorController = require("../data/instructor/controller");

const InstructorRouter = () => {
  let router = express.Router();

  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para obter todos os instrutores
  router.get("/instructors", async (req, res) => {
    try {
      const instructors = await InstructorController.getInstructors();
      res.json(instructors);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // Rota para adicionar um estudante a um administrador
  router.post("/addStudent", async (req, res) => {
    const { adminId, studentId } = req.body;

    if (!adminId || !studentId) {
      return res
        .status(400)
        .json({ message: "Admin ID e Student ID são obrigatórios." });
    }

    try {
      const result = await InstructorController.addStudentToInstructor(
        adminId,
        studentId
      );
      return res.status(200).json({ message: result });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Rota para remover um estudante de um administrador
  router.post("/removeStudent", async (req, res) => {
    const { adminId, studentId } = req.body;

    if (!adminId || !studentId) {
      return res
        .status(400)
        .json({ message: "Admin ID e Student ID são obrigatórios." });
    }

    try {
      const result = await InstructorController.removeStudentFromInstructor(
        adminId,
        studentId
      );
      return res.status(200).json({ message: result });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  router.get("/:adminId/students", async (req, res) => {
    const { adminId } = req.params;

    try {
      const students = await InstructorController.getStudentsByInstructor(
        adminId
      );
      return res.status(200).json({ students });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Rota para obter estudantes de um administrador pelo Email
  router.get("/email/:email/students", async (req, res) => {
    const { email } = req.params;

    try {
      const students = await InstructorController.getStudentsByInstructorEmail(
        email
      );
      return res.status(200).json({ students });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  router.use(VerifyToken);

  return router;
};

module.exports = InstructorRouter;
