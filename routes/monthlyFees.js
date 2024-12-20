const express = require('express');
const router = express.Router();
const MonthlyFeeController = require('../data/monthlyFees/controller');
const authMiddleware = require('../middleware/token');

router.get('/filtered', authMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      dueDateStart: req.query.dueDateStart,
      dueDateEnd: req.query.dueDateEnd,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      studentId: req.query.studentId,
      paymentMethod: req.query.paymentMethod
    };

    const sort = {
      field: req.query.sortField || 'dueDate',
      order: req.query.sortOrder || 'desc'
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await MonthlyFeeController.getFilteredMonthlyFees(
      filters,
      sort,
      page,
      limit
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao filtrar mensalidades:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 