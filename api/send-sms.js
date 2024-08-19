const twilio = require('twilio');
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const scheduledJobs = {};

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    console.log('Received a POST request to /api/send-sms');
    console.log('Request body:', req.body);

    const { to, message, scheduleTime } = req.body;

    if (!to || !message) {
      console.log('Missing parameters');
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    if (scheduleTime) {
      try {
        const job = cron.schedule(scheduleTime, () => {
          sendSms(to, message);
        });

        const jobId = Date.now().toString();
        scheduledJobs[jobId] = job;

        res.json({ success: true, jobId: jobId, message: 'Message scheduled' });
      } catch (error) {
        console.error('Error scheduling message:', error);
        res.status(500).json({ success: false, error: 'Failed to schedule message' });
      }
    } else {
      try {
        const sms = await sendSms(to, message);
        res.json({ success: true, messageId: sms.sid });
      } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
};

function sendSms(to, message) {
  console.log('Attempting to send SMS:', { to, message });
  if (!client) {
    console.error('Twilio client not initialized');
    return Promise.reject(new Error('Twilio client not initialized'));
  }
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to
  }).then(sms => {
    console.log('SMS sent successfully:', sms.sid);
    return sms;
  }).catch(error => {
    console.error('Error sending SMS:', error);
    throw error;
  });
}
