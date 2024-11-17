const Graduation = require("../../models/graduation");
const User = require("../../models/user");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const GraduationController = {
  createGraduation,
  generateDiploma,
  evaluateGraduation,
  getUserGraduations,
  getGraduationById,
  updateGraduation,
  deleteGraduation,
};

// 1. Criar Graduação
async function createGraduation(userId, level, instructorId, location, date) {
  try {
    // Se a data não for fornecida, usa a data atual
    const graduationDate = date || new Date();

    const graduation = new Graduation({
      user: userId,
      level: level,
      instructor: instructorId,
      location: location,
      date: graduationDate, // Usando a data fornecida ou a data atual
    });

    await graduation.save();

    // Após salvar a graduação, adiciona ela à lista de graduações do usuário
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

async function generateDiploma(graduation) {
  return new Promise((resolve, reject) => {
    // Verificar se os campos necessários estão presentes
    if (!graduation.user || !graduation.user.name) {
      return reject(new Error("Dados do usuário estão incompletos"));
    }

    // Continuação da criação do PDF
    const doc = new PDFDocument();
    const dirPath = path.join(__dirname, "../../diplomas");
    const filePath = path.join(dirPath, `${graduation._id}.pdf`);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Adiciona conteúdo ao PDF
    // Adiciona cabeçalho com nome do dojo
    doc.image(path.join(__dirname, "../../assets/logo-ipp.png"), {
      fit: [100, 100],
      align: "center",
      valign: "top",
    });
    doc
      .fontSize(30)
      .font("Helvetica-Bold")
      .text("Cobra Kai Dojo", { align: "center", underline: true });

    doc
      .moveDown()
      .fontSize(25)
      .font("Helvetica-Bold")
      .text(`Diploma de Graduação`, { align: "center" });

    doc
      .moveDown()
      .fontSize(18)
      .font("Helvetica")
      .text(`Certificamos que o aluno ${graduation.user.name.toUpperCase()}`, {
        align: "center",
      })
      .moveDown()
      .text(
        `Alcançou o cinto de nível ${graduation.level.toUpperCase()} com mérito.`,
        { align: "center" }
      )
      .moveDown()
      .text(`Data de Graduação: ${graduation.date.toLocaleDateString()}`, {
        align: "center",
      })
      .moveDown()
      .text(`Emitido no local: ${graduation.location}`, { align: "center" });

    doc
      .moveDown()
      .fontSize(14)
      .text(`Pontuação obtida: ${graduation.score}`, { align: "center" });

    if (graduation.comments) {
      doc
        .moveDown()
        .text(`Comentário: ${graduation.comments}`, { align: "center" });
    }

    // Adiciona assinatura fictícia
    doc
      .moveDown(2)
      .fontSize(16)
      .text("_________________________", { align: "right" })
      .text("Sensei John Kreese", { align: "right" })
      .text("Cobra Kai Dojo", { align: "right" });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (error) => reject(error));
  });
}

// 2. Avaliar Graduação (Atualizar pontuação)
async function evaluateGraduation(id, score, comments) {
  if (score < 0 || score > 100) {
    throw new Error("Pontuação deve estar entre 0 e 100");
  }

  try {
    // Buscar a graduação pelo ID
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

    // Atualizar a pontuação e os comentários da graduação
    graduation.score = score;
    graduation.comments = comments;
    await graduation.save();

    // Atualizar o nível do usuário (belt) se a pontuação for >= 50
    if (score >= 50) {
      user.belt = graduation.level;
      await user.save();

      // Gerar o diploma após a avaliação bem-sucedida
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

async function updateGraduation(id, score, comment = "", certificateUrl = "") {
  // Verificar se a pontuação está dentro do intervalo permitido
  if (score < 0 || score > 100) {
    throw new Error("Pontuação deve estar entre 0 e 100");
  }

  try {
    // Buscar a graduação pelo ID
    const graduation = await Graduation.findById(id);
    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    // Atualizar a pontuação, o comentário e o certificateUrl (se fornecido)
    graduation.score = score;
    graduation.comments = comment;
    if (certificateUrl) {
      graduation.certificateUrl = certificateUrl; // Atualiza o certificateUrl, se fornecido
    }
    await graduation.save();

    // Buscar o usuário relacionado
    const user = await User.findById(graduation.user);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Atualizar o nível (belt) do usuário se a pontuação for >= 50
    if (score >= 50) {
      user.belt = graduation.level; // Atualizar o belt do usuário para o level da graduação
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
