// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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
  }
});

// 🚪 Logout (exposed globally)
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};
