const prisma = require('../db');

exports.getAllTactics = async (req, res) => {
  try {
    const tactics = await prisma.exit_tactics.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(tactics);
  } catch (error) {
    console.error('Error fetching tactics:', error);
    res.status(500).json({ error: 'Failed to fetch tactics' });
  }
};

exports.getAllSetups = async (req, res) => {
  try {
    const setups = await prisma.trade_setups.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(setups);
  } catch (error) {
    console.error('Error fetching setups:', error);
    res.status(500).json({ error: 'Failed to fetch setups' });
  }
};

exports.createTactic = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Check if tactic already exists
    const existingTactic = await prisma.exit_tactics.findUnique({
      where: { name: name.trim() }
    });

    if (existingTactic) {
      return res.status(409).json({ error: 'Tactic already exists' });
    }

    const tactic = await prisma.exit_tactics.create({
      data: { 
        name: name.trim(), 
        description: description.trim() 
      }
    });

    res.status(201).json(tactic);
  } catch (error) {
    console.error('Error creating tactic:', error);
    res.status(500).json({ error: 'Failed to create tactic' });
  }
};

exports.createSetup = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Setup name is required' });
    }

    // Check if setup already exists
    const existingSetup = await prisma.trade_setups.findUnique({
      where: { name: name.trim() }
    });

    if (existingSetup) {
      return res.status(409).json({ error: 'Setup already exists' });
    }

    const setup = await prisma.trade_setups.create({
      data: { 
        name: name.trim(), 
        description: description?.trim() || null
      }
    });

    res.status(201).json(setup);
  } catch (error) {
    console.error('Error creating setup:', error);
    res.status(500).json({ error: 'Failed to create setup' });
  }
};
