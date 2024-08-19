import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Alert, 
  Container, 
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import io from 'socket.io-client';
import SendSmsForm from './SendSmsForm';  // Importa il nuovo componente
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';  // Icona per l'aereo
import axios from 'axios';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO, format, addHours, subHours } from 'date-fns';


const socket = io('http://localhost:3000');

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e88e5',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const Clock = ({ timezone, city }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)' }}>
      <Typography variant="h6" sx={{ color: 'white' }}>{city}</Typography>
      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>{formatTime(time)}</Typography>
    </Paper>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('');
  const [message, setMessage] = useState('');
  const [receivedMessage, setReceivedMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [prefix, setPrefix] = useState('+39');
  const [scheduleTime, setScheduleTime] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Ascolta i messaggi ricevuti
    socket.on('receive_message', (data) => {
      setReceivedMessage(data);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const handleLogin = () => {
    const phoneNumberPattern = /^3\d{9}$/;
    if (!username || !phoneNumber || !timezone) {
      setError('Please fill in all fields');
      return;
    }
    if (!phoneNumberPattern.test(phoneNumber)) {
      setError('Please enter a valid Italian phone number (10 digits, starts with 3)');
      return;
    }
    const newUser = { username, phoneNumber, timezone };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setUsername('');
    setPhoneNumber('');
    setTimezone('');
  };

  const handleSendMessage = async () => {
    if (!message || !phoneNumber) {
      setError('Please enter both a message and a phone number');
      return;
    }
    try {
      const payload = {
        to: prefix + phoneNumber,
        message: message
      };

      if (scheduleTime) {
        let adjustedTime;
        
        if (user.timezone === 'Europe/Rome') {
          // Se l'utente è a Napoli, invia l'orario come orario americano
          adjustedTime = addHours(scheduleTime, 6);
        } else if (user.timezone === 'America/New_York') {
          // Se l'utente è ad Atlanta, invia l'orario come orario italiano
          adjustedTime = subHours(scheduleTime, 6);
        }
  
        payload.scheduleTime = format(adjustedTime, "mm HH dd MM *");
      }

      const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/send-sms'
      : '/api/send-sms';

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
      }
    });
      
      if (response.data.success) {
        setMessage('');
        setPhoneNumber('');
        setScheduleTime(null);
        setSuccess(scheduleTime ? 'SMS scheduled successfully!' : 'SMS sent successfully!');
      } else {
        setError('Failed to send SMS: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setError(`An error occurred while sending the SMS: ${error.message}. Status: ${error.response?.status}`);
    }
  };
  
  const formatScheduleTime = (time) => {
    if (!time) return '';
    let adjustedTime;

  if (user.timezone === 'Europe/Rome') {
    adjustedTime = addHours(time, 6); // Mostra l'orario americano se l'utente è a Napoli
  } else if (user.timezone === 'America/New_York') {
    adjustedTime = subHours(time, 6); // Mostra l'orario italiano se l'utente è ad Atlanta
  }

  return format(adjustedTime, `dd/MM/yyyy HH:mm 'in ${user.timezone === 'Europe/Rome' ? 'Atlanta' : 'Naples'}'`);
};

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.primary.main, textAlign: 'center' }}>
            Login
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            variant="outlined"
            // Aggiungi la validazione per il numero di telefono qui
            inputProps={{ pattern: user ? null : '(\\+39|\\+1)[0-9]{10}' }}
          />
          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel>Timezone</InputLabel>
            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              label="Timezone"
            >
              <MenuItem value="Europe/Rome">Naples</MenuItem>
              <MenuItem value="America/New_York">Atlanta</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogin}
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
  <Paper elevation={3} sx={{ p: 4, backgroundColor: 'white' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" component="h1" sx={{ color: theme.palette.primary.main }}>
        Atlanta <FlightTakeoffIcon sx={{ mx:1 }} /> Napoli
      </Typography>
      <Button 
        variant="outlined" 
        color="primary" 
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Box>
    <Divider sx={{ my: 2 }} />

    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6}>
        <Clock timezone="Europe/Rome" city="Napoli" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Clock timezone="America/New_York" city="Atlanta" />
      </Grid>
    </Grid>

    <Box sx={{ backgroundColor: '#e3f2fd', p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
        Invia SMS
      </Typography>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={3}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Prefisso</InputLabel>
            <Select
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              label="Prefisso"
            >
              <MenuItem value="+39">+39 (Italia)</MenuItem>
              <MenuItem value="+1">+1 (USA)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={9}>
          <TextField
            fullWidth
            label="Numero di telefono"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            variant="outlined"
          />
        </Grid>
      </Grid>
      <TextField
        fullWidth
        margin="normal"
        label="Messaggio"
        multiline
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        variant="outlined"
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Il messaggio arriverà alle sue:
          </Typography>
          <DateTimePicker
            label="Orario di invio"
            value={scheduleTime}
            onChange={(newValue) => setScheduleTime(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                margin="normal"
              />
            )}
            ampm={false}
            format="dd/MM/yyyy HH:mm"
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            ({user.timezone === 'Europe/Rome' ? 'Orario di Atlanta' : 'Orario di Napoli'})
          </Typography>
        </Box>
      </LocalizationProvider>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSendMessage}
        fullWidth
        sx={{ mt: 2 }}
      >
        {scheduleTime ? 'Programma SMS' : 'Invia SMS'}
      </Button>
      {receivedMessage && (
        <Typography sx={{ mt: 2, color: 'green' }}>
          Nuovo messaggio: {receivedMessage}
        </Typography>
      )}
    </Box>
  </Paper>
</Container>
  );
};

const WrappedApp = () => (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);

export default WrappedApp;
