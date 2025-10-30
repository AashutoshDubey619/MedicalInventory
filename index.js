import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

import mainRoutes from './routes/index.js';
import stockRoutes from './routes/stock.js';
import reportRoutes from './routes/reports.js';
import medicineRoutes from './routes/medicines.js';
import supplierRoutes from './routes/suppliers.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(session({
  secret: 'my_secret_key_12345', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user; 
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', mainRoutes);
app.use('/stock', stockRoutes);
app.use('/reports', reportRoutes);
app.use('/medicines', medicineRoutes);
app.use('/suppliers', supplierRoutes); 

app.listen(port, () => {
  console.log(`Server http://localhost:${port} par chal raha hai`);
});