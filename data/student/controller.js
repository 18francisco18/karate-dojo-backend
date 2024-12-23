const MonthlyPlan = require("../../models/monthlyPlan");
const { Student, Instructor } = require("../../models/user");
const Graduation = require("../../models/graduation");
const MonthlyFee = require("../../models/monthlyFee");
const MonthlyFeeController = require("../monthlyFees/controller");
const mongoose = require("mongoose");
const monthlyPlanController = require("../monthlyPlans/controller");

const StudentController = {
  getAvailablePlans,
  choosePlan,
  cancelPlan,
  getStudentDetails,
  enrollInGraduation,
  chooseInstructor,
  removeInstructor,
  getCurrentPlan,
  getStudentById,
};

// Função para obter os planos disponíveis
async function getAvailablePlans(req, res) {
  try {
    const plans = await monthlyPlanController.getAll();
    return res.status(200).json(plans);
  } catch (error) {
    console.error("Erro ao buscar planos disponíveis:", error);
    return res.status(400).json({ error: error.message });
  }
}

async function enrollInGraduation(studentId, graduationId) {
  try {
    // Buscar o estudante com seu plano
    const student = await Student.findById(studentId).populate('monthlyPlan');
    if (!student) {
      throw new Error("Estudante não encontrado");
    }

    // Verificar se o estudante tem plano ativo
    if (!student.monthlyPlan) {
      throw new Error("Estudante não possui plano ativo");
    }

    // Verificar se o estudante tem instrutor
    if (!student.instructor) {
      throw new Error("Você precisa escolher um instrutor antes de participar de graduações");
    }

    // Buscar a graduação
    const graduation = await Graduation.findById(graduationId);
    if (!graduation) {
      throw new Error("Graduação não encontrada");
    }

    // Verificar se o estudante tem mensalidade em atraso
    const lateFee = await MonthlyFee.findOne({
      student: studentId,
      status: "late"
    });

    if (lateFee) {
      throw new Error("Estudante possui mensalidade em atraso");
    }

    // Verificar se o escopo da graduação está dentro do plano do estudante
    const planScopes = student.monthlyPlan.graduationScopes;
    const graduationScope = graduation.scope;

    // Definir hierarquia de scopes
    const scopeHierarchy = {
      'internal': 1,
      'regional': 2,
      'national': 3
    };

    // Verificar se o plano permite o escopo da graduação
    const maxPlanScope = Math.max(...planScopes.map(scope => scopeHierarchy[scope] || 0));
    const requiredScope = scopeHierarchy[graduationScope] || 0;

    if (maxPlanScope < requiredScope) {
      throw new Error(
        `Seu plano ${student.monthlyPlan.name} não permite participar de graduações do tipo ${graduationScope}. ` +
        `Seu plano atual permite apenas: ${planScopes.join(', ')}`
      );
    }

    // Verificar se há vagas disponíveis
    if (graduation.enrolledStudents.length >= graduation.availableSlots) {
      throw new Error("Não há vagas disponíveis para esta graduação");
    }

    // Verificar se o estudante já está inscrito
    if (graduation.enrolledStudents.includes(studentId)) {
      throw new Error("Estudante já está inscrito nesta graduação");
    }

    // Verificar se a faixa do estudante é compatível
    const beltLevels = [
      "branco",
      "amarelo",
      "laranja",
      "verde",
      "azul",
      "roxo",
      "castanho",
      "preto"
    ];

    const studentBeltIndex = beltLevels.indexOf(student.belt);
    const graduationBeltIndex = beltLevels.indexOf(graduation.level);

    if (studentBeltIndex === -1 || graduationBeltIndex === -1) {
      throw new Error("Faixa inválida");
    }

    if (studentBeltIndex !== graduationBeltIndex - 1) {
      throw new Error(
        `Faixa atual (${student.belt}) não é adequada para esta graduação (${graduation.level}). ` +
        `Você só pode participar de graduações para o próximo nível.`
      );
    }

    // Adicionar estudante à graduação
    graduation.enrolledStudents.push(studentId);
    await graduation.save();

    // Adicionar graduação ao estudante
    if (!Array.isArray(student.graduation)) {
      student.graduation = [];
    }
    student.graduation.push(graduationId);
    await student.save();

    return {
      message: "Inscrição realizada com sucesso",
      graduation: {
        id: graduation._id,
        level: graduation.level,
        date: graduation.date,
        scope: graduation.scope,
        location: graduation.location,
        availableSlots: graduation.availableSlots - 1
      }
    };
  } catch (error) {
    throw new Error("Erro ao inscrever estudante: " + error.message);
  }
}

async function choosePlan(req, res) {
  try {
    const studentId = req.user.id;
    const planId = req.params.id;

    if (!planId) {
      return res.status(400).json({ error: "ID do plano é obrigatório" });
    }

    const result = await monthlyPlanController.associatePlanToStudent(planId, studentId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao escolher plano:", error);
    return res.status(400).json({ error: error.message });
  }
}

async function cancelPlan(req, res) {
  try {
    const studentId = req.user.id;
    const result = await monthlyPlanController.cancelActivePlan(studentId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao cancelar plano:", error);
    return res.status(400).json({ error: error.message });
  }
}

async function getStudentDetails(studentId) {
  try {
    const student = await Student.findById(studentId)
      .populate("monthlyPlan")
      .populate("monthlyFee")
      .select("+profileImage"); // Explicitly select profileImage field
    
    // Add debug logging
    console.log("Student details:", {
      id: student._id,
      name: student.name,
      profileImage: student.profileImage
    });
    
    return student;
  } catch (error) {
    console.error("Error in getStudentDetails:", error);
    throw new Error("Erro ao obter detalhes do aluno: " + error.message);
  }
}

async function chooseInstructor(studentId, instructorId) {
  try {
    console.log("ID do Aluno recebido:", studentId);
    console.log("ID do Instrutor recebido:", instructorId);

    // Buscar aluno pelo ID
    const student = await Student.findById(studentId).populate('monthlyPlan');
    if (!student) {
      throw new Error("Aluno não encontrado.");
    }

    // Verificar se o aluno tem um plano ativo
    if (!student.monthlyPlan) {
      throw new Error("Você precisa escolher um plano antes de selecionar um instrutor.");
    }

    // Buscar instrutor pelo ID
    const instructor = await Instructor.findById(instructorId).populate(
      "students"
    );
    if (!instructor) {
      throw new Error("Instrutor não encontrado.");
    }

    // Verificar se o aluno já está associado a este instrutor
    if (student.instructor && student.instructor.toString() === instructorId) {
      throw new Error("Você já está associado a este instrutor.");
    }

    // Limitar o número máximo de alunos que um instrutor pode ter
    if (instructor.students.length >= 10) {
      throw new Error("Este instrutor não pode ter mais de 10 alunos.");
    }

    // Associar o aluno ao instrutor
    instructor.students.push(studentId);
    await instructor.save();

    student.instructor = instructorId;
    await student.save();

    return "Instrutor escolhido com sucesso.";
  } catch (error) {
    console.error("Erro ao escolher instrutor:", error.message);
    throw new Error("Erro ao escolher instrutor: " + error.message);
  }
}

async function removeInstructor(studentId) {
  try {
    // Buscar o aluno
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado.");
    }

    // Verificar se o aluno tem um instrutor associado
    if (!student.instructor) {
      throw new Error("Aluno não possui instrutor associado.");
    }

    // Buscar o instrutor atual
    const instructor = await Instructor.findById(student.instructor);
    if (!instructor) {
      throw new Error("Instrutor não encontrado.");
    }

    // Remover o aluno da lista de alunos do instrutor
    const studentIndex = instructor.students.indexOf(studentId);
    if (studentIndex > -1) {
      instructor.students.splice(studentIndex, 1);
      await instructor.save();
    }

    // Remover a referência do instrutor do aluno
    student.instructor = null;
    await student.save();

    return "Instrutor removido com sucesso.";
  } catch (error) {
    throw new Error("Erro ao remover instrutor: " + error.message);
  }
}

// Obter plano atual do estudante
async function getCurrentPlan(req, res) {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId).populate('monthlyPlan');
    
    if (!student) {
      return res.status(404).json({ error: "Estudante não encontrado" });
    }

    if (!student.monthlyPlan) {
      return res.status(200).json(null);
    }

    return res.status(200).json(student.monthlyPlan);
  } catch (error) {
    console.error("Erro ao buscar plano atual:", error);
    return res.status(400).json({ error: error.message });
  }
}

// Buscar estudante por ID
async function getStudentById(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Estudante não encontrado");
    }
    return student;
  } catch (error) {
    throw new Error("Erro ao buscar estudante: " + error.message);
  }
}

module.exports = StudentController;
