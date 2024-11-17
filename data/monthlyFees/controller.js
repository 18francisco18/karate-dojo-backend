// controllers/monthlyFeeController.js
const MonthlyFee = require("../../models/monthlyFee");

const MonthlyFeeController = {
  createMonthlyFee,
  updateMonthlyFeeStatus, // Adiciona a função no controller
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

// Função para atualizar o status das mensalidades
async function updateMonthlyFeeStatus() {
  try {
    const currentDate = new Date();
    // Encontra todas as mensalidades com a data de vencimento passada e com status diferente de 'Pago'
    const overdueFees = await MonthlyFee.find({
      dueDate: { $lt: currentDate },
      status: { $ne: "Pago" }, // Exclui as que já estão pagas
    });

    // Atualiza o status das mensalidades vencidas para 'Atrasado'
    for (let fee of overdueFees) {
      fee.status = "Atrasado";
      await fee.save();
    }

    console.log(
      `Status atualizado para "Atrasado" em ${overdueFees.length} mensalidades.`
    );
  } catch (error) {
    console.error("Erro ao atualizar mensalidades:", error.message);
  }
}

module.exports = MonthlyFeeController;
