// firebase-messaging-sw.js

// Importa Firebase
importScripts('https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.7/firebase-messaging.js');

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAxeC52iHSXK0gpeHiDg_mowlcSHIIG_5E",
  authDomain: "apprebbofficial.firebaseapp.com",
  projectId: "apprebbofficial",
  storageBucket: "apprebbofficial.appspot.com",
  messagingSenderId: "673841762670",
  appId: "1:673841762670:web:be41123fdf94167af5b17f",
  measurementId: "G-M541MTJZWV"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Ottieni un'istanza di Firebase Messaging per gestire le notifiche
const messaging = firebase.messaging();

// Gestione della ricezione delle notifiche quando l'applicazione è in background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Messaggio ricevuto in background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'  // Puoi specificare l'icona da mostrare nella notifica
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
