const Inventory = require('../models/Inventory');

// Get all inventory items
exports.getStock = async (req, res) => {
  try {
    const inventory = await Inventory.find({}).sort({ createdAt: -1 });
    console.log(`� Found ${inventory.length} inventory items`);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('❌ Get stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new inventory item
exports.createStock = async (req, res) => {
  try {
    const { unitName, unitId, bodyColor, variation, quantity } = req.body;
    
    const newStock = new Inventory({
      unitName,
      unitId: unitId || unitName,
      bodyColor,
      variation,
      quantity: quantity || 1
    });

    await newStock.save();
    console.log('✅ Created stock:', newStock.unitName);
    res.json({ success: true, message: 'Stock created successfully', data: newStock });
  } catch (error) {
    console.error('❌ Create stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update inventory item
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedStock = await Inventory.findByIdAndUpdate(
      id, 
      { ...updates, lastUpdated: new Date() }, 
      { new: true }
    );

    if (!updatedStock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock item not found' 
      });
    }

    console.log('✅ Updated stock:', updatedStock.unitName);
    res.json({ 
      success: true, 
      message: 'Stock updated successfully', 
      data: updatedStock 
    });
  } catch (error) {
    console.error('❌ Update stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete inventory item
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStock = await Inventory.findByIdAndDelete(id);
    
    if (!deletedStock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock item not found' 
      });
    }

    console.log('✅ Deleted stock:', deletedStock.unitName);
    res.json({
      success: true,
      message: 'Stock deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};