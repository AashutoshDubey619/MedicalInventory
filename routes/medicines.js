import express from 'express';
import { isLoggedIn } from '../middleware/auth.js';
import { oracledb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(isLoggedIn);

router.get('/', async (req, res) => {
  let connection;
  let medicines = []; 

  try {
    const { pharmacy_id } = req.session.user;
    connection = await oracledb.getConnection('default');
    
    const sql = `
      SELECT MEDICINE_ID, NAME, MANUFACTURER, IMAGE_FILENAME, DESCRIPTION 
      FROM Medicines 
      WHERE pharmacy_id = :b_pid
    `;
    const result = await connection.execute(
      sql, 
      { b_pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT } 
    );
    
    medicines = result.rows;

  } catch (err) {
    console.error("Error fetching medicines:", err);
    req.flash('error', 'Could not load medicines list.');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.render('manage_medicines', {
    pageTitle: 'Manage Medicines',
    medicines: medicines 
  });
});

router.post('/add', async (req, res) => {
  let connection;
  
  try {
    const { name, manufacturer, image_filename, description } = req.body;
    const { pharmacy_id } = req.session.user;
    
    const newMedicineId = uuidv4();

    connection = await oracledb.getConnection('default');
    
    const sql = `
      INSERT INTO Medicines (medicine_id, pharmacy_id, name, manufacturer, image_filename, description)
      VALUES (:b_mid, :b_pid, :b_name, :b_mfg, :b_img, :b_desc)
    `;
    
    await connection.execute(sql, 
      {
        b_mid: newMedicineId,
        b_pid: pharmacy_id,
        b_name: name,
        b_mfg: manufacturer,
        b_img: image_filename,
        b_desc: description
      },
      { autoCommit: true } 
    );

    req.flash('success', 'New medicine type added successfully!');
    
  } catch (err) {
    console.error("Error inserting medicine:", err);
    req.flash('error', 'Failed to add new medicine.');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.redirect('/medicines');
});

router.get('/edit/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  const { pharmacy_id } = req.session.user;

  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      SELECT MEDICINE_ID, NAME, MANUFACTURER, IMAGE_FILENAME, DESCRIPTION 
      FROM Medicines 
      WHERE medicine_id = :b_mid 
      AND pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(
      sql,
      { b_mid: id, b_pid: pharmacy_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      req.flash('error', 'Medicine not found or unauthorized.');
      return res.redirect('/medicines');
    }
    
    res.render('edit_medicine', {
      pageTitle: 'Edit Medicine',
      medicine: result.rows[0]
    });

  } catch (err) {
    console.error("Error fetching medicine for edit:", err);
    req.flash('error', 'Failed to load medicine data.');
    res.redirect('/medicines');
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
  const { name, manufacturer, image_filename, description } = req.body;
  
  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      UPDATE Medicines
      SET 
        name = :b_name,
        manufacturer = :b_mfg,
        image_filename = :b_img,
        description = :b_desc
      WHERE 
        medicine_id = :b_mid 
      AND 
        pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(sql, 
      {
        b_name: name,
        b_mfg: manufacturer,
        b_img: image_filename,
        b_desc: description,
        b_mid: id,
        b_pid: pharmacy_id
      },
      { autoCommit: true }
    );

    if (result.rowsAffected > 0) {
      req.flash('success', 'Medicine updated successfully.');
    } else {
      req.flash('error', 'Update failed. Medicine not found or unauthorized.');
    }
    
  } catch (err) {
    console.error("Error updating medicine:", err);
    req.flash('error', 'Failed to update medicine.');
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.redirect('/medicines');
});

router.post('/delete/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  const { pharmacy_id } = req.session.user;
  
  try {
    connection = await oracledb.getConnection('default');
    
    const sql = `
      DELETE FROM Medicines 
      WHERE medicine_id = :b_mid 
      AND pharmacy_id = :b_pid
    `;
    
    const result = await connection.execute(sql, 
      {
        b_mid: id,
        b_pid: pharmacy_id
      },
      { autoCommit: true }
    );

    if (result.rowsAffected > 0) {
      req.flash('success', 'Medicine type deleted successfully.');
    } else {
      req.flash('error', 'Delete failed. Medicine not found or unauthorized.');
    }
    
  } catch (err) {
    console.error("Error deleting medicine:", err);
    if (err.errorNum === 2292) {
      req.flash('error', 'Cannot delete this medicine. It is already in use in your stock.');
    } else {
      req.flash('error', 'Failed to delete medicine.');
    }
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.redirect('/medicines');
});


export default router;