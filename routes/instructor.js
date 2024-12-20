router.get("/monthly-fees", async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      dueDateStart: req.query.dueDateStart,
      dueDateEnd: req.query.dueDateEnd,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      paymentMethod: req.query.paymentMethod
    };

    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    // Se não houver filtros, usa getAllMonthlyFees, caso contrário usa getFilteredMonthlyFees
    const monthlyFees = Object.keys(filters).length === 0 
      ? await MonthlyFeeController.getAllMonthlyFees()
      : await MonthlyFeeController.getFilteredMonthlyFees(filters);

    res.status(200).json({ data: monthlyFees });
  } catch (error) {
    console.error("Erro ao buscar mensalidades:", error);
    res.status(500).json({ error: error.message });
  }
}); 