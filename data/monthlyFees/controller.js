// controllers/monthlyFeeController.js
const MonthlyFee = require("../../models/monthlyFee");
const Student = require("../../models/user").Student;
const sendEmail = require("../../utils/sendEmail"); // Assumindo que existe um módulo para enviar e-mails
const { generateReceipt } = require("../../pdfs/pdfService"); // Assumindo que existe um módulo para gerar recibos
const Instructor = require("../../models/user").Instructor;

const MonthlyFeeController = {
  createMonthlyFee,
  updateMonthlyFeeStatus,
  markMonthlyFeeAsPaid,
  notifyOverdueMonthlyFee,
  manuallyUnsuspendStudent,
  getAllMonthlyFees,
  hasUnpaidFees,
  getFilteredMonthlyFees
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
      student: studentId, // Alterado de user para student
      amount: price,
      status: "pending", // Alterado para o novo padrão de status
      dueDate: dueDate,
      startDate: new Date(),
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
    // Encontra todas as mensalidades com a data de vencimento passada e com status diferente de 'paid'
    const overdueFees = await MonthlyFee.find({
      dueDate: { $lt: currentDate },
      status: { $ne: "paid" },
    });

    // Atualiza o status das mensalidades vencidas para 'late' e suspende o aluno automaticamente
    for (let fee of overdueFees) {
      fee.status = "late";
      await fee.save();

      // Enviar um aviso por e-mail ao aluno
      await notifyOverdueMonthlyFee(fee);

      // Suspender o aluno automaticamente
      const student = await Student.findById(fee.student);
      if (student && !student.suspended) {
        student.suspended = true;
        await student.save();
        console.log(
          `Aluno com ID ${student._id} foi suspenso automaticamente.`
        );
      }
    }

    console.log(
      `Status atualizado para "late" em ${overdueFees.length} mensalidades.`
    );
  } catch (error) {
    console.error("Erro ao atualizar mensalidades:", error.message);
  }
}

// Função para marcar a mensalidade como paga
async function markMonthlyFeeAsPaid(monthlyFeeId, paymentMethod) {
  try {
    if (!paymentMethod) {
      throw new Error("Método de pagamento é obrigatório");
    }

    // Encontra a mensalidade pelo ID e popula os dados do aluno e instrutor
    const monthlyFee = await MonthlyFee.findById(monthlyFeeId)
      .populate("student")
      .populate({
        path: "student",
        populate: {
          path: "instructor",
          select: "name email"
        }
      });

    if (!monthlyFee) {
      throw new Error("Mensalidade não encontrada");
    }

    // Verifica se o status não é "paid" antes de atualizar
    if (monthlyFee.status === "paid") {
      throw new Error("Esta mensalidade já está paga");
    }

    // Atualiza o status, método de pagamento e a data de pagamento
    monthlyFee.status = "paid";
    monthlyFee.paymentMethod = paymentMethod;
    monthlyFee.paymentDate = new Date();
    await monthlyFee.save();

    // Se o aluno estiver suspenso e não tiver outras mensalidades atrasadas, remove a suspensão
    const student = await Student.findById(monthlyFee.student);
    if (student && student.suspended) {
      const hasOverdueFees = await MonthlyFee.exists({
        student: student._id,
        status: "late",
        _id: { $ne: monthlyFeeId }
      });

      if (!hasOverdueFees) {
        student.suspended = false;
        await student.save();
        console.log(`Suspensão removida do aluno ${student._id}`);
      }
    }

    // Gera o recibo de pagamento
    let receiptPath;
    try {
      const instructorName = monthlyFee.student.instructor ? monthlyFee.student.instructor.name : "Instrutor Responsável";
      receiptPath = await generateReceipt(
        {
          ...monthlyFee.toObject(),
          user: monthlyFee.student // Adaptando para o formato esperado pelo generateReceipt
        }, 
        instructorName
      );
      console.log(`Recibo gerado em: ${receiptPath}`);
      
      // Salva o caminho do recibo na mensalidade
      monthlyFee.receiptPath = receiptPath;
      await monthlyFee.save();
      console.log('Mensalidade atualizada com receiptPath:', monthlyFee);
    } catch (error) {
      console.error("Erro ao gerar recibo:", error.message);
      // Não interrompe o fluxo se houver erro na geração do recibo
    }

    // Busca a mensalidade atualizada para garantir que todos os campos estão presentes
    const updatedMonthlyFee = await MonthlyFee.findById(monthlyFee._id)
      .populate({
        path: "student",
        select: "name email instructor",
        populate: {
          path: "instructor",
          select: "name email"
        }
      });

    console.log('Mensalidade atualizada retornada:', updatedMonthlyFee);
    
    return {
      message: "Mensalidade marcada como paga com sucesso",
      monthlyFee: updatedMonthlyFee,
      receiptPath
    };
  } catch (error) {
    console.error("Erro ao marcar mensalidade como paga:", error.message);
    throw error;
  }
}

// Função para notificar o aluno sobre uma mensalidade atrasada
async function notifyOverdueMonthlyFee(monthlyFee) {
  try {
    const student = await Student.findById(monthlyFee.student);
    if (!student || !student.email) {
      throw new Error("E-mail do aluno não encontrado");
    }

    const subject = "Aviso de Mensalidade Atrasada";
    const text = `Prezado(a) ${student.name},\n\nSua mensalidade com vencimento em ${monthlyFee.dueDate.toLocaleDateString()} está atrasada.\nValor: € ${monthlyFee.amount}\n\nPor favor, regularize o pagamento o mais breve possível para evitar a suspensão dos serviços.\n\nAtenciosamente,\nEquipe do Dojo`;

    await sendEmail(student.email, subject, text);
    console.log(`E-mail de aviso enviado para ${student.email}`);
  } catch (error) {
    console.error("Erro ao enviar notificação:", error.message);
  }
}

// Função para retirar manualmente a suspensão do aluno
async function manuallyUnsuspendStudent(studentId) {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado");
    }

    if (!student.suspended) {
      throw new Error("O aluno não está suspenso");
    }

    student.suspended = false;
    await student.save();

    return {
      message: "Suspensão removida com sucesso",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        suspended: student.suspended,
      },
    };
  } catch (error) {
    console.error("Erro ao remover suspensão:", error.message);
    throw error;
  }
}

// Função para obter todas as mensalidades
async function getAllMonthlyFees() {
  try {
    const monthlyFees = await MonthlyFee.find()
      .populate({
        path: "student",
        select: "name email instructor",
        populate: {
          path: "instructor",
          select: "name email"
        }
      })
      .select('student amount dueDate status paymentDate paymentMethod receiptPath')
      .sort({ dueDate: -1 });

    return monthlyFees;
  } catch (error) {
    console.error("Erro ao buscar mensalidades:", error.message);
    throw error;
  }
}

// Função para verificar se o aluno tem mensalidades pendentes
async function hasUnpaidFees(studentId) {
  try {
    const unpaidFees = await MonthlyFee.find({
      student: studentId,
      status: { $in: ['pending', 'late'] }
    });
    return unpaidFees.length > 0;
  } catch (error) {
    console.error("Erro ao verificar mensalidades pendentes:", error.message);
    throw error;
  }
}

// Nova função para filtrar mensalidades
async function getFilteredMonthlyFees(filters = {}) {
  try {
    let query = {};
    const currentDate = new Date();

    // Handle status filter
    if (filters.status === 'overdue') {
      query.status = 'pending';
      query.dueDate = { $lt: currentDate };
    } else if (filters.status === 'pending') {
      query.status = 'pending';
      query.dueDate = { $gte: currentDate };
    } else if (filters.status) {
      query.status = filters.status;
    }

    // Handle date filters only if not filtering by overdue status
    if (filters.status !== 'overdue' && (filters.dueDateStart || filters.dueDateEnd)) {
      query.dueDate = query.dueDate || {};
      if (filters.dueDateStart) {
        query.dueDate.$gte = new Date(filters.dueDateStart);
      }
      if (filters.dueDateEnd) {
        query.dueDate.$lte = new Date(filters.dueDateEnd);
      }
    }

    // Handle amount filters
    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) {
        query.amount.$gte = Number(filters.minAmount);
      }
      if (filters.maxAmount) {
        query.amount.$lte = Number(filters.maxAmount);
      }
    }

    // Handle payment method
    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    console.log('Query:', JSON.stringify(query, null, 2)); // Debug log

    const monthlyFees = await MonthlyFee.find(query)
      .populate({
        path: "student",
        select: "name email instructor",
        populate: {
          path: "instructor",
          select: "name email"
        }
      })
      .select('student amount dueDate status paymentDate paymentMethod receiptPath')
      .sort({ dueDate: -1 });

    return monthlyFees;
  } catch (error) {
    console.error("Erro ao filtrar mensalidades:", error);
    throw error;
  }
}

module.exports = {
  createMonthlyFee,
  updateMonthlyFeeStatus,
  markMonthlyFeeAsPaid,
  notifyOverdueMonthlyFee,
  manuallyUnsuspendStudent,
  getAllMonthlyFees,
  hasUnpaidFees,
  getFilteredMonthlyFees
};
