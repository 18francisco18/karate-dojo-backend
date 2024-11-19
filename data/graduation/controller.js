// controllers/graduationController.js
const { Instructor, Student } = require("../../models/user");
const Graduation = require("../../models/graduation");
const { generateDiploma } = require("../../pdfs/pdfService"); // Importando o serviço de PDF
const sendEmail = require("../../utils/sendEmail");

const GraduationController = {
  createGraduation,
  getAllGraduations,
  evaluateGraduation,
  getUserGraduations,
  getGraduationById,
  updateGraduation,
  deleteGraduation,
  enrollStudentInGraduation,
  sendGraduationInvitationEmail,
};

// 1. Criar Graduação
async function createGraduation(
  level,
  instructorId,
  location,
  date,
  availableSlots
) {
  try {
    const graduationDate = date || new Date();
    const graduation = new Graduation({
      level,
      instructor: instructorId,
      location,
      date: graduationDate,
      availableSlots,
    });

    await graduation.save();

    return { message: "Graduação criada com sucesso", graduation };
  } catch (error) {
    throw new Error("Erro ao criar graduação: " + error.message);
  }
}

async function getAllGraduations(
  filters = {},
  sort = {},
  page = 1,
  limit = 10
) {
  try {
    // Aplicando filtros
    let query = {};

    // Filtro por cor do cinto (graduação)
    if (filters.beltColor) {
      query.level = filters.beltColor;
    }

    // Filtro por data da graduação
    if (filters.date) {
      query.date = { $gte: new Date(filters.date) };
    }

    // Filtro por vagas disponíveis
    if (filters.availableSlots) {
      query.availableSlots = { $gte: parseInt(filters.availableSlots) };
    }

    // Ordenação - Definir as chaves e a ordem (ascendente ou descendente)
    let sortOptions = {};
    if (sort.field && sort.order) {
      const order = sort.order.toLowerCase() === "desc" ? -1 : 1;
      sortOptions[sort.field] = order;
    }

    // Definindo paginação
    const skip = (page - 1) * limit;

    // Executar consulta com filtros, ordenação e paginação
    const graduations = await Graduation.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Contar o total de documentos para fins de paginação
    const totalGraduations = await Graduation.countDocuments(query);

    return {
      currentPage: page,
      totalPages: Math.ceil(totalGraduations / limit),
      totalItems: totalGraduations,
      graduations,
    };
  } catch (error) {
    throw new Error("Erro ao obter graduações: " + error.message);
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

// 3. Obter Todas as Graduações de um Usuário com Paginação
async function getUserGraduations(userId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const graduations = await Graduation.find({ student: userId })
      .populate("student instructor")
      .skip(skip)
      .limit(limit);

    if (!graduations || graduations.length === 0) {
      throw new Error("Nenhuma graduação encontrada para este usuário.");
    }

    const totalGraduations = await Graduation.countDocuments({
      student: userId,
    });

    return {
      currentPage: page,
      totalPages: Math.ceil(totalGraduations / limit),
      totalItems: totalGraduations,
      graduations,
    };
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

// 7. Inscrever Estudante em uma Graduação
async function enrollStudentInGraduation(graduationId, studentId) {
  try {
    const graduation = await Graduation.findById(graduationId);
    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    if (!graduation.canEnroll()) {
      throw new Error("Não há vagas disponíveis para esta graduação");
    }

    graduation.enrolledStudents.push(studentId);
    await graduation.save();

    return {
      message: "Estudante inscrito com sucesso na graduação",
      graduation,
    };
  } catch (error) {
    throw new Error(`Erro ao inscrever estudante: ${error.message}`);
  }
}

async function sendGraduationInvitationEmail(studentEmail, graduation) {
  try {
    const subject = "Convite para inscrição na graduação";
    const link = `http://localhost:5000/student/graduations/${graduation._id}/enroll`;
    const message = `Olá, você foi convidado para se inscrever na graduação de nível ${graduation.level} que acontecerá em ${graduation.date}. Clique no link para se inscrever: ${link}`;

    await sendEmail(studentEmail, subject, message);
    return "Email enviado com sucesso.";
  } catch (error) {
    throw new Error("Erro ao enviar email de convite: " + error.message);
  }
}

module.exports = GraduationController;
