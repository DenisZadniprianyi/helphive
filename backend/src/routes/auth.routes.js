import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { generateToken } from '../utils/token.util.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const hash = await bcrypt.hash(password, 12);

    const userResult = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, is_verified`,
      [email, hash]
    );

    const user = userResult.rows[0];

    const token = generateToken();

    await pool.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + interval '1 day')`,
      [user.id, token]
    );

    console.log('VERIFY TOKEN:', token);

    res.status(201).json({
      message: 'Registered successfully. Please verify your email.',
      user
    });
  } catch (err) {
    next(err);
  }
});

export default router;
