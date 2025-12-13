
import dotenv from 'dotenv';
dotenv.config();
import app from './src/app.js';

app.listen(process.env.PORT || 5000, () =>
  console.log('Helphive API running')
);
