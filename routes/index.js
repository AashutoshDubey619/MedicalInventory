import express from 'express';
const router = express.Router();


router.get('/', (req, res) => {
    res.render('dashboard', { pageTitle: 'Dashboard' });
});


router.get('/login' , (req,res)=>{
    res.render('login', { pageTitle: 'Login' });
});

export default router;