
import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { pool } from '../db.js';
const r=express.Router();

r.get('/me',requireAuth,async(req,res)=>{
  const u=await pool.query('SELECT id,email,role,is_verified FROM users WHERE id=$1',[req.user.id]);
  res.json(u.rows[0]);
});

r.post('/role',requireAuth,async(req,res)=>{
  const {role}=req.body;
  await pool.query('UPDATE users SET role=$1 WHERE id=$2 AND role IS NULL',[role,req.user.id]);
  res.json({role});
});

export default r;
