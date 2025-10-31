import express from 'express';
const router = express.Router();
import { isLoggedIn } from '../middleware/auth.js';      

router.use(isLoggedIn);

const mockStock = [
  { batch_id: 'B1001', name: 'Paracetamol 500mg', quantity_remaining: 150, expiry_date: '2026-10-31' },
  { batch_id: 'B1002', name: 'Amoxicillin 250mg', quantity_remaining: 75, expiry_date: '2025-12-01' },
  { batch_id: 'B1003', name: 'Cough Syrup', quantity_remaining: 40, expiry_date: '2025-05-20' },
  { batch_id: 'B1004', name: 'Paracetamol 500mg', quantity_remaining: 200, expiry_date: '2027-01-15' }
];

router.get('/', (req, res) => {
  res.render('stock_view', {
    pageTitle: 'View Stock',
    stockItems: mockStock 
  });
});

router.get('/add', (req, res) => {
  const mockMedicines = [
    { medicine_id: 1, name: 'Paracetamol 500mg' },
    { medicine_id: 2, name: 'Amoxicillin 250mg' },
    { medicine_id: 3, name: 'Cough Syrup' }
  ];
  const mockSuppliers = [
    { supplier_id: 101, name: 'Apollo Pharmacy' },
    { supplier_id: 102, name: 'MedPlus' }
  ];
  res.render('add_stock_form', {
    pageTitle: 'Add New Stock',
    medicines: mockMedicines,
    suppliers: mockSuppliers
  });
});

router.post('/add', (req, res) => {
  const { medicine_id, supplier_id, quantity, expiry_date } = req.body;
  res.redirect('/stock');
});

router.get('/issue', (req, res) => {
  res.render('issue_stock_form', {
    pageTitle: 'Issue Stock',
    availableBatches: mockStock  
  });
});

router.post('/issue', (req, res) => {
  const { batch_id, quantity_issued } = req.body;

  console.log('--- Stock Issue Request ---');
  console.log('Batch ID:', batch_id);
  console.log('Quantity to Issue:', quantity_issued);

  res.redirect('/stock');
});

export default router;
