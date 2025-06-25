const prisma = require('../db');

exports.getAllTags = async (req, res) => {
  const tags = await prisma.tags.findMany();
  res.json(tags);
};

exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    const tag = await prisma.tags.create({
      data: { name }
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};
