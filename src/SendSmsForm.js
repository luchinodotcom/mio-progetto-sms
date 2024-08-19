// src/SendSmsForm.js

import React, { useState } from 'react';

function SendSmsForm() {
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Funzione per validare il numero di telefono in base al prefisso
  const validatePhoneNumber = () => {
    const number = phoneNumber.replace(/\D/g, ''); // Rimuove i caratteri non numerici

    if (countryCode === '+39' && number.length !== 10) {
      return 'Il numero di telefono italiano deve avere 10 cifre.';
    }
    if (countryCode === '+1' && number.length !== 10) {
      return 'Il numero di telefono americano deve avere 10 cifre.';
    }
    return null;
  };

  const handleSendSms = () => {
    const validationError = validatePhoneNumber();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    fetch('http://localhost:3001/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: `${countryCode}${phoneNumber}`,  // Aggiungi il prefisso al numero
        body: message,
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('SMS inviato con successo!');
        setError('');
      } else {
        setError('Errore nell\'invio dell\'SMS: ' + data.error);
      }
    })
    .catch(error => setError('Errore: ' + error));
  };

  return (
    <div>
      <h1>Invia un SMS</h1>
      
      {/* Seleziona il prefisso del paese */}
      <select
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
      >
        <option value="">Seleziona il prefisso</option>
        <option value="+39">Italia (+39)</option>
        <option value="+1">USA (+1)</option>
      </select>

      {/* Input per il numero di telefono */}
      <input
        type="text"
        placeholder={`Numero di telefono ${countryCode === '+39' ? '(10 cifre)' : countryCode === '+1' ? '(10 cifre)' : ''}`}
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      
      {/* Input per il messaggio */}
      <textarea
        placeholder="Messaggio"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      
      {/* Pulsante per inviare l'SMS */}
      <button onClick={handleSendSms}>Invia SMS</button>
      
      {/* Mostra errori, se presenti */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default SendSmsForm;
