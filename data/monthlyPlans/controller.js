const MonthlyPlan = require("../../models/monthlyPlan");
const { Student } = require("../../models/user");
const MonthlyFee = require("../../models/monthlyFee");

// Obter todos os planos
async function getAll() {
  try {
    return [
      {
        name: "Basic",
        price: 29.99,
        graduationScopes: ["internal"],
        description: "Perfeito para começar sua jornada no karate",
        features: [
          "2 aulas por semana",
          "Uniforme básico incluso",
          "Acesso à área de treino livre",
          "Participação em eventos internos"
        ]
      },
      {
        name: "Standard",
        price: 49.99,
        graduationScopes: ["internal", "regional"],
        description: "Para alunos dedicados que buscam evolução constante",
        features: [
          "3 aulas por semana",
          "Uniforme premium incluso",
          "Acesso à área de treino livre",
          "Participação em competições regionais"
        ]
      },
      {
        name: "Premium",
        price: 79.99,
        graduationScopes: ["internal", "regional", "national"],
        description: "Treinamento intensivo para verdadeiros guerreiros",
        features: [
          "Aulas ilimitadas",
          "Kit completo de equipamentos",
          "Treinos personalizados",
          "Participação em competições nacionais"
        ]
      }
    ];
  } catch (error) {
    throw new Error("Erro ao obter planos: " + error.message);
  }
}

// Obter plano por ID
async function getById(id) {
  try {
    const plan = await MonthlyPlan.findById(id);
    if (!plan) {
      throw new Error("Plano não encontrado");
    }
    return plan;
  } catch (error) {
    throw new Error("Erro ao obter plano: " + error.message);
  }
}

// Criar um novo plano (template)
async function createPlan(name, price, graduationScopes) {
  try {
    // Criar o plano template (sem associação com estudante)
    const plan = new MonthlyPlan({
      name,
      price,
      graduationScopes
    });

    await plan.save();
    return {
      message: "Plano criado com sucesso",
      plan
    };
  } catch (error) {
    throw new Error("Erro ao criar plano: " + error.message);
  }
}

// Associar um plano a um estudante
async function associatePlanToStudent(planId, studentId) {
  try {
    // Verificar se o estudante existe
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Estudante não encontrado");
    }

    // Verificar se o estudante já tem um plano ativo
    if (student.monthlyPlan) {
      throw new Error("Você já tem um plano ativo. Por favor, cancele o plano atual antes de escolher um novo.");
    }

    // Obter o plano template
    const templatePlan = await MonthlyPlan.findById(planId);
    if (!templatePlan) {
      throw new Error("Plano não encontrado");
    }

    // Verificar se é um plano template (sem usuário associado)
    if (templatePlan.user) {
      throw new Error("Plano inválido. Por favor, escolha um plano da lista de planos disponíveis.");
    }

    // Criar uma cópia do plano para o estudante
    const studentPlan = new MonthlyPlan({
      user: studentId,
      name: templatePlan.name,
      price: templatePlan.price,
      graduationScopes: templatePlan.graduationScopes
    });

    await studentPlan.save();

    // Atualizar o plano do estudante
    student.monthlyPlan = studentPlan._id;
    await student.save();

    // Criar a mensalidade para o mês atual
    const now = new Date();
    const monthlyFee = new MonthlyFee({
      student: studentId,
      plan: studentPlan._id,
      amount: templatePlan.price,
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), // Vence no dia 5 do próximo mês
      status: "pending"
    });

    await monthlyFee.save();

    return {
      message: "Plano associado com sucesso",
      plan: studentPlan,
      monthlyFee
    };
  } catch (error) {
    throw new Error("Erro ao associar plano: " + error.message);
  }
}

// Obter todos os planos de um estudante
async function getStudentPlans(studentId) {
  try {
    const plans = await MonthlyPlan.find({ user: studentId }).sort({ createdAt: -1 });
    return plans;
  } catch (error) {
    throw new Error("Erro ao buscar planos: " + error.message);
  }
}

// Obter plano ativo de um estudante
async function getActivePlan(studentId) {
  try {
    const plan = await MonthlyPlan.findOne({ user: studentId }).sort({ createdAt: -1 });
    return plan;
  } catch (error) {
    throw new Error("Erro ao buscar plano ativo: " + error.message);
  }
}

// Atualizar um plano
async function updatePlan(planId, price, graduationScopes) {
  try {
    const plan = await MonthlyPlan.findById(planId);
    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    // O nome do plano não pode ser alterado
    if (price) plan.price = price;
    if (graduationScopes) plan.graduationScopes = graduationScopes;

    await plan.save();
    return {
      message: "Plano atualizado com sucesso",
      plan
    };
  } catch (error) {
    throw new Error("Erro ao atualizar plano: " + error.message);
  }
}

// Remover um plano
async function deletePlan(id) {
  try {
    const plan = await MonthlyPlan.findById(id);
    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    // Se o plano estiver associado a um estudante, remover a referência
    if (plan.user) {
      const student = await Student.findById(plan.user);
      if (student) {
        student.monthlyPlan = null;
        await student.save();
      }
    }

    await plan.deleteOne();
    return { message: "Plano removido com sucesso" };
  } catch (error) {
    throw new Error("Erro ao remover plano: " + error.message);
  }
}

// Cancelar plano ativo de um estudante
async function cancelActivePlan(studentId) {
  try {
    // Buscar estudante com o plano atual
    const student = await Student.findById(studentId).populate('monthlyPlan');
    if (!student) {
      throw new Error("Estudante não encontrado");
    }

    // Verificar se tem plano ativo
    if (!student.monthlyPlan) {
      throw new Error("Estudante não possui plano ativo para cancelar");
    }

    // Buscar mensalidade pendente
    const pendingFee = await MonthlyFee.findOne({
      student: studentId,
      status: "pending"
    });

    if (pendingFee) {
      pendingFee.status = "cancelled";
      await pendingFee.save();
    }

    // Remover referência do plano no estudante
    student.monthlyPlan = null;
    await student.save();

    return {
      message: "Plano cancelado com sucesso",
      student: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    };
  } catch (error) {
    throw new Error("Erro ao cancelar plano: " + error.message);
  }
}

module.exports = {
  getAll,
  getById,
  createPlan,
  associatePlanToStudent,
  getStudentPlans,
  getActivePlan,
  updatePlan,
  deletePlan,
  cancelActivePlan
};
