const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingStats,
  getAvailableSlots,
  assignStaff
} = require('../controllers/testDriveController');

// 🚗 Test Drive Booking Routes

// 📝 CREATE - Book a new test drive
// POST /api/testdrive/bookings
router.post('/bookings', createBooking);

// 📋 READ - Get all bookings with filters and pagination
// GET /api/testdrive/bookings?page=1&limit=10&status=Pending&vehicleType=Truck
router.get('/bookings', getAllBookings);

// 🔍 READ - Get specific booking by ID
// GET /api/testdrive/bookings/:id
router.get('/bookings/:id', getBookingById);

// ✏️ UPDATE - Update booking details
// PUT /api/testdrive/bookings/:id
router.put('/bookings/:id', updateBooking);

// 🗑️ DELETE - Cancel/Delete booking
// DELETE /api/testdrive/bookings/:id
router.delete('/bookings/:id', deleteBooking);

// 📊 ANALYTICS - Get booking statistics
// GET /api/testdrive/stats?startDate=2024-01-01&endDate=2024-12-31
router.get('/stats', getBookingStats);

// 🕐 UTILITY - Get available time slots for a specific date
// GET /api/testdrive/available-slots?date=2024-12-25&duration=60
router.get('/available-slots', getAvailableSlots);

// 👥 ASSIGNMENT - Assign sales agent and/or driver to booking
// PATCH /api/testdrive/bookings/:id/assign
router.patch('/bookings/:id/assign', assignStaff);

// 📱 MOBILE-SPECIFIC ROUTES

// 📱 Quick booking for mobile app
// POST /api/testdrive/mobile/quick-book
router.post('/mobile/quick-book', async (req, res) => {
  try {
    // Set default values for mobile quick booking
    const mobileBookingData = {
      ...req.body,
      testDriveRoute: req.body.testDriveRoute || 'City Route',
      duration: req.body.duration || 60,
      pickupLocation: req.body.pickupLocation || 'Dealership',
      priority: 'Normal'
    };

    // Forward to main create booking function
    req.body = mobileBookingData;
    return createBooking(req, res);
    
  } catch (error) {
    console.error('❌ Error in mobile quick booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating mobile booking',
      error: error.message
    });
  }
});

// 📱 Get customer's booking history by phone
// GET /api/testdrive/mobile/history?phone=+1234567890
router.get('/mobile/history', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const TestDriveBooking = require('../models/TestDriveBooking');
    
    const bookings = await TestDriveBooking.find({ 
      customerPhone: phone 
    })
    .populate([
      { path: 'assignedSalesAgent', select: 'username accountName' },
      { path: 'assignedDriver', select: 'username accountName' }
    ])
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: bookings
    });
    
  } catch (error) {
    console.error('❌ Error fetching customer history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking history',
      error: error.message
    });
  }
});

// 📱 Get booking by reference number (for customer lookup)
// GET /api/testdrive/mobile/lookup/:reference
router.get('/mobile/lookup/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const TestDriveBooking = require('../models/TestDriveBooking');
    
    const booking = await TestDriveBooking.findOne({ 
      bookingReference: reference.toUpperCase() 
    })
    .populate([
      { path: 'assignedSalesAgent', select: 'username accountName phoneNumber' },
      { path: 'assignedDriver', select: 'username accountName phoneNumber' }
    ]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
    
  } catch (error) {
    console.error('❌ Error looking up booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error looking up booking',
      error: error.message
    });
  }
});

// 🔄 STATUS MANAGEMENT ROUTES

// 🔄 Update booking status
// PATCH /api/testdrive/bookings/:id/status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, outcome, leadScore, followUpDate } = req.body;

    const TestDriveBooking = require('../models/TestDriveBooking');
    
    const booking = await TestDriveBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update status and related fields
    if (status) booking.status = status;
    if (notes) booking.internalNotes = notes;
    if (outcome) booking.testDriveOutcome = outcome;
    if (leadScore) booking.leadScore = leadScore;
    if (followUpDate) booking.followUpDate = new Date(followUpDate);

    // Set updatedBy if user info is available
    if (req.user?.id) {
      booking.updatedBy = req.user.id;
    }

    const updatedBooking = await booking.save();
    await updatedBooking.populate([
      { path: 'assignedSalesAgent', select: 'username accountName' },
      { path: 'assignedDriver', select: 'username accountName' },
      { path: 'updatedBy', select: 'username accountName' }
    ]);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking
    });

  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
});

// 🔄 Bulk status update
// PATCH /api/testdrive/bookings/bulk-status
router.patch('/bookings/bulk-status', async (req, res) => {
  try {
    const { bookingIds, status, notes } = req.body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking IDs array is required'
      });
    }

    const TestDriveBooking = require('../models/TestDriveBooking');
    
    const updateData = { 
      status,
      lastStatusUpdate: new Date()
    };
    
    if (notes) updateData.internalNotes = notes;
    if (req.user?.id) updateData.updatedBy = req.user.id;

    const result = await TestDriveBooking.updateMany(
      { _id: { $in: bookingIds } },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} bookings updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ Error bulk updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating booking status',
      error: error.message
    });
  }
});

// 📈 REPORTING ROUTES

// 📈 Get daily schedule for a specific date
// GET /api/testdrive/schedule?date=2024-12-25
router.get('/schedule', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const TestDriveBooking = require('../models/TestDriveBooking');
    
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const schedule = await TestDriveBooking.find({
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
    })
    .populate([
      { path: 'assignedSalesAgent', select: 'username accountName phoneNumber' },
      { path: 'assignedDriver', select: 'username accountName phoneNumber' }
    ])
    .sort({ bookingTime: 1 })
    .select('bookingReference customerName customerPhone vehicleModel bookingTime duration status assignedSalesAgent assignedDriver');

    res.json({
      success: true,
      data: {
        date: selectedDate.toISOString().split('T')[0],
        totalBookings: schedule.length,
        schedule
      }
    });

  } catch (error) {
    console.error('❌ Error fetching daily schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily schedule',
      error: error.message
    });
  }
});

module.exports = router;