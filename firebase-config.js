// Firebase Yapılandırması ve Başlatılması

const firebaseConfig = {
  apiKey: "AIzaSyAyvbfgzhx25uqMgRt-CHu2Qmz5T0qeBbs",
  authDomain: "bitki-kesif-portali.firebaseapp.com",
  projectId: "bitki-kesif-portali",
  storageBucket: "bitki-kesif-portali.firebasestorage.app",
  messagingSenderId: "618074227297",
  appId: "1:618074227297:web:0a6b14476d6008285ba020",
  measurementId: "G-KMCWNM0SEQ"
};

// Firebase SDK başlatma (Compat Modu)
let auth;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
} else {
    console.warn("Firebase SDK henüz yüklenmedi.");
}
