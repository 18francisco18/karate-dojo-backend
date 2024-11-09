const MonthlyPlan = require("../../models/monthlyPlan");
const User = require("../../models/user");
const MonthlyFeeController = require("../monthlyFees/controller");

const StudentController = {
  getAvailablePlans,
  choosePlan,
  getStudentDetails,
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

async function choosePlan(studentId, planType) {
  try {
    // Encontra o aluno
    const student = await User.findById(studentId);
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
    student.monthlyPlan.push(newPlan._id); // Aqui estamos adicionando o ObjectId do plano

    // Cria a mensalidade para o aluno
    const monthlyFee = await MonthlyFeeController.createMonthlyFee(
      studentId,
      price
    );

    // Associa a mensalidade criada ao campo 'monthlyFee' do aluno
    student.monthlyFee.push(monthlyFee._id); // Associando o ID da mensalidade

    // Salva o aluno com o plano e a mensalidade
    await student.save();

    // Retorna o plano e a mensalidade
    return {
      plan: newPlan,
      monthlyFee: monthlyFee,
    };
  } catch (error) {
    console.error("Erro ao escolher plano:", error.message);
    throw error;
  }
}

async function getStudentDetails(studentId) {
  try {
    const student = await User.findById(studentId)
      .populate("monthlyPlan") // Popula o plano mensal do aluno
      .populate("monthlyFee"); // Popula a mensalidade do aluno
    return student;
  } catch (error) {
    throw new Error("Erro ao obter detalhes do aluno: " + error.message);
  }
}

module.exports = StudentController;
