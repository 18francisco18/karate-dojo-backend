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
  unenrollStudentFromGraduation,
  sendGraduationInvitationEmail,
};

// 1. Criar Graduação
async function createGraduation(
  level,
  instructorId,
  location,
  date,
  availableSlots,
  scope = 'internal' // Valor padrão é internal
) {
  try {
    const graduationDate = date || new Date();
    const graduation = new Graduation({
      level,
      instructor: instructorId,
      location,
      date: graduationDate,
      availableSlots,
      scope
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
    // Buscar a graduação e popular os estudantes associados
    const graduation = await Graduation.findById(id)
      .populate('enrolledStudents', 'name belt email')
      .populate('instructor', 'name');

    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    // Verificar se a graduação já foi avaliada
    if (graduation.evaluated) {
      throw new Error("Esta graduação já foi avaliada");
    }

    // Verificar se há estudantes inscritos
    if (!graduation.enrolledStudents || graduation.enrolledStudents.length === 0) {
      throw new Error("Não há estudantes inscritos nesta graduação");
    }

    // Buscar o instrutor que está avaliando
    const evaluatingInstructor = await Instructor.findById(instructorId);
    if (!evaluatingInstructor) {
      throw new Error("Instrutor avaliador não encontrado");
    }

    // Atualizar o status da graduação
    graduation.score = score;
    graduation.comments = comments;
    graduation.evaluated = true;
    graduation.evaluationDate = new Date();
    graduation.evaluatedBy = instructorId;

    // Se a pontuação for >= 50, atualizar o cinto dos estudantes
    if (score >= 50) {
      const beltLevels = ['branco', 'amarelo', 'azul', 'laranja', 'verde', 'roxo', 'castanho', 'preto'];
      const nextBeltIndex = beltLevels.indexOf(graduation.level);

      // Atualizar o cinto de cada estudante e gerar diploma
      const diplomaPaths = [];
      for (const student of graduation.enrolledStudents) {
        if (!student || !student.name) {
          console.error('Estudante inválido:', student);
          continue;
        }

        // Atualizar o cinto do estudante
        await Student.findByIdAndUpdate(student._id, {
          belt: graduation.level,
          lastGraduationDate: new Date()
        });

        // Gerar diploma
        const diplomaPath = await generateDiploma(
          student.name, 
          graduation.level, 
          graduation.evaluationDate,
          evaluatingInstructor.name
        );
        diplomaPaths.push(diplomaPath);

        // Enviar email de parabéns com o diploma
        const emailSubject = "Parabéns pela sua graduação!";
        const emailBody = `
          Olá ${student.name},

          Parabéns por sua graduação para a faixa ${graduation.level}!
          
          Sua avaliação foi concluída com sucesso com uma pontuação de ${score}/100.
          
          Comentários do instrutor ${evaluatingInstructor.name}:
          ${comments}
          
          Seu diploma está anexado a este email.
          
          Atenciosamente,
          Academia de Karatê
        `;

        await sendEmail(student.email, emailSubject, emailBody, [diplomaPath]);
      }

      graduation.diplomaPaths = diplomaPaths;
    }

    await graduation.save();

    return {
      message: score >= 50 ? "Graduação avaliada com sucesso. Estudantes promovidos!" : "Graduação avaliada com reprovação",
      graduation,
      diplomaPaths: graduation.diplomaPaths
    };
  } catch (error) {
    console.error("Erro detalhado:", error);
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
    console.log('Tentando inscrever estudante:', { graduationId, studentId });
    
    // Buscar a graduação
    const graduation = await Graduation.findById(graduationId);
    if (!graduation) {
      throw new Error('Graduação não encontrada');
    }

    // Buscar o estudante
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Estudante não encontrado');
    }

    console.log('Dados encontrados:', {
      student: {
        id: student._id,
        belt: student.belt
      },
      graduation: {
        id: graduation._id,
        level: graduation.level
      }
    });

    // Verificar se o estudante já está inscrito em alguma graduação
    const existingEnrollment = await Graduation.findOne({
      enrolledStudents: studentId,
      _id: { $ne: graduationId }
    });

    if (existingEnrollment) {
      throw new Error('Você já está inscrito em outra graduação. Cancele a inscrição atual antes de se inscrever em uma nova.');
    }

    // Verificar se o estudante já está inscrito nesta graduação
    if (graduation.enrolledStudents.includes(studentId)) {
      throw new Error('Estudante já está inscrito nesta graduação');
    }

    // Verificar se há vagas disponíveis
    if (graduation.availableSlots <= 0) {
      throw new Error('Não há vagas disponíveis nesta graduação');
    }

    // Array com a ordem das faixas
    const beltLevels = ['branco', 'amarelo', 'azul', 'laranja', 'verde', 'roxo', 'castanho', 'preto'];
    
    // Normalizar as faixas para minúsculas
    const studentBelt = student.belt.toLowerCase();
    const graduationLevel = graduation.level.toLowerCase();
    
    // Obter os índices das faixas
    const currentBeltIndex = beltLevels.indexOf(studentBelt);
    const graduationBeltIndex = beltLevels.indexOf(graduationLevel);

    console.log('Verificando faixas:', {
      studentBelt,
      graduationLevel,
      currentBeltIndex,
      graduationBeltIndex,
      beltLevels
    });

    // Verificar se as faixas são válidas
    if (currentBeltIndex === -1) {
      throw new Error(`Faixa do estudante inválida: ${student.belt}`);
    }
    if (graduationBeltIndex === -1) {
      throw new Error(`Nível da graduação inválido: ${graduation.level}`);
    }

    // Verificar se a graduação é para a próxima faixa
    if (graduationBeltIndex !== currentBeltIndex + 1) {
      const nextBelt = beltLevels[currentBeltIndex + 1];
      throw new Error(
        `Com a faixa ${studentBelt}, você só pode se inscrever em graduações para faixa ${nextBelt}. ` +
        `Esta graduação é para faixa ${graduationLevel}.`
      );
    }

    // Atualizar a graduação em uma única operação atômica
    const vagasAntes = graduation.availableSlots;
    graduation.availableSlots = vagasAntes - 1;
    graduation.enrolledStudents.push(studentId);
    await graduation.save();

    console.log('Atualizando vagas:', {
      vagasAntes: vagasAntes,
      vagasDepois: graduation.availableSlots,
      estudantesInscritos: graduation.enrolledStudents.length
    });

    return graduation;
  } catch (error) {
    console.error('Erro em enrollStudentInGraduation:', error);
    throw error;
  }
}

// Cancelar inscrição de um estudante em uma graduação
async function unenrollStudentFromGraduation(graduationId, studentId) {
  try {
    console.log('Attempting to unenroll student:', { graduationId, studentId });
    
    const graduation = await Graduation.findById(graduationId);
    if (!graduation) {
      throw new Error('Graduação não encontrada');
    }

    // Check if student is enrolled
    const studentIndex = graduation.enrolledStudents.findIndex(id => id.toString() === studentId.toString());
    if (studentIndex === -1) {
      throw new Error('Estudante não está inscrito nesta graduação');
    }

    // Remove student from enrolled students
    graduation.enrolledStudents.splice(studentIndex, 1);
    graduation.availableSlots += 1; // Incrementa o número de vagas disponíveis
    
    // Save the updated graduation
    const updatedGraduation = await graduation.save();
    console.log('Successfully unenrolled student. Updated graduation:', updatedGraduation);
    
    return updatedGraduation;
  } catch (error) {
    console.error('Error in unenrollStudentFromGraduation:', error);
    throw error;
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
