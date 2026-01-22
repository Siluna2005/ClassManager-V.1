// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyD4z857J2ipSxqK8pN4tEWqU-jeK_mwA2I",
  authDomain: "class-manager-383ad.firebaseapp.com",
  projectId: "class-manager-383ad",
  appId: "1:1085651561679:web:82ca82d59d6ff2ec671bba"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔐 Protect app.html
onAuthStateChanged(auth, (user) => {
  if (!user && window.location.pathname.includes("app.html")) {
    window.location.href = "index.html";
  } else if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "app.html";
  }
});

// 📧 Email/Password Login
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
};

// ✍️ Sign Up
window.signUp = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch((error) => {
      alert("Sign up failed: " + error.message);
    });
};

// 🔵 Google Login
window.googleLogin = function () {
  const provider = new GoogleAuthProvider();
  
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch((error) => {
      alert("Google login failed: " + error.message);
    });
};

// 🚪 Logout (exposed globally)
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};
