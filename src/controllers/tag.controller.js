const prisma = require('../db');

exports.getAllTags = async (req, res) => {
  try {
    const tags = await prisma.tags.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag already exists
    const existingTag = await prisma.tags.findUnique({
      where: { name: name.trim() }
    });

    if (existingTag) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    const tag = await prisma.tags.create({
      data: { 
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await prisma.tags.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.tags.delete({
      where: { id: Number(id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};
