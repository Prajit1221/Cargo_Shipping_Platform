import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALlxQUsWfyjwsY0ajjJR3Goux-usY47aU",
  authDomain: "cargo-shipping-89b2e.firebaseapp.com",
  projectId: "cargo-shipping-89b2e",
  storageBucket: "cargo-shipping-89b2e.firebasestorage.app",
  messagingSenderId: "165808147357",
  appId: "1:165808147357:web:b4ecbe7341158278e67d74",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
