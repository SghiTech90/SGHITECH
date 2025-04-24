const sql = require("mssql");
require("dotenv").config(); // Load .env variables

// Function to create a config object using environment variables with fallbacks
const createDbConfig = (index) => ({
  server: process.env[`DB_SERVER_${index}`] || process.env.DB_SERVER || "103.123.74.117",
  database: process.env[`DB_DATABASE_${index}`] || process.env.DB_DATABASE || "P_W_Division_Akola",
  user: process.env[`DB_USER_${index}`] || process.env.DB_USER || "P_W_Division_Akola120",
  password: process.env[`DB_PASSWORD_${index}`] || process.env.DB_PASSWORD || "tAa7Jm8cir^86Tjbw",
  options: {
    trustServerCertificate: (process.env[`DB_TRUST_CERT_${index}`] || process.env.DB_TRUST_CERT || "true") === "true",
    encrypt: (process.env[`DB_ENCRYPT_${index}`] || process.env.DB_ENCRYPT || "true") === "true",
    connectTimeout: parseInt(process.env[`DB_CONNECT_TIMEOUT_${index}`] || process.env.DB_CONNECT_TIMEOUT || "30000", 10),
    requestTimeout: parseInt(process.env[`DB_REQUEST_TIMEOUT_${index}`] || process.env.DB_REQUEST_TIMEOUT || "30000", 10),
    pool: {
      max: parseInt(process.env[`DB_POOL_MAX_${index}`] || process.env.DB_POOL_MAX || "10", 10),
      min: parseInt(process.env[`DB_POOL_MIN_${index}`] || process.env.DB_POOL_MIN || "0", 10),
      idleTimeoutMillis: parseInt(process.env[`DB_POOL_IDLE_TIMEOUT_${index}`] || process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10)
    }
  }
});

// Create configurations for 6 pools
const config1 = createDbConfig(1);
const config2 = createDbConfig(2);
const config3 = createDbConfig(3);
const config4 = createDbConfig(4);
const config5 = createDbConfig(5);
const config6 = createDbConfig(6);

// Log the configurations for verification (excluding passwords)
//console.log("DB Config 1:", { ...config1, password: '***' });
// Add similar logs for config2-6 if needed for debugging

// Helper function to create and connect a pool, handling errors
const createAndConnectPool = async (config, poolName) => {
  console.log(`Creating and connecting pool: ${poolName}`);
  try {
    const pool = new sql.ConnectionPool(config);
    pool.on('error', err => console.error(`${poolName} SQL Pool Error:`, err));
    await pool.connect();
    console.log(`${poolName} connected successfully.`);
    return { pool, poolConnectPromise: Promise.resolve(pool) }; // Return promise for consistency
  } catch (err) {
    console.error(`Failed to connect ${poolName}:`, err);
    // Return a structure indicating failure, maybe allow retry later?
    return { pool: null, poolConnectPromise: Promise.reject(err) }; 
  }
};

// Initialize all pools concurrently
let pool1, poolConnect1, pool2, poolConnect2, pool3, poolConnect3, pool4, poolConnect4, pool5, poolConnect5, pool6, poolConnect6;

const initializeAllPools = async () => {
    console.log("Initializing all database pools...");
    const results = await Promise.allSettled([
        createAndConnectPool(config1, 'pool1'),
        createAndConnectPool(config2, 'pool2'),
        createAndConnectPool(config3, 'pool3'),
        createAndConnectPool(config4, 'pool4'),
        createAndConnectPool(config5, 'pool5'),
        createAndConnectPool(config6, 'pool6')
    ]);

    // Assign results even if some failed
    if (results[0].status === 'fulfilled') { pool1 = results[0].value.pool; poolConnect1 = results[0].value.poolConnectPromise; } 
    if (results[1].status === 'fulfilled') { pool2 = results[1].value.pool; poolConnect2 = results[1].value.poolConnectPromise; } 
    if (results[2].status === 'fulfilled') { pool3 = results[2].value.pool; poolConnect3 = results[2].value.poolConnectPromise; } 
    if (results[3].status === 'fulfilled') { pool4 = results[3].value.pool; poolConnect4 = results[3].value.poolConnectPromise; } 
    if (results[4].status === 'fulfilled') { pool5 = results[4].value.pool; poolConnect5 = results[4].value.poolConnectPromise; } 
    if (results[5].status === 'fulfilled') { pool6 = results[5].value.pool; poolConnect6 = results[5].value.poolConnectPromise; } 
    
    console.log("Pool initialization attempt finished.");
};

// Start initialization
initializeAllPools();


// Function to select the correct pool based on office
const getPool = async (office) => {
  console.log(`Getting pool for office: ${office}`);
  // Wait for the specific pool's connection promise to resolve or reject
  // This ensures we don't try to return a pool that hasn't finished connecting
  try {
    if (office === 'P_W_Division_Akola') {
      await poolConnect1; // Wait for connection attempt
      if (!pool1 || !pool1.connected) throw new Error("Pool1 is not connected");
      console.log("Returning pool1");
      return pool1;
    } else if (office === 'P_W_Division_Washim') {
      await poolConnect2;
      if (!pool2 || !pool2.connected) throw new Error("Pool2 is not connected");
      console.log("Returning pool2");
      return pool2;
    } else if (office === 'P_W_Division_Buldhana') {
      await poolConnect3;
      if (!pool3 || !pool3.connected) throw new Error("Pool3 is not connected");
      console.log("Returning pool3");
      return pool3;
    } else if (office === 'P_W_Division_Khamgaon') {
      await poolConnect4;
      if (!pool4 || !pool4.connected) throw new Error("Pool4 is not connected");
      console.log("Returning pool4");
      return pool4;
    } else if (office === 'P_W_Division_WBAkola') {
      await poolConnect5;
      if (!pool5 || !pool5.connected) throw new Error("Pool5 is not connected");
      console.log("Returning pool5");
      return pool5;
    } else if (office === 'P_W_Circle_Akola') {
      await poolConnect6;
      if (!pool6 || !pool6.connected) throw new Error("Pool6 is not connected");
      console.log("Returning pool6");
      return pool6;
    } else {
      console.error(`Invalid office selection: ${office}`);
      throw new Error('Invalid office selection');
    }
  } catch (err) {
      console.error(`Error getting or connecting pool for office ${office}:`, err);
      throw new Error(`Database connection for office ${office} is unavailable.`); // Re-throw a more specific error
  }
};

// Export necessary components
module.exports = {
  sql,
  getPool, // The function controllers will use
  // Export individual pools/promises only if needed elsewhere, otherwise keep internal
  pool1, pool2, pool3, pool4, pool5, pool6,
  poolConnect1, poolConnect2, poolConnect3, poolConnect4, poolConnect5, poolConnect6 
}; 
