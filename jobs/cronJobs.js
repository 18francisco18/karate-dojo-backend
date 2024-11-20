// jobs/cronJobs.js
const cron = require("node-cron");
const MonthlyFeeController = require("../data/monthlyFees/controller");

// Agende o cron job para rodar a cada minuto
cron.schedule("* * * * *", async () => {
  try {
    console.log("Iniciando verificação de mensalidades...");
    await MonthlyFeeController.updateMonthlyFeeStatus();
    console.log("Verificação de mensalidades concluída com sucesso.");
  } catch (error) {
    console.error("Erro ao verificar mensalidades:", error);
  }
});
