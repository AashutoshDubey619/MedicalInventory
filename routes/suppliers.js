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
      SELECT NAME, CONTACT_PERSON, PHONE 
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
      { autoCommit: true } // autoCommit
    );

    console.log("New supplier added successfully.");
    
  } catch (err) {
    console.error("Error inserting supplier:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

 
  res.redirect('/suppliers');
});

export default router;
