const axios = require('axios');
require('dotenv').config();

let smsToken = null;
let tokenExpiry = null;

// Get Eskiz.uz auth token
async function getToken() {
  if (smsToken && tokenExpiry && new Date() < tokenExpiry) {
    return smsToken;
  }
  try {
    const res = await axios.post(`${process.env.SMS_API_URL}/auth/login`, {
      email: process.env.SMS_EMAIL,
      password: process.env.SMS_PASSWORD,
    });
    smsToken = res.data.data.token;
    tokenExpiry = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000); // 28 days
    return smsToken;
  } catch (err) {
    console.error('SMS auth error:', err.message);
    throw new Error('SMS service unavailable');
  }
}

// Send SMS via Eskiz.uz
async function sendSMS(phone, message) {
  // In development, just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 SMS to ${phone}: ${message}`);
    return { success: true, dev: true };
  }

  try {
    const token = await getToken();
    const res = await axios.post(
      `${process.env.SMS_API_URL}/message/sms/send`,
      {
        mobile_phone: phone.replace('+', ''),
        message,
        from: process.env.APP_NAME || 'PayFlow',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return { success: true, data: res.data };
  } catch (err) {
    console.error('SMS send error:', err.message);
    throw new Error('Failed to send SMS');
  }
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendSMS, generateOTP };
