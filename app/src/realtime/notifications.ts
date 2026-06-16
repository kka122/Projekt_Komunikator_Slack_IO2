import type {Message} from "../api/models";
import {resolveAssetUrl} from "../config/api.ts";

/**
 * Desktop notifications for incoming messages, built on the browser
 * {@link https://developer.mozilla.org/docs/Web/API/Notifications_API Notifications API}.
 *
 * This is deliberately lightweight: notifications only fire while a tab is open
 * (the realtime socket lives there). There is no service worker or Web Push, so
 * nothing is delivered when the app is fully closed — {@link RealtimeProvider}
 * calls {@link notifyMessage} from its `message:new` handler instead.
 */

/** Whether the Notifications API is usable in this context. */
function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Ask for notification permission once, if the user hasn't already decided.
 * Safe to call repeatedly — it no-ops when already granted or denied, or when
 * the API is unavailable (e.g. non-secure context).
 */
export function ensureNotificationPermission(): void {
  if (!supported() || Notification.permission !== "default") return;
  // Ignore the returned promise: a denial is handled by notifyMessage's guard.
  void Notification.requestPermission().catch(() => undefined);
}

/** Trim a message body to a sensible notification length. */
function previewBody(message: Message): string {
  const text = message.content?.trim();
  if (text) return text.length > 120 ? `${text.slice(0, 119)}…` : text;
  if (message.attachments?.length) return "Sent an attachment";
  return "New message";
}

/**
 * Show a desktop notification for an incoming message. Clicking it focuses the
 * app and runs {@link onOpen} (used to navigate to the conversation). No-ops
 * unless permission has been granted. `tag` collapses repeat notifications from
 * the same conversation so a busy channel doesn't stack them.
 */
export function notifyMessage(
  message: Message,
  tag: string,
  onOpen: () => void,
): void {
  if (!supported() || Notification.permission !== "granted") return;

  const icon = resolveAssetUrl(message.sender.avatarUrl) || undefined;
  const notification = new Notification(`Szponcik from: ${message.sender.name} ${message.sender.surname}`, {
    body: previewBody(message),
    icon,
    tag,
    renotify: true,
  } as NotificationOptions & { renotify: boolean });

  notification.onclick = () => {
    window.focus();
    notification.close();
    onOpen();
  };
}
