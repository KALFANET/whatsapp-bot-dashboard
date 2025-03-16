const express = require('express');
const router = express.Router();
const { OpeningQuestion } = require('../models'); // ✅ טעינת המודל מה-index.js

// שליפת כל השאלות
router.get('/', async (req, res) => {
  try {
    const questions = await OpeningQuestion.findAll({ where: { isActive: true } });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "❌ Error fetching questions", details: error.message });
  }
});

module.exports = router;