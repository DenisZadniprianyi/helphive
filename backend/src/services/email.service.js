
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export const sendVerificationEmail = (email, link) =>
  transporter.sendMail({
    from: 'Helphive',
    to: email,
    subject: 'Verify account',
    html: `<a href="${link}">Verify</a>`
  });
