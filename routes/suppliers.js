import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { oracledb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(isLoggedIn);

router.get('/', async (req, res) => {
  let connection;
  let suppliers = [];

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');
    
    const sql = `
      SELECT SUPPLIER_ID, NAME, CONTACT_PERSON, PHONE 
      FROM Suppliers 
      WHERE pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(
      sql, 
      { b_pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    suppliers = result.rows;

  } catch (err) {
    console.error("Error fetching suppliers:", err);
    req.flash('error', 'Could not load suppliers list.');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('manage_suppliers', {
    pageTitle: 'Manage Suppliers',
    suppliers: suppliers
  });
});

router.post('/add', async (req, res) => {
  let connection;
  
  try {
    const { name, contact_person, phone } = req.body;
    const { pharmacy_id } = req.session.user;
    const newSupplierId = uuidv4();

    connection = await oracledb.getConnection('default');
    
    const sql = `
      INSERT INTO Suppliers (supplier_id, pharmacy_id, name, contact_person, phone)
      VALUES (:b_sid, :b_pid, :b_name, :b_contact, :b_phone)
    `;
    
    await connection.execute(sql, 
      {
        b_sid: newSupplierId,
        b_pid: pharmacy_id,
        b_name: name,
        b_contact: contact_person,
        b_phone: phone
      }, 
      { autoCommit: true }
    );
    
    req.flash('success', 'New supplier added successfully!');

  } catch (err) {
    console.error("Error inserting supplier:", err);
    req.flash('error', 'Failed to add new supplier.');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
  
  res.redirect('/suppliers');
});

router.get('/edit/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  const { pharmacy_id } = req.session.user;

  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      SELECT SUPPLIER_ID, NAME, CONTACT_PERSON, PHONE 
      FROM Suppliers 
      WHERE supplier_id = :b_sid 
      AND pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(
      sql,
      { b_sid: id, b_pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      req.flash('error', 'Supplier not found or unauthorized.');
      return res.redirect('/suppliers');
    }
    
    res.render('edit_supplier', {
      pageTitle: 'Edit Supplier',
      supplier: result.rows[0]
    });

  } catch (err) {
    console.error("Error fetching supplier for edit:", err);
    req.flash('error', 'Failed to load supplier data.');
    res.redirect('/suppliers');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
});

router.post('/edit/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  const { pharmacy_id } = req.session.user;
  const { name, contact_person, phone } = req.body;
  
  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      UPDATE Suppliers
      SET 
        name = :b_name,
        contact_person = :b_contact,
        phone = :b_phone
      WHERE 
        supplier_id = :b_sid 
      AND 
        pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(sql, 
      {
        b_name: name,
        b_contact: contact_person,
        b_phone: phone,
        b_sid: id,
        b_pid: pharmacy_id
      },
      { autoCommit: true }
    );

    if (result.rowsAffected > 0) {
      req.flash('success', 'Supplier updated successfully.');
    } else {
      req.flash('error', 'Update failed. Supplier not found or unauthorized.');
    }
    
  } catch (err) {
    console.error("Error updating supplier:", err);
    req.flash('error', 'Failed to update supplier.');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.redirect('/suppliers');
});

router.post('/delete/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  const { pharmacy_id } = req.session.user;
  
  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      DELETE FROM Suppliers 
      WHERE supplier_id = :b_sid 
      AND pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(sql, 
      {
        b_sid: id,
        b_pid: pharmacy_id
      },
      { autoCommit: true }
    );

    if (result.rowsAffected > 0) {
      req.flash('success', 'Supplier deleted successfully.');
    } else {
      req.flash('error', 'Delete failed. Supplier not found or unauthorized.');
    }
    
  } catch (err) {
    console.error("Error deleting supplier:", err);
    if (err.errorNum === 2292) {
      req.flash('error', 'Cannot delete this supplier. It is already in use in your stock.');
    } else {
      req.flash('error', 'Failed to delete supplier.');
    }
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.redirect('/suppliers');
});

export default router;