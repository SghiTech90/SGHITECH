const { getPool, sql } = require("../config/db");

// Get upcoming due dates (next 20 days)
const getUpcomingDueDates = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    const query = `
            SELECT WorkID, KamacheName, KamPurnDate 
            FROM BudgetMasterBuilding -- Add other relevant tables with UNION ALL if needed
            WHERE KamPurnDate BETWEEN GETDATE() AND DATEADD(day, 20, GETDATE())
            ORDER BY KamPurnDate;
        `; // Note: This query might need refinement based on exact tables and date logic
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error fetching upcoming due dates:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching upcoming due dates",
        error: error.message,
      });
  }
};

// --- Add other notification functions below, ensuring they accept 'office' ---

// Example: Get pending tenders (Placeholder - needs actual query)
const getPendingTenders = async (req, res) => {
  const { office } = req.body;
  if (!office) {
    return res
      .status(400)
      .json({ success: false, message: "Office parameter is required" });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Placeholder Query - Replace with your actual logic
    const query = `SELECT TenderID, TenderName, SubmissionDate FROM Tenders WHERE Status = 'Pending' ORDER BY SubmissionDate;`;
    const result = await pool.request().query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error fetching pending tenders:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching pending tenders",
        error: error.message,
      });
  }
};

// Add getLowBalanceAlerts, getPendingApprovals, getContractReminders following the same pattern
// ... implementation for other notification functions ...

module.exports = {
  getUpcomingDueDates,
  getPendingTenders,
  // Export other functions as they are implemented
};
