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

// 📧 Email/Password Login - Updated for new form
window.login = function (email, password, callback) {
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch((error) => {
      // Pass error message to callback
      if (callback) callback(error.message);
    });
};

// ✍️ Sign Up - Updated for new form
window.signUp = function (email, password, callback) {
  if (password.length < 6) {
    if (callback) callback("Password must be at least 6 characters");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch((error) => {
      // Pass error message to callback
      if (callback) callback(error.message);
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

