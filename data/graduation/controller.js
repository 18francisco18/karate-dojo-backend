// controllers/graduationController.js
const Graduation = require("../../models/graduation");
const User = require("../../models/user");
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
async function createGraduation(userId, level, instructorId, location, date) {
  try {
    const graduationDate = date || new Date();
    const graduation = new Graduation({
      user: userId,
      level: level,
      instructor: instructorId,
      location: location,
      date: graduationDate,
    });

    await graduation.save();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    user.graduation.push(graduation._id);
    await user.save();

    return { message: "Graduação criada com sucesso", graduation };
  } catch (error) {
    throw new Error("Erro ao criar graduação: " + error.message);
  }
}

// 2. Avaliar Graduação
async function evaluateGraduation(id, score, comments) {
  if (score < 0 || score > 100) {
    throw new Error("Pontuação deve estar entre 0 e 100");
  }

  try {
    const graduation = await Graduation.findById(id)
      .populate("user")
      .populate("instructor");

    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    const user = graduation.user;
    if (!user || !user.name) {
      throw new Error("Dados do usuário estão incompletos");
    }

    graduation.score = score;
    graduation.comments = comments;
    await graduation.save();

    if (score >= 50) {
      user.belt = graduation.level;
      await user.save();

      // Gerar diploma após avaliação bem-sucedida
      const diplomaPath = await generateDiploma(graduation);
      console.log(`Diploma gerado em: ${diplomaPath}`);
    }

    return {
      message: "Graduação avaliada com sucesso",
      graduation,
    };
  } catch (error) {
    console.error("Erro ao avaliar graduação:", error.message);
    throw new Error("Erro ao avaliar graduação: " + error.message);
  }
}

// 3. Obter Todas as Graduações de um Usuário
async function getUserGraduations(userId) {
  try {
    const graduations = await Graduation.find({ user: userId }).populate(
      "user instructor"
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
      "user instructor"
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
    const graduation = await Graduation.findById(id);
    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    graduation.score = score;
    graduation.comments = comment;
    if (certificateUrl) {
      graduation.certificateUrl = certificateUrl;
    }
    await graduation.save();

    const user = await User.findById(graduation.user);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (score >= 50) {
      user.belt = graduation.level;
      await user.save();
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
