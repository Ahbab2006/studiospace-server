const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

const verifyToken = require("../middleware/verifyToken");
// const verifyAdmin = require("../middleware/verifyAdmin");
const verifyPermission = require("../middleware/verifyPermission");

// Admin: Get all users' bookings
router.get(
  "/all",
  verifyToken,
  verifyPermission("manageBookings"),
  getAllBookings
);

// Admin/Sub-admin: Update booking status
router.patch(
  "/:bookingId/status",
  verifyToken,
  verifyPermission("manageBookings"),
  updateBookingStatus
);

// Create a booking
router.post("/", verifyToken, createBooking);

// Get the logged-in user's bookings
router.get("/my-bookings", verifyToken, getMyBookings);

// Cancel the logged-in user's booking
router.patch("/:bookingId/cancel", verifyToken, cancelBooking);

module.exports = router;