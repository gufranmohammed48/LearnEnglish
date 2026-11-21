// Things only the Android/iPhone app can do. On the website every function here is a no-op.
const CAP = typeof window !== "undefined" && window.Capacitor;
export const isNative = () => !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
const LN = () => isNative() && CAP.Plugins && CAP.Plugins.LocalNotifications;

const REMINDER_ID = 1001;
const CHANNEL = "daily-reminder";

/**
 * Sets (or clears, with time = null) the daily practice reminder.
 * time is "HH:MM" in the phone's local time. Returns false if the learner said no to notifications.
 */
export async function setReminder(time, title, body) {
  const ln = LN();
  if (!ln) return false;
  try { await ln.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch (e) {}
  if (!time) return true;
  let perm = await ln.checkPermissions().catch(() => ({}));
  if (perm.display !== "granted") perm = await ln.requestPermissions().catch(() => ({}));
  if (perm.display !== "granted") return false;
  try { await ln.createChannel({ id: CHANNEL, name: "Daily reminder", importance: 3, visibility: 1 }); } catch (e) {}
  const [hour, minute] = time.split(":").map(Number);
  await ln.schedule({
    notifications: [{
      id: REMINDER_ID,
      title,
      body,
      channelId: CHANNEL,
      schedule: { on: { hour, minute }, allowWhileIdle: true },
    }],
  });
  return true;
}
