const express = require("express");
const router = express.Router();
const {
  getUpcomingDueDates,
} = require("../controllers/notificationController");

// Route to get upcoming due dates (next 20 days)
router.post("/upcoming-due-dates", getUpcomingDueDates);

module.exports = router;
