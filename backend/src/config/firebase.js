import admin from "firebase-admin";
import { cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "./env.js";
import { logBackend } from "../utils/logger.js";

let app = null;

export function getFirebaseApp() {
  if (app) return app;
  if (!env.firebaseServiceAccount) {
    return null;
  }

  try {
    app = initializeApp({
      credential: cert(env.firebaseServiceAccount),
    });
    logBackend("Firebase Admin SDK initialized successfully");
    return app;
  } catch (err) {
    logBackend(`Firebase Admin initialization error: ${err.message}`, true);
    return null;
  }
}
