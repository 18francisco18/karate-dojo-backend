const MonthlyFee = require("../../models/monthlyFee");
const User = require("../../models/user");

const MonthlyFeeController = {
  createMonthlyFee,
};

// Função para criar uma mensalidade
async function createMonthlyFee(studentId, price) {
  try {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1); // Definindo a data de vencimento para o próximo mês

    // Cria a nova mensalidade
    const newMonthlyFee = new MonthlyFee({
      user: studentId,
      amount: price,
      status: "Pendente", // O status inicial será Pendente
      dueDate: dueDate, // Defina a data de vencimento
      startDate: new Date(), // Data de início
    });

    // Salva a mensalidade no banco de dados
    await newMonthlyFee.save();

    // Retorna a mensalidade criada
    return newMonthlyFee;
  } catch (error) {
    console.error("Erro ao criar mensalidade:", error.message);
    throw error;
  }
}

module.exports = MonthlyFeeController;
