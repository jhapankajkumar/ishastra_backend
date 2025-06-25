const prisma = require('../db');

exports.getAllTactics = async (req, res) => {
  const tactics = await prisma.exit_tactics.findMany();
  res.json(tactics);
};

exports.createTactic = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const tactic = await prisma.exit_tactics.create({
      data: { name, description }
    });

    res.status(201).json(tactic);
  } catch (error) {
    console.error('Error creating tactic:', error);
    res.status(500).json({ error: 'Failed to create tactic' });
  }
};
