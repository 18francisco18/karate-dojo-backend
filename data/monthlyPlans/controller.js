const MonthlyPlan = require("../models/monthlyPlans");

const MonthlyPlanController = {
  getPlansByUser,
  updateMonthlyPlan,
  deleteMonthlyPlan,
  getAllMonthlyPlans,
  checkIfUserHasActivePlan,
};

async function getPlansByUser(userId) {
  try {
    const plans = await MonthlyPlan.find({ user: userId });
    if (!plans || plans.length === 0) {
      throw new Error("Este usuário não tem planos mensais.");
    }
    return plans;
  } catch (error) {
    throw new Error("Erro ao buscar planos mensais: " + error.message);
  }
}

async function updateMonthlyPlan(userId, planId, newPlanType) {
  try {
    if (!["Basic", "Standard", "Premium"].includes(newPlanType)) {
      throw new Error("Tipo de plano inválido.");
    }

    const plan = await MonthlyPlan.findOne({ _id: planId, user: userId });
    if (!plan) {
      throw new Error("Plano mensal não encontrado.");
    }

    plan.type = newPlanType;
    plan.price = undefined;

    await plan.save();
    return plan;
  } catch (error) {
    throw new Error("Erro ao atualizar o plano mensal: " + error.message);
  }
}

async function deleteMonthlyPlan(userId, planId) {
  try {
    const plan = await MonthlyPlan.findOneAndDelete({
      _id: planId,
      user: userId,
    });
    if (!plan) {
      throw new Error("Plano mensal não encontrado.");
    }
    return { message: "Plano mensal excluído com sucesso." };
  } catch (error) {
    throw new Error("Erro ao excluir o plano mensal: " + error.message);
  }
}

async function getAllMonthlyPlans() {
  try {
    const plans = await MonthlyPlan.find().populate("user", "name email");
    return plans;
  } catch (error) {
    throw new Error("Erro ao buscar todos os planos mensais: " + error.message);
  }
}

async function checkIfUserHasActivePlan(userId) {
  try {
    const activePlan = await MonthlyPlan.findOne({ user: userId });
    return activePlan !== null;
  } catch (error) {
    throw new Error("Erro ao verificar plano ativo: " + error.message);
  }
}

module.exports = {
  MonthlyPlanController,
};
