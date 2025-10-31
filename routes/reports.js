import express from 'express';
const router = express.Router();
import { isLoggedIn } from '../middleware/auth.js';

router.use(isLoggedIn);


// --- FAKE DATA (Low Stock Report) ---
const mockLowStock = [
  { name: 'Cough Syrup', quantity_remaining: 40, reorder_level: 50 },
  { name: 'Amoxicillin 250mg', quantity_remaining: 75, reorder_level: 100 },
  { name: 'Aspirin', quantity_remaining: 10, reorder_level: 30 }
];

// --- FAKE DATA (Near Expiry Report) ---
const mockNearExpiry = [
  { batch_id: 'B1003', name: 'Cough Syrup', expiry_date: '2025-05-20', quantity_remaining: 40 },
  { batch_id: 'B0091', name: 'Pain Balm', expiry_date: '2025-06-15', quantity_remaining: 25 }
];

// 1. GET /reports/low-stock
router.get('/low-stock', (req, res) => {
  res.render('report_view', {
    pageTitle: 'Low Stock Report',
    reportName: 'Low Stock Report',

    // Headers (columns) dynamic rakhein taaki EJS file reusable ho
    headers: ['Medicine Name', 'Quantity Remaining', 'Reorder Level'],

    // Rows ka data
    items: mockLowStock
  });
});

// 2. GET /reports/near-expiry
router.get('/near-expiry', (req, res) => {
  res.render('report_view', {
    pageTitle: 'Near Expiry Report',
    reportName: 'Near Expiry Report',

    headers: ['Batch ID', 'Medicine Name', 'Expiry Date', 'Quantity Left'],

    items: mockNearExpiry
  });
});

export default router;