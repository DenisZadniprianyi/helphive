import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * REGISTER (TEMP — без БД)
 */
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const hash = await bcrypt.hash(password, 12);

  return res.json({
    message: 'Registered successfully (DB disabled)',
    user: {
      email,
      passwordHash: hash
    }
  });
});

/**
 * LOGIN (TEMP)
 */
router.post('/login', async (req, res) => {
  const token = jwt.sign(
    { id: 1, role: 'user' },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '15m' }
  );

  res.json({
    token,
    user: {
      id: 1,
      email: req.body.email,
      role: 'user'
    }
  });
});

export default router;
