import express from 'express';
const router = express.Router();

// --- FAKE DATA (List of all suppliers) ---
const mockSuppliers = [
  { id: 101, name: 'Apollo Pharmacy', contact_person: 'Mr. Sharma', phone: '9876543210' },
  { id: 102, name: 'MedPlus', contact_person: 'Ms. Gupta', phone: '9876500011' },
  { id: 103, name: 'Cipla Distributors', contact_person: 'Mr. Reddy', phone: '9988776655' }
];


router.get('/', (req, res) => {
  res.render('manage_suppliers', {
    pageTitle: 'Manage Suppliers',
    suppliers: mockSuppliers
  });
});


router.post('/add', (req, res) => {
  const { name, contact_person, phone } = req.body;

  console.log('--- New Supplier Added ---');
  console.log('Name:', name);
  console.log('Contact Person:', contact_person);
  console.log('Phone:', phone);
  // Yahan DB INSERT query chalegi 'Suppliers' table mein

  
  res.redirect('/suppliers');
});
export default router;