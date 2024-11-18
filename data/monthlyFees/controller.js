// controllers/monthlyFeeController.js
const MonthlyFee = require("../../models/monthlyFee");
const Student = require("../../models/user").Student;
const sendEmail = require("../../utils/sendEmail"); // Assumindo que existe um módulo para enviar e-mails

const MonthlyFeeController = {
  createMonthlyFee,
  updateMonthlyFeeStatus,
  markMonthlyFeeAsPaid,
  notifyOverdueMonthlyFee,
  suspendStudent,
};

// Função para criar uma mensalidade
async function createMonthlyFee(studentId, price, dueDateOverride = null) {
  try {
    const dueDate = dueDateOverride
      ? new Date(dueDateOverride)
      : new Date("2024-10-10");
    if (!dueDateOverride) {
      dueDate.setMonth(dueDate.getMonth() + 1); // Definindo a data de vencimento para o próximo mês
    }

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

      // Enviar um aviso por e-mail ao aluno
      await notifyOverdueMonthlyFee(fee);
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

// Função para notificar o aluno sobre uma mensalidade atrasada
async function notifyOverdueMonthlyFee(monthlyFee) {
  try {
    // Busca os detalhes do aluno
    const student = await Student.findById(monthlyFee.user);
    if (!student) {
      throw new Error("Aluno não encontrado");
    }

    // Conteúdo do e-mail
    const subject = "Aviso de Mensalidade Atrasada";
    const message = `Olá ${student.name},

Sua mensalidade no valor de R$${
      monthlyFee.amount
    } está atrasada desde ${monthlyFee.dueDate.toLocaleDateString()}. Por favor, regularize o pagamento o mais rápido possível para evitar problemas com sua inscrição.

Obrigado,
Equipe da Academia`;

    // Envia o e-mail
    await sendEmail(student.email, subject, message);
    console.log(`E-mail de aviso enviado para ${student.email}`);
  } catch (error) {
    console.error(
      "Erro ao enviar aviso de mensalidade atrasada:",
      error.message
    );
  }
}

// Função para suspender o aluno
async function suspendStudent(studentId) {
  try {
    // Busca os detalhes do aluno
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado");
    }

    // Atualiza o status de suspensão do aluno
    student.suspended = true;
    await student.save();

    console.log(`Aluno com ID ${studentId} foi suspenso.`);
    return student;
  } catch (error) {
    console.error("Erro ao suspender aluno:", error.message);
    throw error;
  }
}

module.exports = MonthlyFeeController;
