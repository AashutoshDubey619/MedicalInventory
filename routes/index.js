import express from 'express';
const router = express.Router();


const mockCatalog = [
  { id: 1, name: 'Paracetamol 500mg', description: 'Fever aur pain relief.', image_file: 'paracetamol.jpg' },
  { id: 2, name: 'Cough Syrup (100ml)', description: 'Sookhi khaansi ke liye.', image_file: 'cough-syrup.jpg' },
  { id: 3, name: 'Amoxicillin 250mg', description: 'Bacterial infections.', image_file: 'amoxicillin.jpg' }
];

const mockLowStock = [
  { name: 'Cough Syrup', quantity_remaining: 40 },
  { name: 'Amoxicillin 250mg', quantity_remaining: 75 }
];
const mockNearExpiry = [
  { batch_id: 'B1003', name: 'Cough Syrup', expiry_date: '2025-05-20' }
];

router.get('/', (req, res) => {
  res.render('home', { 
    pageTitle: 'Home',
    medicines: mockCatalog 
  });
});


router.get('/dashboard', (req, res) => {
  res.render('dashboard', { 
    pageTitle: 'Dashboard',
    lowStockItems: mockLowStock,
    nearExpiryItems: mockNearExpiry
  });
});


router.get('/login', (req, res) => {
  res.render('login', { pageTitle: 'Login' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // --- FAKE LOGIN CHECK ---
  // Baad mein yahan DB query chalegi: 
  // "SELECT * FROM Users WHERE username = :user AND password = :pass"
  if (username === 'admin' && password === 'admin123') {
    
    req.session.user = { 
      username: username,
      role: 'admin' 
    };
    
    console.log('Login successful, session created.');
    res.redirect('/dashboard'); 
    
  } else {
    console.log('Login failed.');
    res.redirect('/login'); 
  }
});


router.get('/logout', (req, res) => {
  
  req.session.destroy((err) => {
    if (err) {
      console.log('Error destroying session:', err);
    }
    console.log('Session destroyed, user logged out.');
    res.redirect('/'); 
  });
});


export default router;