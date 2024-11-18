// middleware/checkSuspended.js
const Student = require("../models/user").Student;

async function checkSuspended(req, res, next) {
  try {
    const student = await Student.findById(req.userId); // Supondo que o ID do usuário está no req após autenticação
    if (student && student.suspended) {
      return res
        .status(403)
        .json({
          error: "Aluno suspenso. Regularize seu pagamento para continuar.",
        });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro ao verificar suspensão do aluno." });
  }
}

module.exports = checkSuspended;
