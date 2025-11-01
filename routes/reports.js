import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { oracledb } from '../config/db.js';

const router = express.Router();

router.use(isLoggedIn);

router.get('/', (req, res) => {
  res.render('reports_hub', {
    pageTitle: 'Reports'
  });
});

router.get('/low-stock', async (req, res) => {
  let connection;
  let items = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');
    
    const sql = `SELECT * FROM LowStockReport WHERE pharmacy_id = :pid`;
    
    const result = await connection.execute(
      sql,
      { pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    items = result.rows;

  } catch (err) {
    console.error("Error fetching low stock report:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('report_view', {
    pageTitle: 'Low Stock Report',
    reportName: 'Low Stock Report',
    headers: ['Medicine Name', 'Total Quantity Remaining'],
    items: items
  });
});

router.get('/near-expiry', async (req, res) => {
  let connection;
  let items = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');
    
    const sql = `SELECT * FROM NearExpiryReport WHERE pharmacy_id = :pid ORDER BY EXPIRY_DATE ASC`;
    
    const result = await connection.execute(
      sql,
      { pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    items = result.rows;

  } catch (err) {
    console.error("Error fetching near expiry report:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
  
  res.render('report_view', {
    pageTitle: 'Near Expiry Report',
    reportName: 'Near Expiry Report (Next 30 Days)',
    headers: ['Batch ID', 'Medicine Name', 'Expiry Date', 'Quantity Left'],
    items: items
  });
});

export default router;