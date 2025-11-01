import oracledb from 'oracledb';

const dbConfig = {
  user: 'inventory_user',
  password: 'MyPassword123',
  connectString: 'localhost:1522/XE' 
};

async function initialize() {
  try {
    await oracledb.createPool({
      ...dbConfig,
      poolAlias: 'default',
      
      
      poolMin: 1, 
      poolMax: 4, 
      poolIncrement: 1 
      
    });
    console.log('Oracle DB connection pool initialized (inventory_user, Thick Mode).');
  } catch (err) {
    console.error('Error initializing Oracle DB pool:', err);
    process.exit(1);
  }
}

export { initialize, oracledb };