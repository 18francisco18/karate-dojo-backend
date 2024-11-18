const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const VerifyToken = require("../middleware/token");
const InstructorController = require("../data/instructor/controller");
const MonthlyFeeController = require("../data/monthlyFees/controller");

const InstructorRouter = () => {
  const router = express.Router();

  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rotas
  router.get("/instructors", async (req, res) => {
    try {
      const instructors = await InstructorController.getInstructors();
      res.json(instructors);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  router.put("/updateInstructor/:adminId", async (req, res) => {
    try {
      const result = await InstructorController.updateInstructorDetails(
        req.params.adminId,
        req.body
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/addStudent", async (req, res) => {
    try {
      const result = await InstructorController.addStudentToInstructor(
        req.body.adminId,
        req.body.studentId
      );
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/removeStudent", async (req, res) => {
    try {
      const result = await InstructorController.removeStudentFromInstructor(
        req.body.adminId,
        req.body.studentId
      );
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/:adminId/students", async (req, res) => {
    try {
      const students = await InstructorController.getStudentsByInstructor(
        req.params.adminId
      );
      res.json({ students });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/students", async (req, res) => {
    try {
      const students = await InstructorController.getAllStudents();
      res.json({ students });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/email/:email/students", async (req, res) => {
    try {
      const students = await InstructorController.getStudentsByInstructorEmail(
        req.params.email
      );
      res.json({ students });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/student/:studentId/instructor", async (req, res) => {
    try {
      const instructor = await InstructorController.getInstructorByStudentId(
        req.params.studentId
      );
      res.json(instructor);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/removeAllStudents/:adminId", async (req, res) => {
    try {
      const message =
        await InstructorController.removeAllStudentsFromInstructor(
          req.params.adminId
        );
      res.json({ message });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.patch("/monthly-fees/:id/pay", async (req, res) => {
    try {
      const monthlyFeeId = req.params.id;

      // Chama a função para marcar a mensalidade como paga
      const updatedMonthlyFee = await MonthlyFeeController.markMonthlyFeeAsPaid(
        monthlyFeeId
      );

      // Retorna a mensalidade atualizada
      res.status(200).json({
        message: "Mensalidade marcada como paga",
        data: updatedMonthlyFee,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  });

  router.use(VerifyToken);
  return router;
};

module.exports = InstructorRouter;
