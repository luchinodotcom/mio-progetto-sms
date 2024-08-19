const express = require('express');
const twilio = require('twilio');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Oggetto per memorizzare i job pianificati
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
    const job = cron.schedule(scheduleTime, () => {
      sendSms(to, message);
    });

    const jobId = Date.now().toString();
    scheduledJobs[jobId] = job;

    res.json({ success: true, jobId: jobId, message: 'Message scheduled' });
  } else {
    // Invia il messaggio immediatamente
    sendSms(to, message)
      .then((sms) => {
        res.json({ success: true, messageId: sms.sid });
      })
      .catch((error) => {
        console.log(error); // Loggare l'errore completo
        res.status(500).json({ success: false, error: error.message });
      });
  }
});

function sendSms(to, message) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to
  });
}

app.get('/test', (req, res) => {
  res.send('Server is working!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));