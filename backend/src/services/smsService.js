const axios = require('axios');
require('dotenv').config();

let smsToken = null;
let tokenExpiry = null;

async function getToken() {
  if (smsToken && tokenExpiry && new Date() < tokenExpiry) {
    return smsToken;
  }
  try {
    const url = process.env.SMS_API_URL + '/auth/login';
    const res = await axios.post(url, {
      email: process.env.SMS_EMAIL,
      password: process.env.SMS_PASSWORD,
    });
    smsToken = res.data.data.token;
    tokenExpiry = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
    return smsToken;
  } catch (err) {
    console.error('SMS auth error:', err.message);
    throw new Error('SMS service unavailable');
  }
}

async function sendSMS(phone, message) {
  if (process.env.NODE_ENV === 'development') {
    console.log('SMS to ' + phone + ': ' + message);
    return { success: true, dev: true };
  }
  try {
    const token = await getToken();
    const url = process.env.SMS_API_URL + '/message/sms/send';
    const res = await axios.post(url, {
      mobile_phone: phone.replace('+', ''),
      message,
      from: process.env.APP_NAME || 'PayFlow',
    }, {
      headers: { Authorization: 'Bearer ' + token },
    });
    return { success: true, data: res.data };
  } catch (err) {
    console.error('SMS send error:', err.message);
    throw new Error('Failed to send SMS');
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendSMS, generateOTP };
