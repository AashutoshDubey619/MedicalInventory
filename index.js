import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const router = express.Router();
import mainRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); 
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.use('/', mainRoutes);



app.get('/' , (req,res)=>{
    res.render('dashboard', { title: 'Dashboard' });
});


app.listen(PORT , () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


