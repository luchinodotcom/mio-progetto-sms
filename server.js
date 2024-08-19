const express = require('express');
const twilio = require('twilio');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

let client;
try {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('Twilio client initialized successfully');
} catch (error) {
  console.error('Error initializing Twilio client:', error);
}

console.log('Environment variables:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);

const scheduledJobs = {};

app.post('/api/send-sms', (req, res) => {
  console.log('Received a POST request to /api/send-sms');
  console.log('Request body:', req.body);

  const { to, message, scheduleTime } = req.body;

  if (!to || !message) {
    console.log('Missing parameters');
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  if (scheduleTime) {
    // Pianifica l'invio del messaggio
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
    // Invia il messaggio immediatamente
    sendSms(to, message)
      .then((sms) => {
        res.json({ success: true, messageId: sms.sid });
      })
      .catch((error) => {
        console.error('Error sending SMS:', error);
        res.status(500).json({ success: false, error: error.message });
      });
  }
});

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

app.get('/test', (req, res) => {
  res.send('Server is working!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/send-sms`);
});