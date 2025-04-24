const { pool, sql } = require('../config/db');

async function createUsersTable() {
  try {
    await pool.connect();
    
    console.log('Creating Users table if it does not exist...');
    
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        UserID VARCHAR(50) PRIMARY KEY,
        Password VARCHAR(100) NOT NULL,
        Post VARCHAR(100) NOT NULL,
        MobileNo VARCHAR(15) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE()
      )
    `;
    
    await pool.request().query(createTableQuery);
    console.log('Users table created or already exists');
    
    // Insert sample users if none exist
    const checkUsersQuery = `SELECT COUNT(*) as count FROM Users`;
    const userCount = await pool.request().query(checkUsersQuery);
    
    if (userCount.recordset[0].count === 0) {
      console.log('Inserting sample users...');
      
      const insertUsersQuery = `
        INSERT INTO Users (UserID, Password, Post, MobileNo)
        VALUES 
          ('admin', 'admin123', 'Administrator', '9876543210'),
          ('user1', 'pass123', 'Engineer', '9876543211'),
          ('user2', 'pass123', 'Manager', '9876543212')
      `;
      
      await pool.request().query(insertUsersQuery);
      console.log('Sample users inserted');
    } else {
      console.log('Users already exist, skipping sample data insertion');
    }
    
    console.log('Setup complete');
    
  } catch (error) {
    console.error('Error setting up Users table:', error);
  } finally {
    await sql.close();
  }
}

// Run the setup
createUsersTable().catch(console.error); 