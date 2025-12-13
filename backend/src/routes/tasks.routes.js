import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { pool } from '../db.js';

const router = express.Router();

/**
 * CREATE TASK (CLIENT)
 */
router.post(
  '/',
  requireAuth,
  requireRole('client'),
  async (req, res, next) => {
    try {
      const { title, description } = req.body;

      const result = await pool.query(
        `INSERT INTO tasks (client_id, title, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.user.id, title, description]
      );

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET OPEN TASKS (HELPER)
 */
router.get(
  '/',
  requireAuth,
  requireRole('helper'),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT * FROM tasks WHERE status = 'open'`
      );

      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
