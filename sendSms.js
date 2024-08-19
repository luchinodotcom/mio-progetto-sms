require('dotenv').config(); // Assicurati di installare dotenv con `npm install dotenv`
const twilio = require('twilio');

// Ottieni le credenziali da variabili ambientali
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Inizializza il client Twilio
const client = new twilio(accountSid, authToken);

// Funzione per inviare un SMS
async function sendSms(to, body) {
  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log(`Message sent with SID: ${message.sid}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

// Esempio di invio SMS
sendSms('+393920590880', 'ciao');
