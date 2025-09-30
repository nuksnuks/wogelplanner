import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAtCoeXChO3S0lAxnM_sC573YEAkF9C0n0",
  authDomain: "wogelplanner.firebaseapp.com",
  projectId: "wogelplanner",
  storageBucket: "wogelplanner.firebasestorage.app",
  messagingSenderId: "170036169635",
  appId: "1:170036169635:web:2b510b6535978120d5e816",
  measurementId: "G-X8C26P0H5E"
};

// Prevent re-initialization in Next.js hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };