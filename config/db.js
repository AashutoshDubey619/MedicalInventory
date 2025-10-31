import oracledb from 'oracledb';

const dbConfig = {
  user: 'inventory_user',
  password: 'MyPassword123',
  connectString: 'localhost:1522/XE' // Port 1522
};

async function initialize() {
  try {
    await oracledb.createPool({
      ...dbConfig,
      poolAlias: 'default',
      
      // --- YEH LINES UPDATE HUI HAIN ---
      poolMin: 1, // 0 ki jagah 1 se start karein
      poolMax: 4, // 4 theek hai
      poolIncrement: 1 // 0 ki jagah 1 rakhein
      // --- UPDATE ENDS ---
    });
    console.log('Oracle DB connection pool initialized (inventory_user, Thick Mode).');
  } catch (err) {
    console.error('Error initializing Oracle DB pool:', err);
    process.exit(1);
  }
}

export { initialize, oracledb };