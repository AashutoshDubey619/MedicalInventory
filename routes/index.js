import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { oracledb } from '../config/db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', async (req, res) => {
  let connection;
  let medicines = [];

  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      SELECT NAME, MANUFACTURER, IMAGE_FILENAME, DESCRIPTION 
      FROM Medicines
      ORDER BY NAME
    `;
    const result = await connection.execute(
      sql, 
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    medicines = result.rows;

  } catch (err) {
    console.error("Error fetching homepage medicines:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('home', { 
    pageTitle: 'Home',
    medicines: medicines
  });
});

router.get('/dashboard', isLoggedIn, async (req, res) => {
  let connection;
  let lowStockItems = [];
  let nearExpiryItems = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');

    const lowStockSql = `SELECT * FROM LowStockReport WHERE pharmacy_id = :pid`;
    const lowStockResult = await connection.execute(
      lowStockSql, 
      { pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const nearExpirySql = `SELECT * FROM NearExpiryReport WHERE pharmacy_id = :pid`;
    const nearExpiryResult = await connection.execute(
      nearExpirySql, 
      { pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    lowStockItems = lowStockResult.rows.map(item => ({
        name: item.NAME,
        quantity_remaining: item.TOTAL_QUANTITY
    }));
    
    nearExpiryItems = nearExpiryResult.rows.map(item => ({
        batch_id: item.BATCH_ID,
        name: item.NAME,
        expiry_date: item.EXPIRY_DATE,
        quantity_remaining: item.QUANTITY_REMAINING
    }));

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
  
  res.render('dashboard', { 
    pageTitle: 'Dashboard',
    lowStockItems: lowStockItems,
    nearExpiryItems: nearExpiryItems
  });
});

router.get('/login', (req, res) => {
  res.render('login', { pageTitle: 'Login' });
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    console.log('Session destroyed, user logged out.');
    res.redirect('/'); 
  });
});

router.get('/signup', (req, res) => {
  res.render('signup', { pageTitle: 'Sign Up' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection('default'); 
    
    const sql = `
      SELECT USER_ID, PHARMACY_ID, PASSWORD_HASH, ROLE, USERNAME 
      FROM Users 
      WHERE username = :b_uname
    `;
    const result = await connection.execute(
      sql, 
      { b_uname: username },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      console.log('Login failed: User not found.');
      return res.redirect('/login');
    }

    const user = result.rows[0];

    if (!password || !user.PASSWORD_HASH) {
      console.log('Login failed: Missing password or stored hash.');
      return res.redirect('/login');
    }
    
    const cleanHash = user.PASSWORD_HASH.trim();
    const isPasswordValid = await bcrypt.compare(password, cleanHash);

    if (isPasswordValid) {
      req.session.user = {
        user_id: user.USER_ID,
        pharmacy_id: user.PHARMACY_ID,
        username: user.USERNAME,
        role: user.ROLE
      };
      console.log('Login successful, session created.');
      res.redirect('/dashboard');
    } else {
      console.log('Login failed: Invalid password.');
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/login');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
});

router.post('/signup', async (req, res) => {
  const { pharmacy_name, username, password } = req.body;
  let connection;

  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newPharmacyId = uuidv4();
    const newUserId = uuidv4();

    connection = await oracledb.getConnection('default');

    const pharmacySql = `
      INSERT INTO Pharmacies (pharmacy_id, pharmacy_name)
      VALUES (:b_pid, :b_pname)
    `;
    await connection.execute(pharmacySql, 
      { 
        b_pid: newPharmacyId, 
        b_pname: pharmacy_name 
      },
      { autoCommit: false } 
    );

    const userSql = `
      INSERT INTO Users (user_id, pharmacy_id, username, password_hash, role)
      VALUES (:b_uid, :b_pid, :b_uname, :b_phash, :b_prole)
    `;
    await connection.execute(userSql,
      { 
        b_uid: newUserId, 
        b_pid: newPharmacyId, 
        b_uname: username,
        b_phash: password_hash, 
        b_prole: 'admin'
      },
      { autoCommit: false }
    );
    
    await connection.commit();
    
    console.log('New pharmacy and admin user created.');

    req.session.user = {
      user_id: newUserId,
      pharmacy_id: newPharmacyId,
      username: username,
      role: 'admin'
    };

    res.redirect('/dashboard');

  } catch (err) {
    console.error('--- SIGNUP ERROR CATCH BLOCK ---', err);
    if (connection) {
      await connection.rollback(); 
    }
    res.redirect('/signup'); 
  } finally {
    if (connection) {
      try {
        await connection.close(); 
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

export default router;