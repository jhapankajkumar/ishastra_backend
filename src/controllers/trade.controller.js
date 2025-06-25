const prisma = require('../db');

exports.getAllTrades = async (req, res) => {
  try {
    const trades = await prisma.trades.findMany({
      orderBy: { entry_date: 'desc' }
    });

    const tradeIds = trades.map(t => t.id);
    const exitTactics = await prisma.exit_tactics.findMany();
    const tradeImages = await prisma.trade_images.findMany({
      where: { trade_id: { in: tradeIds } }
    });
    const tradeSetups = await prisma.trade_setups.findMany();
    const tradeFills = await prisma.trade_fills.findMany({
      where: { trade_id: { in: tradeIds } }
    });

    const tradesWithRelations = trades.map(trade => ({
      ...trade,
      exit_tactics: exitTactics.find(e => e.id === trade.exit_tactic_id) || null,
      trade_images: tradeImages.filter(img => img.trade_id === trade.id),
      trade_setups: trade.trade_setup_id
        ? tradeSetups.find(setup => setup.id === trade.trade_setup_id)
        : null,
      trade_fills: tradeFills.filter(fill => fill.trade_id === trade.id)
    }));

    res.json(tradesWithRelations);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
};

exports.createTrade = async (req, res) => {
  try {
    const {
      user_id,
      ticker,
      direction,
      setup,
      entry_price,
      exit_price,
      stop_loss,
      quantity,
      r_multiple,
      result,
      entry_date,
      exit_date,
      reason_for_entry,
      reason_for_exit,
      post_trade_analysis,
      confidence_rating,
      exit_tactic_id,
      trade_setup_id,
    } = req.body;

    const trade = await prisma.trades.create({
      data: {
        user_id: Number(user_id),
        ticker,
        direction,
        setup,
        entry_price: parseFloat(entry_price),
        exit_price: parseFloat(exit_price),
        stop_loss: parseFloat(stop_loss),
        quantity: parseInt(quantity),
        r_multiple: parseFloat(r_multiple),
        result,
        entry_date: new Date(entry_date),
        exit_date: new Date(exit_date),
        reason_for_entry,
        reason_for_exit,
        post_trade_analysis,
        confidence_rating: parseInt(confidence_rating),
        exit_tactic_id: exit_tactic_id ? Number(exit_tactic_id) : null,
        trade_setup_id: trade_setup_id ? Number(trade_setup_id) : null,
      }
    });

    console.log('Trade created:', trade.id);

    const imageData = [];

    if (req.files?.entry_chart?.[0]) {
      imageData.push({
        image_type: 'entry',
        image_url: req.files.entry_chart[0].path,
        trade_id: trade.id
      });
    }

    if (req.files?.exit_chart?.[0]) {
      imageData.push({
        image_type: 'exit',
        image_url: req.files.exit_chart[0].path,
        trade_id: trade.id
      });
    }

    if (req.files?.post_chart?.[0]) {
      imageData.push({
        image_type: 'post',
        image_url: req.files.post_chart[0].path,
        trade_id: trade.id
      });
    }

    if (imageData.length) {
      console.log('Saving images:', imageData);
      try {
        await prisma.trade_images.createMany({
          data: imageData
        });
      } catch (imageError) {
        console.error('Error saving trade images:', imageError);
      }
    } else {
      console.log('No images uploaded.');
    }

    const fills = req.body.fills ? JSON.parse(req.body.fills) : [];
    if (fills.length) {
      const formattedFills = fills.map(fill => ({
        trade_id: trade.id,
        fill_price: parseFloat(fill.fill_price),
        fill_qty: parseInt(fill.fill_qty),
        fill_time: new Date(fill.fill_time)
      }));
      console.log('Saving fills:', formattedFills);
      try {
        await prisma.trade_fills.createMany({
          data: formattedFills
        });
      } catch (fillsError) {
        console.error('Error saving trade fills:', fillsError);
      }
    } else {
      console.log('No fills provided.');
    }

    res.status(201).json({ trade });
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
};

// PATCH update trade + optionally attach exit/post images
exports.updateTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {};

    const {
      ticker,
      direction,
      setup,
      entry_price,
      exit_price,
      stop_loss,
      quantity,
      r_multiple,
      result,
      entry_date,
      exit_date,
      reason_for_entry,
      reason_for_exit,
      post_trade_analysis,
      confidence_rating,
      exit_tactic_id,
      trade_setup_id
    } = req.body;

    if (ticker != null) data.ticker = ticker;
    if (direction != null) data.direction = direction;
    if (setup != null) data.setup = setup;
    if (entry_price != null) data.entry_price = parseFloat(entry_price);
    if (exit_price != null) data.exit_price = parseFloat(exit_price);
    if (stop_loss != null) data.stop_loss = parseFloat(stop_loss);
    if (quantity != null) data.quantity = parseInt(quantity);
    if (r_multiple != null) data.r_multiple = parseFloat(r_multiple);
    if (result != null) data.result = result;
    if (entry_date != null) data.entry_date = new Date(entry_date);
    if (exit_date != null) data.exit_date = new Date(exit_date);
    if (reason_for_entry != null) data.reason_for_entry = reason_for_entry;
    if (reason_for_exit != null) data.reason_for_exit = reason_for_exit;
    if (post_trade_analysis != null) data.post_trade_analysis = post_trade_analysis;
    if (confidence_rating != null) data.confidence_rating = parseInt(confidence_rating);
    if (exit_tactic_id != null) data.exit_tactic_id = Number(exit_tactic_id);
    if (trade_setup_id != null) data.trade_setup_id = Number(trade_setup_id);

    const updatedTrade = await prisma.trades.update({
      where: { id: Number(id) },
      data
    });

    const imageData = [];

    if (req.files?.exit_chart?.[0]) {
      imageData.push({
        image_type: 'exit',
        image_url: req.files.exit_chart[0].path,
        trade_id: Number(id)
      });
    }

    if (req.files?.post_chart?.[0]) {
      imageData.push({
        image_type: 'post',
        image_url: req.files.post_chart[0].path,
        trade_id: Number(id)
      });
    }

    if (imageData.length) {
      await prisma.trade_images.createMany({ data: imageData });
    }

    res.json({ updatedTrade, added_images: imageData.map(i => i.image_type) });
  } catch (error) {
    console.error('Error updating trade:', error);
    res.status(500).json({ error: 'Failed to update trade' });
  }
};
