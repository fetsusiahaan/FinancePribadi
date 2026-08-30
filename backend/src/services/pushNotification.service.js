import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseApp } from "../config/firebase.js";
import { deviceTokenRepository } from "../repositories/deviceToken.repository.js";
import { logBackend } from "../utils/logger.js";

export async function sendToUsers(userIds, data = {}) {
  const app = getFirebaseApp();
  if (!app || !userIds || userIds.length === 0) return;

  try {
    const tokens = await deviceTokenRepository.listTokensForUsers(userIds);
    if (!tokens || tokens.length === 0) return;

    const tokenStrings = tokens.map((t) => t.token);
    const messaging = getMessaging(app);

    const stringData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v ?? "")])
    );

    const response = await messaging.sendEachForMulticast({
      tokens: tokenStrings,
      data: stringData,
      android: {
        priority: "high",
      },
    });

    const staleTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const code = resp.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          staleTokens.push(tokenStrings[idx]);
        }
      }
    });

    if (staleTokens.length > 0) {
      await deviceTokenRepository.deleteByTokens(staleTokens);
      logBackend(`Pruned ${staleTokens.length} stale FCM device token(s)`);
    }
  } catch (err) {
    logBackend(`Failed to send push notification: ${err.message}`, true);
  }
}
