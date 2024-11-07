const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");

const VerifyToken = require("../middleware/token");
const instructorService = require("../data/instructor/service");

const InstructorRouter = () => {
  let router = express.Router();

  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota para adicionar um estudante a um administrador
  router.post("/addStudent", async (req, res) => {
    const { adminId, studentId } = req.body;

    if (!adminId || !studentId) {
      return res
        .status(400)
        .json({ message: "Admin ID e Student ID são obrigatórios." });
    }

    try {
      const result = await instructorService.addStudentToInstructor(
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
      const result = await instructorService.removeStudentFromInstructor(
        adminId,
        studentId
      );
      return res.status(200).json({ message: result });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  router.use(VerifyToken);

  return router;
};

module.exports = InstructorRouter;
