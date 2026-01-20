// 🔥 Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyD4z857J2ipSxqK8pN4tEWqU-jeK_mwA2I",
  authDomain: "ClassManager.firebaseapp.com",
  projectId: "class-manager-383ad",
  appId: "1:1085651561679:web:82ca82d59d6ff2ec671bba"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ===============================
// ✅ EXPOSE FUNCTIONS TO HTML
// ===============================

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch(err => alert(err.message));
};

window.signUp = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch(err => alert(err.message));
};

window.googleLogin = function () {
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch(err => alert(err.message));
};
