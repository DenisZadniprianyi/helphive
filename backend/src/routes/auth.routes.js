
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { generateToken } from '../utils/token.util.js';
import { sendVerificationEmail } from '../services/email.service.js';

const r = express.Router();

r.post('/register', async (req,res,next)=>{
  const {email,password}=req.body;
  const hash=await bcrypt.hash(password,12);
  const u=await pool.query(
    'INSERT INTO users(email,password,is_verified) VALUES($1,$2,false) RETURNING id,email',
    [email,hash]
  );
  const token=generateToken();
  await pool.query(
    'INSERT INTO email_verifications(user_id,token,expires_at) VALUES($1,$2,NOW()+interval '1 day')',
    [u.rows[0].id,token]
  );
  await sendVerificationEmail(email,`${process.env.APP_URL}/api/auth/verify/${token}`);
  res.json({message:'Registered, verify email'});
});

r.get('/verify/:token', async(req,res)=>{
  const t=req.params.token;
  const v=await pool.query('SELECT * FROM email_verifications WHERE token=$1 AND expires_at>NOW()',[t]);
  if(!v.rows.length) return res.status(400).json({message:'Invalid'});
  await pool.query('UPDATE users SET is_verified=true WHERE id=$1',[v.rows[0].user_id]);
  res.json({message:'Verified'});
});

r.post('/login', async(req,res)=>{
  const {email,password}=req.body;
  const u=(await pool.query('SELECT * FROM users WHERE email=$1',[email])).rows[0];
  if(!u||!u.is_verified||!await bcrypt.compare(password,u.password))
    return res.status(401).json({message:'Invalid'});
  const token=jwt.sign({id:u.id,role:u.role},process.env.JWT_SECRET,{expiresIn:'15m'});
  res.json({token,user:{id:u.id,email:u.email,role:u.role}});
});

export default r;
