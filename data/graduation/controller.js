// controllers/graduationController.js
const { Instructor, Student } = require("../../models/user");
const Graduation = require("../../models/graduation");
const { generateDiploma } = require("../../pdfs/pdfService"); // Importando o serviço de PDF

const GraduationController = {
  createGraduation,
  evaluateGraduation,
  getUserGraduations,
  getGraduationById,
  updateGraduation,
  deleteGraduation,
};

// 1. Criar Graduação
async function createGraduation(level, instructorId, location, date) {
  try {
    const graduationDate = date || new Date();
    const graduation = new Graduation({
      level,
      instructor: instructorId,
      location,
      date: graduationDate,
    });

    await graduation.save();

    return { message: "Graduação criada com sucesso", graduation };
  } catch (error) {
    throw new Error("Erro ao criar graduação: " + error.message);
  }
}

// 2. Avaliar Graduação
async function evaluateGraduation(id, score, comments, instructorId) {
  if (score < 0 || score > 100) {
    throw new Error("Pontuação deve estar entre 0 e 100");
  }

  try {
    // Buscar a graduação e popular o estudante associado
    const graduation = await Graduation.findById(id).populate({
      path: "student",
      select: "name belt", // Garantir que estamos buscando os campos corretos
    });

    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    // Verificar se a graduação já foi avaliada
    if (graduation.evaluated) {
      throw new Error("Esta graduação já foi avaliada");
    }

    const student = graduation.student;
    if (!student) {
      throw new Error("Nenhum estudante associado a esta graduação");
    }

    // Buscar o instrutor pelo ID para obter seu nome
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      throw new Error("Instrutor não encontrado");
    }

    const instructorName = instructor.name;

    // Atualizar os dados da graduação
    graduation.score = score;
    graduation.comments = comments;
    graduation.evaluated = true; // Marca a graduação como avaliada
    await graduation.save();

    // Atualizar o cinto do aluno se a pontuação for suficiente
    if (score >= 50) {
      student.belt = graduation.level;
      await student.save();
    }

    // Gerar o PDF do diploma após salvar a graduação
    const diplomaPath = await generateDiploma(graduation, instructorName);
    console.log("Diploma gerado em:", diplomaPath);

    return {
      message: "Graduação avaliada com sucesso",
      graduation,
      diplomaPath, // Adicionando o caminho do diploma ao retorno
    };
  } catch (error) {
    console.error("Erro ao avaliar graduação:", error.message);
    throw new Error("Erro ao avaliar graduação: " + error.message);
  }
}

// 3. Obter Todas as Graduações de um Usuário
async function getUserGraduations(userId) {
  try {
    const graduations = await Graduation.find({ student: userId }).populate(
      "student instructor"
    );
    if (!graduations || graduations.length === 0) {
      throw new Error("Nenhuma graduação encontrada para este usuário.");
    }
    return graduations;
  } catch (error) {
    throw new Error("Erro ao obter graduações: " + error.message);
  }
}

// 4. Obter Graduação por ID
async function getGraduationById(id) {
  try {
    const graduation = await Graduation.findById(id).populate(
      "student instructor"
    );
    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }
    return graduation;
  } catch (error) {
    throw new Error("Erro ao obter graduação: " + error.message);
  }
}

// 5. Atualizar Graduação
async function updateGraduation(id, score, comment = "", certificateUrl = "") {
  if (score < 0 || score > 100) {
    throw new Error("Pontuação deve estar entre 0 e 100");
  }

  try {
    const graduation = await Graduation.findById(id).populate("student");
    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    graduation.score = score;
    graduation.comments = comment;
    if (certificateUrl) {
      graduation.certificateUrl = certificateUrl;
    }
    await graduation.save();

    const student = graduation.student;
    if (!student) {
      throw new Error("Nenhum estudante associado a esta graduação");
    }

    if (score >= 50) {
      student.belt = graduation.level;
      await student.save();
    }

    return {
      message: "Graduação atualizada com sucesso",
    };
  } catch (error) {
    throw new Error(`Erro ao atualizar graduação: ${error.message}`);
  }
}

// 6. Deletar Graduação
async function deleteGraduation(id) {
  try {
    const deletedGraduation = await Graduation.findByIdAndDelete(id);
    if (!deletedGraduation) {
      throw new Error("Graduação não encontrada");
    }
    return {
      message: "Graduação deletada com sucesso",
    };
  } catch (error) {
    throw new Error(`Erro ao deletar graduação: ${error.message}`);
  }
}

module.exports = GraduationController;
