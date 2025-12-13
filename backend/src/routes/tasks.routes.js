
import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { pool } from '../db.js';
const r=express.Router();

r.post('/',requireAuth,requireRole('client'),async(req,res)=>{
  const t=await pool.query(
    'INSERT INTO tasks(client_id,title,description) VALUES($1,$2,$3) RETURNING *',
    [req.user.id,req.body.title,req.body.description]
  );
  res.json(t.rows[0]);
});

r.get('/',requireAuth,requireRole('helper'),async(req,res)=>{
  const t=await pool.query('SELECT * FROM tasks WHERE status='open'');
  res.json(t.rows);
});

export default r;
