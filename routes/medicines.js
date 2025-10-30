import express from 'express';
const router = express.Router();


const mockMedicineTypes = [
  { id: 1, name: 'Paracetamol 500mg', manufacturer: 'Cipla' },
  { id: 2, name: 'Amoxicillin 250mg', manufacturer: 'Sun Pharma' },
  { id: 3, name: 'Cough Syrup (100ml)', manufacturer: 'Dabur' }
];


router.get('/', (req, res) => {
  res.render('manage_medicines', {
    pageTitle: 'Manage Medicines',
    medicines: mockMedicineTypes
  });
});


router.post('/add', (req, res) => {
  const { name, manufacturer } = req.body;

  console.log('--- New Medicine Type Added ---');
  console.log('Name:', name);
  console.log('Manufacturer:', manufacturer);
  res.redirect('/medicines');
});

export default router;