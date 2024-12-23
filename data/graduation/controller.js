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
  getEnrolledGraduations,
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
      .populate('instructor')
      .populate('enrolledStudents')
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

// 2. Avaliar Estudante em uma Graduação
async function evaluateGraduation(graduationId, studentId, score, comments, instructorId) {
  if (score < 0 || score > 100) {
    throw new Error("Pontuação deve estar entre 0 e 100");
  }

  try {
    // Buscar a graduação e popular os estudantes associados
    const graduation = await Graduation.findById(graduationId)
      .populate('enrolledStudents', 'name belt email')
      .populate('instructor', 'name');

    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    // Verificar se o estudante está inscrito
    if (!graduation.enrolledStudents.some(student => student._id.toString() === studentId)) {
      throw new Error("Estudante não está inscrito nesta graduação");
    }

    // Verificar se o estudante já foi avaliado
    const existingEvaluation = graduation.studentEvaluations.find(
      eval => eval.student.toString() === studentId
    );
    if (existingEvaluation) {
      throw new Error("Este estudante já foi avaliado nesta graduação");
    }

    // Buscar o instrutor que está avaliando
    const evaluatingInstructor = await Instructor.findById(instructorId);
    if (!evaluatingInstructor) {
      throw new Error("Instrutor avaliador não encontrado");
    }

    // Buscar o estudante
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Estudante não encontrado");
    }

    let diplomaPath = null;
    // Se aprovado (score >= 50), atualizar o cinto e gerar diploma
    if (score >= 50) {
      // Atualizar o cinto do estudante
      await Student.findByIdAndUpdate(studentId, {
        belt: graduation.level,
        lastGraduationDate: new Date()
      });

      // Gerar diploma
      diplomaPath = await generateDiploma(
        student.name, 
        graduation.level, 
        new Date(),
        evaluatingInstructor.name
      );

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

    // Adicionar a avaliação ao array de avaliações
    graduation.studentEvaluations.push({
      student: studentId,
      score,
      comments,
      evaluatedBy: instructorId,
      evaluationDate: new Date(),
      diplomaPath
    });

    await graduation.save();

    return {
      message: score >= 50 ? 
        `Estudante ${student.name} aprovado e promovido para ${graduation.level}!` : 
        `Estudante ${student.name} não atingiu a pontuação mínima para aprovação.`,
      evaluation: graduation.studentEvaluations[graduation.studentEvaluations.length - 1]
    };
  } catch (error) {
    throw new Error("Erro ao avaliar estudante: " + error.message);
  }
}

// 3. Obter Todas as Graduações de um Usuário com Paginação
async function getUserGraduations(userId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    // Buscar todas as graduações
    const graduations = await Graduation.find()
      .populate('instructor')
      .populate('enrolledStudents')
      .populate('studentEvaluations.student')
      .skip(skip)
      .limit(limit);

    const totalGraduations = await Graduation.countDocuments();

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
    const graduation = await Graduation.findById(id)
      .populate('instructor')
      .populate('enrolledStudents')
      .populate('studentEvaluations.student');
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
    const beltLevels = ['branco', 'amarelo', 'laranja', 'verde', 'azul', 'roxo', 'castanho', 'preto'];
    
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

// Buscar todas as graduações em que um estudante está inscrito
async function getEnrolledGraduations(studentId) {
  try {
    const graduations = await Graduation.find({
      enrolledStudents: studentId
    }).populate('instructor');

    return graduations;
  } catch (error) {
    throw new Error("Erro ao buscar graduações inscritas: " + error.message);
  }
}

async function sendGraduationInvitationEmail(studentEmail, graduation) {
  try {
    const subject = "Convite para inscrição na graduação";
    const link = `http://localhost:3000/student/graduations/${graduation._id}/enroll`; // Updated to frontend URL
    const message = `Olá,

Você foi convidado para se inscrever na graduação de nível ${graduation.level} que acontecerá em ${new Date(graduation.date).toLocaleDateString('pt-BR')}.
    
Para se inscrever, acesse o link: ${link}

Atenciosamente,
Equipe Karate Dojo`;

    console.log('Tentando enviar email para:', studentEmail);
    console.log('Dados da graduação:', {
      id: graduation._id,
      level: graduation.level,
      date: graduation.date
    });

    await sendEmail(studentEmail, subject, message);
    console.log('Email enviado com sucesso para:', studentEmail);
    return "Email enviado com sucesso.";
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    throw new Error(`Erro ao enviar email de convite: ${error.message}`);
  }
}

module.exports = GraduationController;
