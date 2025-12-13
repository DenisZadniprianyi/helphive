import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { generateToken } from '../utils/token.util.js';
import { sendVerificationEmail } from '../services/email.service.js';

const router = express.Router();

/**
 * REGISTER
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const hash = await bcrypt.hash(password, 12);

    const userResult = await pool.query(
      'INSERT INTO users (email, password, is_verified) VALUES ($1, $2, false) RETURNING id, email',
      [email, hash]
    );

    const user = userResult.rows[0];
    const token = generateToken();

    await pool.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + interval '1 day')`,
      [user.id, token]
    );

    await sendVerificationEmail(
      email,
      `${process.env.APP_URL}/api/auth/verify/${token}`
    );

    res.json({
      message: 'Registered successfully. Please verify your email.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * EMAIL VERIFICATION
 */
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const verification = await pool.query(
      'SELECT * FROM email_verifications WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (!verification.rows.length) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const userId = verification.rows[0].user_id;

    await pool.query(
      'UPDATE users SET is_verified = true WHERE id = $1',
      [userId]
    );

    await pool.query(
      'DELETE FROM email_verifications WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'Email successfully verified' });
  } catch (err) {
    next(err);
  }
});

/**
 * LOGIN
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !user.is_verified) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
