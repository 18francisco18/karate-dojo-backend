const MonthlyPlan = require("../../models/monthlyPlan");
const { Student, Instructor } = require("../../models/user"); // Importando o modelo Student
const Graduation = require("../../models/graduation");
const MonthlyFeeController = require("../monthlyFees/controller");

const StudentController = {
  getAvailablePlans,
  choosePlan,
  getStudentDetails,
  enrollInGraduation,
  chooseInstructor,
};

// Função para obter os planos disponíveis
async function getAvailablePlans() {
  try {
    // Aqui você pode pegar planos pré-definidos ou consultar planos no banco de dados
    const plans = [
      { type: "Basic", price: 50 },
      { type: "Standard", price: 100 },
      { type: "Premium", price: 150 },
    ];
    return plans;
  } catch (error) {
    throw new Error("Erro ao buscar planos disponíveis: " + error.message);
  }
}

async function enrollInGraduation(studentId, graduationId) {
  try {
    // Busca o aluno pelo ID
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado.");
    }

    // Busca a graduação pelo ID
    const graduation = await Graduation.findById(graduationId);
    if (!graduation) {
      throw new Error("Graduação não encontrada.");
    }

    // Verifica se o aluno já está inscrito nesta graduação
    if (graduation.student && graduation.student.toString() === studentId) {
      throw new Error("Aluno já está inscrito nesta graduação.");
    }

    // Associa o aluno à graduação
    graduation.student = studentId;
    await graduation.save();

    // Garante que student.graduation seja um array
    if (!Array.isArray(student.graduation)) {
      student.graduation = [];
    }

    // Adiciona a graduação ao aluno se ela ainda não estiver associada
    if (!student.graduation.includes(graduationId)) {
      student.graduation.push(graduationId);
    }

    await student.save();

    // Retorna a confirmação da inscrição
    return {
      message: "Inscrição na graduação realizada com sucesso",
      graduation,
    };
  } catch (error) {
    console.error("Erro ao inscrever aluno na graduação:", error.message);
    throw new Error("Erro ao inscrever aluno na graduação: " + error.message);
  }
}

async function choosePlan(studentId, planType) {
  try {
    // Encontra o aluno
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado.");
    }

    // Verifica se o aluno já tem um plano
    if (student.monthlyPlan && student.monthlyPlan.length > 0) {
      throw new Error("O aluno já tem um plano associado.");
    }

    // Define o valor do plano com base no tipo
    let price = 0;
    let planTypeName = "";
    switch (planType) {
      case "Basic":
        price = 50;
        planTypeName = "Basic";
        break;
      case "Standard":
        price = 100;
        planTypeName = "Standard";
        break;
      case "Premium":
        price = 150;
        planTypeName = "Premium";
        break;
      default:
        throw new Error("Tipo de plano inválido.");
    }

    // Cria um documento para o plano (monthlyPlan)
    const newPlan = new MonthlyPlan({
      type: planTypeName,
      price: price,
      user: studentId, // Associando o plano ao aluno
    });

    // Salva o plano no banco de dados
    await newPlan.save();

    // Adiciona o plano ao campo monthlyPlan do aluno
    student.monthlyPlan = student.monthlyPlan || []; // Garante que monthlyPlan seja um array
    student.monthlyPlan.push(newPlan._id); // Aqui estamos adicionando o ObjectId do plano

    // Salva o aluno com o plano
    await student.save();

    // Retorna o plano escolhido
    return {
      message: "Plano escolhido com sucesso",
      plan: newPlan,
    };
  } catch (error) {
    console.error("Erro ao escolher plano:", error.message);
    throw error;
  }
}

async function getStudentDetails(studentId) {
  try {
    const student = await Student.findById(studentId) // Alterado para usar Student
      .populate("monthlyPlan") // Popula o plano mensal do aluno
      .populate("monthlyFee"); // Popula a mensalidade do aluno
    return student;
  } catch (error) {
    throw new Error("Erro ao obter detalhes do aluno: " + error.message);
  }
}

async function chooseInstructor(studentId, instructorId) {
  try {
    console.log("ID do Aluno recebido:", studentId);
    console.log("ID do Instrutor recebido:", instructorId);

    // Buscar aluno pelo ID
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado.");
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

module.exports = StudentController;
