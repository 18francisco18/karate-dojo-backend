const MonthlyPlan = require("../../models/monthlyPlan");
const { Student } = require("../../models/user");
const MonthlyFee = require("../../models/monthlyFee");

// Obter todos os planos
async function getAll() {
  try {
    // Lista de planos pré-definidos
    const defaultPlans = [
      {
        _id: "673e4d0b39b8e46bb2fe8da2",
        name: "Basic",
        price: 50,
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
        _id: "673e4d0639b8e46bb2fe8da0",
        name: "Standard",
        price: 100,
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
        _id: "673e4ccc39b8e46bb2fe8d9d",
        name: "Premium",
        price: 150,
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

    // Para cada plano pré-definido, atualizar ou criar no MongoDB
    for (const planData of defaultPlans) {
      await MonthlyPlan.findOneAndUpdate(
        { _id: planData._id },
        {
          $set: {
            name: planData.name,
            price: planData.price,
            graduationScopes: planData.graduationScopes,
            description: planData.description,
            features: planData.features
          }
        },
        { upsert: true, new: true }
      );
    }

    // Retornar os planos pré-definidos
    return defaultPlans;
  } catch (error) {
    console.error('Erro em getAll:', error);
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

// Associar plano ao estudante
async function associatePlanToStudent(planId, studentId) {
  try {
    console.log("Iniciando associação de plano...");
    console.log("PlanId:", planId);
    console.log("StudentId:", studentId);

    // Verificar se o estudante existe
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Estudante não encontrado");
    }
    console.log("Estudante encontrado:", student);

    // Verificar se o estudante já tem um plano ativo
    if (student.monthlyPlan) {
      throw new Error("Você já tem um plano ativo. Por favor, cancele o plano atual antes de escolher um novo.");
    }

    // Primeiro buscar o plano atualizado
    await getAll();

    // Agora buscar o plano específico
    const plan = await MonthlyPlan.findById(planId);
    if (!plan) {
      throw new Error("Plano não encontrado");
    }
    console.log("Plano encontrado:", plan);

    // Atualizar o plano do estudante
    student.monthlyPlan = plan._id;
    await student.save();

    // Adicionar estudante à lista de estudantes do plano
    if (!plan.students.includes(student._id)) {
      plan.students.push(student._id);
      await plan.save();
    }

    // Criar a mensalidade para o mês atual
    const now = new Date();
    const monthlyFee = new MonthlyFee({
      student: studentId,
      plan: planId,
      amount: plan.price,
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), // Vence no dia 5 do próximo mês
      status: "pending",
    });

    await monthlyFee.save();

    return { message: "Plano associado com sucesso", plan };
  } catch (error) {
    console.warn("Erro completo:", error);
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

// Obter plano ativo do estudante
async function getActivePlan(studentId) {
  try {
    console.log('Buscando plano para estudante:', studentId);

    // Primeiro buscar o ID do plano do estudante
    const student = await Student.findById(studentId)
      .select('monthlyPlan')
      .lean();

    console.log('Estudante encontrado:', student);

    if (!student || !student.monthlyPlan) {
      console.log('Estudante não tem plano associado');
      return null;
    }

    // Buscar o plano da lista de planos pré-definidos
    const plans = await getAll();
    console.log('Planos disponíveis:', plans);
    console.log('ID do plano do estudante:', student.monthlyPlan);

    const plan = plans.find(p => p._id.toString() === student.monthlyPlan.toString());
    console.log('Plano encontrado:', plan);

    if (!plan) {
      console.log('Plano não encontrado');
      return null;
    }

    return plan;
  } catch (error) {
    console.error("Erro ao buscar plano ativo:", error);
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
    const student = await Student.findById(studentId);
    if (!student || !student.monthlyPlan) {
      throw new Error("Estudante não possui plano ativo para cancelar");
    }

    const planId = student.monthlyPlan;

    // Remover estudante do array de estudantes do plano
    await MonthlyPlan.findByIdAndUpdate(
      planId,
      { $pull: { students: studentId } }
    );

    // Remover referência do plano no estudante
    student.monthlyPlan = null;
    await student.save();

    return { message: "Plano cancelado com sucesso" };
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
