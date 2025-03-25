// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA4mWXuslFAvvJ9eyeTPGdWDKhJhQKrwCc",
  authDomain: "confession-wall-e657b.firebaseapp.com",
  projectId: "confession-wall-e657b",
  storageBucket: "confession-wall-e657b.firebasestorage.app",
  messagingSenderId: "383015609414",
  appId: "1:383015609414:web:78bd7cec2c263dd7759647",
  measurementId: "G-8Z0V7MCFH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { db};
