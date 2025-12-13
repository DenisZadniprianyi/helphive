import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db.js';

const router = express.Router();

/**
 * REGISTER
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password required'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, is_verified`,
      [email.toLowerCase(), passwordHash]
    );

    const user = userResult.rows[0];

    const token = crypto.randomUUID().replace(/-/g, '');

    await pool.query(
      `INSERT INTO email_verifications (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + interval '1 day')`,
      [user.id, token]
    );

    console.log(
      `VERIFY LINK: ${process.env.APP_URL}/api/auth/verify/${token}`
    );

    res.status(201).json({
      message: 'Registered successfully. Please verify your email.',
      user
    });
  } catch (err) {
    // duplicate email
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }
    next(err);
  }
});

/**
 * EMAIL VERIFY
 */
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT user_id
       FROM email_verifications
       WHERE token = $1
         AND expires_at > NOW()`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        message: 'Invalid or expired token'
      });
    }

    const userId = result.rows[0].user_id;

    await pool.query(
      `UPDATE users
       SET is_verified = true
       WHERE id = $1`,
      [userId]
    );

    await pool.query(
      `DELETE FROM email_verifications
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      message: 'Email successfully verified'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * LOGIN
 */
router.post('/login', async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'JWT_SECRET not configured'
      });
    }

    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !user.is_verified) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
