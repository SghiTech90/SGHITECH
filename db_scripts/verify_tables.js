const { pool, sql } = require('../config/db');

async function verifyTables() {
  try {
    await pool.connect();
    
    console.log('Verifying SCreateAdmin table...');
    
    // Check if SCreateAdmin table exists
    const checkTableQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'SCreateAdmin'
    `;
    
    const tableResult = await pool.request().query(checkTableQuery);
    
    if (tableResult.recordset[0].count === 0) {
      console.error('ERROR: SCreateAdmin table does not exist. Please create it first.');
      return;
    }
    
    // Check columns
    const columnsQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'SCreateAdmin'
    `;
    
    const columnsResult = await pool.request().query(columnsQuery);
    const columns = columnsResult.recordset.map(row => row.COLUMN_NAME);
    
    console.log('Available columns in SCreateAdmin table:', columns);
    
    // Verify required columns
    const requiredColumns = ['UserId', 'Password', 'Post', 'MobileNo'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.error('WARNING: Missing required columns:', missingColumns);
      console.error('Please make sure these columns exist or update the userController.js to use the correct column names.');
    } else {
      console.log('All required columns are present.');
    }
    
  } catch (error) {
    console.error('Error verifying tables:', error);
  } finally {
    await sql.close();
  }
}

// Run the verification
verifyTables().catch(console.error); 