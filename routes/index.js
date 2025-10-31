import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { oracledb } from '../config/db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// --- FAKE DATA ---
const mockCatalog = [
  { id: 1, name: 'Paracetamol 500mg', description: 'Fever aur pain relief.', image_file: 'paracetamol.jpg' },
  { id: 2, name: 'Cough Syrup (100ml)', description: 'Sookhi khaansi ke liye.', image_file: 'cough-syrup.jpg' }
];
const mockLowStock = [
  { name: 'Cough Syrup', quantity_remaining: 40 },
  { name: 'Amoxicillin 250mg', quantity_remaining: 75 }
];
const mockNearExpiry = [
  { batch_id: 'B1003', name: 'Cough Syrup', expiry_date: '2025-05-20' }
];

// --- GET Routes ---
router.get('/', (req, res) => {
  res.render('home', { pageTitle: 'Home', medicines: mockCatalog });
});
router.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { pageTitle: 'Dashboard', lowStockItems: mockLowStock, nearExpiryItems: mockNearExpiry });
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


// --- POST /login (FIXED: :user ko :uname kiya) ---
// (Blackbox ka original fix abhi bhi zaroori hai)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection('default');
    
    // :user ko :uname kiya
    const sql = `
      SELECT user_id, pharmacy_id, password_hash, role, username 
      FROM Users 
      WHERE username = :uname 
    `;
    const result = await connection.execute(sql, { uname: username }); // :uname

    if (result.rows.length === 0) {
      console.log('Login failed: User not found.');
      return res.redirect('/login');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.PASSWORD_HASH);

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

// --- POST /signup (FIXED: :pass aur :role ko bhi rename kiya) ---
router.post('/signup', async (req, res) => {
  const { pharmacy_name, username, password } = req.body;
  let connection;

  console.log('--- SIGNUP: Route started (Thick Mode) ---');

  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    console.log('--- SIGNUP: Password hashed ---');

    const newPharmacyId = uuidv4();
    const newUserId = uuidv4();

    connection = await oracledb.getConnection('default');
    console.log('--- SIGNUP: Pool connection established ---');

    const pharmacySql = `
      INSERT INTO Pharmacies (pharmacy_id, pharmacy_name)
      VALUES (:pid, :pname)
    `;
    await connection.execute(pharmacySql, 
      { pid: newPharmacyId, pname: pharmacy_name },
      { autoCommit: false } 
    );
    console.log('--- SIGNUP: 1. Pharmacy INSERTED ---');

    // :user -> :uname, :pass -> :phash, :role -> :prole
    const userSql = `
      INSERT INTO Users (user_id, pharmacy_id, username, password_hash, role)
      VALUES (:uid, :pid, :uname, :phash, :prole)
    `;
    await connection.execute(userSql,
      { 
        uid: newUserId, 
        pid: newPharmacyId, 
        uname: username, // FIX 1
        phash: password_hash, // FIX 2
        prole: 'admin' // FIX 3
      },
      { autoCommit: false }
    );
    console.log('--- SIGNUP: 2. User INSERTED ---');
    
    await connection.commit();
    console.log('--- SIGNUP: 3. COMMIT complete ---');
    
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
        console.log('--- SIGNUP: Connection closed ---');
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

export default router;
