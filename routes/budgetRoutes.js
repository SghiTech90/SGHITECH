const express = require("express");
const router = express.Router();
const {
  getBudgetCount,
  getUpvibhagCounts,
  getUniqueYears,
  getUniqueHeadNames,
  getBudgetSummaryByYear,
  getBudgetDetailsByYearAndHead
} = require("../controllers/budgetController");

// Route to get budget count
router.post("/count", getBudgetCount);

// Route to get Upvibhag counts from all budget tables
router.post("/upvibhag-counts", getUpvibhagCounts);

// Route to get unique years from provision tables
router.post("/unique-years", getUniqueYears); // Requires office

// Route to get unique head names from master tables
router.post("/unique-head-names", getUniqueHeadNames); // Requires office

// Route to get budget summary by year
router.post("/summary-by-year", getBudgetSummaryByYear); // Requires office, year

// Route to get budget details by year and head name
router.post("/details-by-year-head", getBudgetDetailsByYearAndHead); 


module.exports = router;
