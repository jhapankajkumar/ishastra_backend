const prisma = require('../db');

exports.getAllJournals = async (req, res) => {
  const journals = await prisma.weekly_journals.findMany();
  res.json(journals);
};

exports.createJournal = async (req, res) => {
  try {
    const {
      week_start_date,
      week_end_date,
      summary,
      best_trade_id,
      worst_trade_id
    } = req.body;

    if (!week_start_date || !week_end_date || !summary) {
      return res.status(400).json({ error: 'week_start_date, week_end_date, and summary are required' });
    }

    const journal = await prisma.weekly_journals.create({
      data: {
        week_start_date: new Date(week_start_date),
        week_end_date: new Date(week_end_date),
        summary,
        best_trade_id,
        worst_trade_id
      }
    });

    res.status(201).json(journal);
  } catch (error) {
    console.error('Error creating journal:', error);
    res.status(500).json({ error: 'Failed to create journal' });
  }
};
