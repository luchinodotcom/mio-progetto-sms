const twilio = require('twilio');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.handler = async (req, res) => {
  if (req.method === 'POST') {
    const { to, message, scheduleTime } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    if (scheduleTime) {
      try {
        cron.schedule(scheduleTime, async () => {
          await sendSms(to, message);
        });
        return res.json({ success: true, message: 'Message scheduled' });
      } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to schedule message' });
      }
    } else {
      try {
        const sms = await sendSms(to, message);
        return res.json({ success: true, messageId: sms.sid });
      } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
};

async function sendSms(to, message) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to
  });
}
