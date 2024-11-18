// controllers/monthlyFeeController.js
const MonthlyFee = require("../../models/monthlyFee");

const MonthlyFeeController = {
  createMonthlyFee,
  updateMonthlyFeeStatus,
  markMonthlyFeeAsPaid,
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

// Função para marcar a mensalidade como paga
async function markMonthlyFeeAsPaid(monthlyFeeId) {
  try {
    // Encontra a mensalidade pelo ID
    const monthlyFee = await MonthlyFee.findById(monthlyFeeId);
    if (!monthlyFee) {
      throw new Error("Mensalidade não encontrada");
    }

    // Verifica se o status não é "Pago" antes de atualizar
    if (monthlyFee.status === "Pago") {
      throw new Error("Esta mensalidade já está paga");
    }

    // Atualiza o status da mensalidade para "Pago"
    monthlyFee.status = "Pago";
    await monthlyFee.save();

    console.log(`Mensalidade com ID ${monthlyFeeId} foi marcada como paga.`);
    return monthlyFee;
  } catch (error) {
    console.error("Erro ao marcar mensalidade como paga:", error.message);
    throw error;
  }
}

module.exports = MonthlyFeeController;
