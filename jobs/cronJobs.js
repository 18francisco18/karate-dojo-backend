// jobs/cronJobs.js
const cron = require("node-cron");
const MonthlyFeeController = require("../data/monthlyFees/controller"); // Importando o controller

// Agende o cron job para rodar todos os minutos
cron.schedule("* * * * *", async () => {
  await MonthlyFeeController.updateMonthlyFeeStatus(); // Chama a função do controller
  console.log("Verificação de mensalidades atrasadas realizada.");
});
