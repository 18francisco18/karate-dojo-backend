// jobs/cronJobs.js
const cron = require("node-cron");
const MonthlyFeeController = require("../data/monthlyFees/controller"); // Importando o controller

// Agende o cron job para rodar todos os dias à meia-noite
cron.schedule("0 0 * * *", async () => {
  await MonthlyFeeController.updateMonthlyFeeStatus(); // Chama a função do controller
  console.log("Verificação de mensalidades atrasadas realizada.");
});
