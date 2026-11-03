const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const createBooking = async (req, res) => {
  try {
    const {
      studioId,
      bookingDate,
      startTime,
      endTime,
    } = req.body;

    // 1. Validate required fields
    if (!studioId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Studio, date, start time and end time are required.",
      });
    }

    // 2. Validate studio ID
    if (!ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio ID.",
      });
    }

    // 3. Validate date and time format
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date or time format.",
      });
    }

    // Validate that the date is a real calendar date
  
// Validate that the date is a real calendar date
const parsedDate = new Date(`${bookingDate}T00:00:00Z`);

if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== bookingDate
) {
    return res.status(400).json({
        success: false,
        message: "Invalid booking date.",
    });
}

// Prevent booking for past dates
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

if (parsedDate < today) {
    return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past.",
    });
}


    // 4. Convert times to minutes
    const startMinutes =
      Number(startTime.split(":")[0]) * 60 +
      Number(startTime.split(":")[1]);

    const endMinutes =
      Number(endTime.split(":")[0]) * 60 +
      Number(endTime.split(":")[1]);

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time.",
      });
    }

    const db = getDB();

    // 5. Find studio
    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(studioId),
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    // 6. Check studio operating hours
    if (!studio.openingTime || !studio.closingTime) {
      return res.status(400).json({
        success: false,
        message: "Studio operating hours are not configured.",
      });
    }

    const openingMinutes =
      Number(studio.openingTime.split(":")[0]) * 60 +
      Number(studio.openingTime.split(":")[1]);

    const closingMinutes =
      Number(studio.closingTime.split(":")[0]) * 60 +
      Number(studio.closingTime.split(":")[1]);

    if (
      startMinutes < openingMinutes ||
      endMinutes > closingMinutes
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking must be within studio operating hours.",
      });
    }

    // 7. Check overlapping pending or confirmed bookings
 // 7. Check overlapping confirmed bookings only
const existingBooking = await db.collection("bookings").findOne({
  studioId: new ObjectId(studioId),
  bookingDate,
  status: "confirmed",
  startTime: { $lt: endTime },
  endTime: { $gt: startTime },
});

if (existingBooking) {
  return res.status(409).json({
    success: false,
    message: "This studio is already booked for that time.",
  });
}

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "This studio is already booked for that time.",
      });
    }

    // 8. Calculate price
    const totalHours = (endMinutes - startMinutes) / 60;
    const totalPrice = totalHours * Number(studio.hourlyRate);

    if (
      !Number.isFinite(totalPrice) ||
      totalPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio hourly rate.",
      });
    }

    // 9. Create a pending booking
    const newBooking = {
      studioId: new ObjectId(studioId),
      userEmail: req.user.email,
      studioTitle: studio.title,
      bookingDate,
      startTime,
      endTime,
      totalHours,
      totalPrice,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully!",
      data: {
        ...newBooking,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking.",
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Your bookings fetched successfully.",
      data: bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your bookings.",
    });
  }
};

const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { ObjectId } = require("mongodb");
        const db = getDB();

        if (!ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID.",
            });
        }

        const result = await db.collection("bookings").updateOne(
            {
                _id: new ObjectId(bookingId),
                userEmail: req.user.email,
                status: { $in: ["pending", "confirmed"] },
            },
            {
                $set: {
                    status: "cancelled",
                    cancelledAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Booking not found, already cancelled, completed, or you are not authorized to cancel it.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully.",
        });
    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel booking.",
        });
    }
};


// Admin: সব Booking দেখা
const getAllBookings = async (req, res) => {
    try {
        const db = getDB();

        const bookings = await db
            .collection("bookings")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json({
            success: true,
            message: "All bookings fetched successfully.",
            data: bookings,
        });
    } catch (error) {
        console.error("Get all bookings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch all bookings.",
        });
    }
};


const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["confirmed", "completed", "cancelled"];

        // Validate status
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking status.",
            });
        }

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID.",
            });
        }

        const db = getDB();

        const bookingsCollection = db.collection("bookings");

        const booking = await bookingsCollection.findOne({
            _id: new ObjectId(bookingId),
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found.",
            });
        }

        // Allow only valid status transitions
        const allowedTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["completed", "cancelled"],
            completed: [],
            cancelled: [],
        };

        if (!allowedTransitions[booking.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change booking status from ${booking.status} to ${status}.`,
            });
        }

        const result = await bookingsCollection.updateOne(
            { _id: new ObjectId(bookingId), status: booking.status },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(409).json({
                success: false,
                message: "Booking status changed already. Please refresh and try again.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Booking status updated to ${status}.`,
            data: {
                ...booking,
                status,
                updatedAt: new Date(),
            },
        });
    } catch (error) {
        console.error("Update booking status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update booking status.",
        });
    }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
   getAllBookings,
    updateBookingStatus,
};
// module.exports = { createBooking, getMyBookings };
