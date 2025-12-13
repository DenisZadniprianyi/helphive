
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.use(errorHandler);
export default app;
