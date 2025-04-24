const { getPool, sql } = require("../config/db");

// Helper function to get budget counts from a specific table
const getTableBudgetCount = async (pool, tableName) => {
  const query = `SELECT COUNT(*) as count FROM ${tableName}`;
  const result = await pool.request().query(query);
  return result.recordset[0].count;
};

// Get total budget count across all master tables
const getBudgetCount = async (req, res) => {
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

    const tableQueries = [
      { table: "BudgetMasterBuilding", title: "Building" },
      { table: "BudgetMasterCRF", title: "CRF" },
      { table: "BudgetMasterAunty", title: "Annuity" },
      { table: "BudgetMasterNABARD", title: "NABARD" },
      { table: "BudgetMasterRoad", title: "ROAD" },
      { table: "BudgetMaster2515", title: "2515" },
      { table: "BudgetMasterDepositFund", title: "Deposit" },
      { table: "BudgetMasterDPDC", title: "DPDC" },
      { table: "BudgetMasterGAT_A", title: "AMC" },
      { table: "BudgetMasterGAT_D", title: "FDR" },
      { table: "BudgetMasterGAT_FBC", title: "BCR" },
      { table: "BudgetMasterMLA", title: "MLA" },
      { table: "BudgetMasterMP", title: "MP" },
      { table: "BudgetMasterNonResidentialBuilding", title: "2059" },
      { table: "BudgetMasterResidentialBuilding", title: "2216" },
    ];
    
    const resultsArray = [];

    for (const query of tableQueries) {
      try {
        const result = await pool
          .request()
          .query(`SELECT COUNT(*) as count FROM ${query.table}`);
        resultsArray.push({
          title: query.title,
          table: query.table,
          count: result.recordset[0].count,
        });
      } catch (error) {
        console.error(`Error querying table ${query.table}:`, error.message);
        resultsArray.push({
          title: query.title,
          table: query.table,
          count: 0,
          error: "Table may not exist or cannot be accessed",
        });
      }
    }

    res.json({ success: true, data: resultsArray });
  } catch (error) {
    console.error("Error getting budget counts:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Helper function to get Upvibhag counts from a specific table
const getTableUpvibhagCounts = async (pool, tableName) => {
  const query = `SELECT Upvibhag, COUNT(*) as count FROM ${tableName} GROUP BY Upvibhag`;
  const result = await pool.request().query(query);
  return result.recordset;
};

// Get Upvibhag counts aggregated across all master tables
const getUpvibhagCounts = async (req, res) => {
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

    const tables = [
      "BudgetMasterBuilding",
      "BudgetMasterCRF",
      "BudgetMasterAunty",
      "BudgetMasterDepositFund",
      "BudgetMasterDPDC",
      "BudgetMasterGAT_A",
      "BudgetMasterGAT_D",
      "BudgetMasterGAT_FBC",
      "BudgetMasterMLA",
      "BudgetMasterMP",
      "BudgetMasterNABARD",
      "BudgetMasterRoad",
      "BudgetMasterNonResidentialBuilding",
      "BudgetMasterResidentialBuilding",
      "BudgetMaster2515",
    ];

    const aggregatedCounts = {};

    for (const table of tables) {
      const results = await getTableUpvibhagCounts(pool, table);
      results.forEach((row) => {
        if (row.Upvibhag) {
          // Ensure Upvibhag is not null or empty
          aggregatedCounts[row.Upvibhag] =
            (aggregatedCounts[row.Upvibhag] || 0) + row.count;
        }
      });
    }

    // Convert aggregatedCounts object to an array of { Upvibhag, count }
    const responseData = Object.entries(aggregatedCounts).map(
      ([Upvibhag, count]) => ({ Upvibhag, count })
    );

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error getting Upvibhag counts:", error);
    res.status(500).json({
      success: false,
      message: "Error getting Upvibhag counts",
      error: error.message,
    });
  }
};

// Get Unique Years from Provision Tables
const getUniqueYears = async (req, res) => {
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

    // Example: Query one provision table, adjust if needed
    const query = `SELECT DISTINCT Arthsankalpiyyear FROM BuildingProvision ORDER BY Arthsankalpiyyear DESC`;
    const result = await pool.request().query(query);
    const years = result.recordset.map((row) => row.Arthsankalpiyyear);
    res.json({ success: true, years });
  } catch (error) {
    console.error("Error getting unique years:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unique years",
      error: error.message,
    });
  }
};

// Get Unique Head Names from Master Tables
const getUniqueHeadNames = async (req, res) => {
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

    // Example: Query one master table, adjust if needed
    const query = `SELECT DISTINCT LekhaShirshName FROM BudgetMasterBuilding WHERE LekhaShirshName IS NOT NULL ORDER BY LekhaShirshName`;
    const result = await pool.request().query(query);
    const headNames = result.recordset.map((row) => row.LekhaShirshName);
    res.json({ success: true, headNames });
  } catch (error) {
    console.error("Error getting unique head names:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unique head names",
      error: error.message,
    });
  }
};

// Get Budget Summary by Year (Aggregated)
const getBudgetSummaryByYear = async (req, res) => {
  const { office, year } = req.body;
  if (!office || !year) {
    return res.status(400).json({
      success: false,
      message: "Office and Year parameters are required",
    });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Aggregated query on Building tables, adjust as needed
    const query = `
            SELECT 
                m.LekhaShirshName, 
                COUNT(m.WorkID) AS WorkCount,
                SUM(p.Tartud) AS TotalTartud,
                SUM(p.AkunAnudan) AS TotalAnudan,
                SUM(p.AikunKharch) AS TotalKharch
            FROM BudgetMasterBuilding m
            JOIN BuildingProvision p ON m.WorkID = p.WorkID
            WHERE p.Arthsankalpiyyear = @year
            GROUP BY m.LekhaShirshName
            ORDER BY m.LekhaShirshName;
        `;
    const result = await pool
      .request()
      .input("year", sql.VarChar, year)
      .query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budget summary by year:", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget summary by year",
      error: error.message,
    });
  }
};

// Get Budget Details by Year and Head Name
const getBudgetDetailsByYearAndHead = async (req, res) => {
  const { office, year, headName } = req.body;
  if (!office || !year || !headName) {
    return res.status(400).json({
      success: false,
      message: "Office, Year, and Head Name parameters are required",
    });
  }
  try {
    const pool = await getPool(office);
    if (!pool)
      throw new Error(`Database pool is not available for office ${office}.`);

    // Example: Detailed query on Building tables, adjust as needed
    const query = `
            SELECT m.*, p.*
            FROM BudgetMasterBuilding m
            JOIN BuildingProvision p ON m.WorkID = p.WorkID
            WHERE p.Arthsankalpiyyear = @year AND m.LekhaShirshName = @headName
            ORDER BY m.WorkID;
        `;
    const result = await pool
      .request()
      .input("year", sql.VarChar, year)
      .input("headName", sql.NVarChar, headName) // Use NVarChar for head name
      .query(query);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Error getting budget details:", error);
    res.status(500).json({
      success: false,
      message: "Error getting budget details",
      error: error.message,
    });
  }
};

module.exports = {
  getBudgetCount,
  getUpvibhagCounts,
  getUniqueYears,
  getUniqueHeadNames,
  getBudgetSummaryByYear,
  getBudgetDetailsByYearAndHead,
};
