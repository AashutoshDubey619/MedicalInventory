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
      SELECT NAME, MANUFACTURER, IMAGE_FILENAME, DESCRIPTION 
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

    console.log("New medicine added successfully.");
    
  } catch (err) {
    console.error("Error inserting medicine:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }

  res.redirect('/medicines');
});

export default router;