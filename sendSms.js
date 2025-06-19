// backend/sendSms.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID; // replace with your Twilio SID
const authToken = process.env.TWILIO_AUTH_TOKEN;   // replace with your Twilio Auth Token
const from = '+14844972350'; // replace with your Twilio phone number

const client = twilio(accountSid, authToken);

const sendSMS = async (to, body) => {
  try {
    const message = await client.messages.create({
      to,
      body,
      from,
    });

    console.log('Message sent:', message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendSMS;
