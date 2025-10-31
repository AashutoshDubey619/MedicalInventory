import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { oracledb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(isLoggedIn);

router.get('/', async (req, res) => {
  let connection;
  let stockItems = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');
    
    const sql = `
      SELECT 
        s.BATCH_ID, 
        m.NAME, 
        sup.NAME AS SUPPLIER_NAME,
        s.QUANTITY_REMAINING, 
        s.EXPIRY_DATE
      FROM Stock s
      JOIN Medicines m ON s.medicine_id = m.medicine_id
      LEFT JOIN Suppliers sup ON s.supplier_id = sup.supplier_id
      WHERE s.pharmacy_id = :b_pid
      ORDER BY m.NAME, s.EXPIRY_DATE
    `;
    
    const result = await connection.execute(
      sql, 
      { b_pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    stockItems = result.rows;

  } catch (err) {
    console.error("Error fetching stock:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('stock_view', { 
    pageTitle: 'View Stock',
    stockItems: stockItems
  });
});

router.get('/add', async (req, res) => {
  let connection;
  let medicines = [];
  let suppliers = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');

    const medSql = `SELECT MEDICINE_ID, NAME FROM Medicines WHERE pharmacy_id = :b_pid ORDER BY NAME`;
    const medResult = await connection.execute(medSql, { b_pid: pharmacy_id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    medicines = medResult.rows;

    const supSql = `SELECT SUPPLIER_ID, NAME FROM Suppliers WHERE pharmacy_id = :b_pid ORDER BY NAME`;
    const supResult = await connection.execute(supSql, { b_pid: pharmacy_id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    suppliers = supResult.rows;

  } catch (err) {
    console.error("Error fetching data for add stock form:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('add_stock_form', {
    pageTitle: 'Add New Stock',
    medicines: medicines,
    suppliers: suppliers
  });
});

router.post('/add', async (req, res) => {
  let connection;
  try {
    const { pharmacy_id } = req.session.user;
    const { medicine_id, supplier_id, quantity, expiry_date, cost_per_unit, purchase_date } = req.body;
    
    const newBatchId = uuidv4();

    connection = await oracledb.getConnection('default');
    
    const sql = `
      INSERT INTO Stock (
        batch_id, pharmacy_id, medicine_id, supplier_id, 
        quantity_received, quantity_remaining, cost_per_unit, 
        purchase_date, expiry_date
      )
      VALUES (
        :b_bid, :b_pid, :b_mid, :b_sid,
        :b_qty, :b_qty, :b_cost,
        TO_DATE(:b_pdate, 'YYYY-MM-DD'), TO_DATE(:b_edate, 'YYYY-MM-DD')
      )
    `;
    
    await connection.execute(sql, 
      {
        b_bid: newBatchId,
        b_pid: pharmacy_id,
        b_mid: medicine_id,
        b_sid: supplier_id || null,
        b_qty: parseInt(quantity),
        b_cost: parseFloat(cost_per_unit) || null,
        b_pdate: purchase_date || null,
        b_edate: expiry_date
      },
      { autoCommit: true }
    );
    
    console.log("New stock batch added successfully.");

  } catch (err) {
    console.error("Error inserting stock:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
  
  res.redirect('/stock');
});

router.get('/issue', async (req, res) => {
  let connection;
  let availableBatches = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');

    const sql = `
      SELECT s.BATCH_ID, m.NAME, s.QUANTITY_REMAINING, s.EXPIRY_DATE
      FROM Stock s
      JOIN Medicines m ON s.medicine_id = m.medicine_id
      WHERE s.pharmacy_id = :b_pid AND s.quantity_remaining > 0
      ORDER BY m.NAME, s.EXPIRY_DATE
    `;
    const result = await connection.execute(sql, { b_pid: pharmacy_id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    availableBatches = result.rows;

  } catch (err) {
    console.error("Error fetching available batches:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('issue_stock_form', {
    pageTitle: 'Issue Stock',
    availableBatches: availableBatches
  });
});

router.post('/issue', async (req, res) => {
  let connection;
  try {
    const { pharmacy_id } = req.session.user;
    const { batch_id, quantity_issued, issued_to } = req.body;
    
    const newIssueId = uuidv4();

    connection = await oracledb.getConnection('default');
    
    const sql = `
      INSERT INTO Issues (issue_id, pharmacy_id, batch_id, quantity_issued, issued_to)
      VALUES (:b_iid, :b_pid, :b_bid, :b_qty, :b_ito)
    `;
    
    await connection.execute(sql, 
      {
        b_iid: newIssueId,
        b_pid: pharmacy_id,
        b_bid: batch_id,
        b_qty: parseInt(quantity_issued),
        b_ito: issued_to || null
      },
      { autoCommit: true }
    );
    
    console.log("Stock issued successfully via Issues table.");

  } catch (err) {
    console.error("Error issuing stock:", err);
    
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
  
  res.redirect('/stock')
});

export default router;