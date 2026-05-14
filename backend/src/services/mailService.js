const nodemailer = require('nodemailer');
const env = require('../config/env');

function canSendMail() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFrom);
}

async function sendPasswordResetCode(to, code) {
  if (!canSendMail()) {
    console.log(`Codigo de recuperacion SATI-TIMSA para ${to}: ${code}`);
    return { sent: false, code };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: 'Codigo de recuperacion SATI-TIMSA',
    text: `Tu codigo de verificacion SATI-TIMSA es: ${code}. Expira en 10 minutos.`
  });

  return { sent: true };
}

module.exports = { sendPasswordResetCode };
