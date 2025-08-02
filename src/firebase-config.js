import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuNi5yRgG5zi125rq8MLbIQ9l-cd_JRT4",
  authDomain: "vilora-45dad.firebaseapp.com",
  projectId: "vilora-45dad",
  storageBucket: "vilora-45dad.appspot.com",
  messagingSenderId: "361414622031",
  appId: "1:361414622031:web:2a1db92ac813f319b3e33a",
  measurementId: "G-L1H3VL124Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Auth and Storage
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);