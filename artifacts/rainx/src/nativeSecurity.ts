import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { SecureStorage, KeychainAccess } from "@aparajita/capacitor-secure-storage";
import { supabase } from "./supabaseClient";

const PREFIX = "rainx_";
const CONFIG_EVENT = "rainx:native-lock-config-changed";
const SESSION_UNLOCK_KEY = "rainx:native-unlocked-session";

const LEGACY_KEYS = {
  pinHash: `${PREFIX}pin_hash`,
  pinEnabled: `${PREFIX}pin_enabled`,
  appLock: `${PREFIX}app_lock`,
  biometric: `${PREFIX}biometric_enabled`,
  pinLength: `${PREFIX}pin_length`,
};

function keySet(accountId?: string) {
  const scope = accountId ? accountId.replace(/[^a-zA-Z0-9_-]/g, "_") : "device";
  return {
    appLock: `${PREFIX}${scope}_app_lock`,
    biometric: `${PREFIX}${scope}_biometric_enabled`,
  };
}

export type NativeLockConfig = {
  pinEnabled: boolean;
  appLock: boolean;
  biometricEnabled: boolean;
  pinLength: number;
  pinLengthKnown: boolean;
  pinRegistrationRequired: boolean;
  biometricRegistrationRequired: boolean;
};

const native = () => Capacitor.isNativePlatform();

function emitConfigChanged() {
  try { window.dispatchEvent(new Event(CONFIG_EVENT)); } catch {}
}

export function hasNativeUnlockedSession(accountId?: string) {
  if (!accountId || typeof sessionStorage === "undefined") return false;
  try { return sessionStorage.getItem(SESSION_UNLOCK_KEY) === accountId; } catch { return false; }
}

export function markNativeSessionUnlocked(accountId?: string) {
  if (!accountId || typeof sessionStorage === "undefined") return;
  try { sessionStorage.setItem(SESSION_UNLOCK_KEY, accountId); } catch {}
}

export function clearNativeSessionUnlock() {
  if (typeof sessionStorage === "undefined") return;
  try { sessionStorage.removeItem(SESSION_UNLOCK_KEY); } catch {}
}

async function secureSet(key: string, value: string) {
  if (!native()) return;
  await SecureStorage.set(key, value, true, false, KeychainAccess.whenUnlockedThisDeviceOnly);
}

async function secureGet(key: string): Promise<string | null> {
  if (!native()) return null;
  try {
    const value = await SecureStorage.get(key);
    return value == null ? null : String(value);
  } catch { return null; }
}

async function secureRemove(key: string) {
  if (!native()) return;
  try { await SecureStorage.remove(key); } catch {}
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function resolveAccountId(accountId?: string) {
  if (accountId) return accountId;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || undefined;
  } catch { return undefined; }
}

async function getBackendSecurityPrefs(accountId?: string) {
  if (!accountId) return {};
  try {
    const { data } = await supabase.from("account_settings")
      .select("security_prefs").eq("user_id", accountId).maybeSingle();
    return data?.security_prefs && typeof data.security_prefs === "object" ? data.security_prefs : {};
  } catch { return {}; }
}

async function removeLegacyPinArtifacts(accountId?: string) {
  if (!native()) return;
  const scope = accountId ? accountId.replace(/[^a-zA-Z0-9_-]/g, "_") : "device";
  const keys = new Set([
    LEGACY_KEYS.pinHash, LEGACY_KEYS.pinEnabled, LEGACY_KEYS.pinLength,
    `${PREFIX}${scope}_pin_hash`,
    `${PREFIX}${scope}_pin_enabled`,
    `${PREFIX}${scope}_pin_length`,
    `${PREFIX}device_pin_hash`,
    `${PREFIX}device_pin_enabled`,
    `${PREFIX}device_pin_length`,
  ]);
  await Promise.all([...keys].map(secureRemove));
}

async function getBackendPinStatus(accountId?: string) {
  if (!accountId) return { pin_exists: false, pin_length: null, locked_until: null };
  try {
    const { data, error } = await supabase.rpc("get_my_pin_status");
    if (error || !data || typeof data !== "object") return { pin_exists: false, pin_length: null, locked_until: null };
    return data;
  } catch { return { pin_exists: false, pin_length: null, locked_until: null }; }
}

export async function getNativeLockConfig(accountId?: string): Promise<NativeLockConfig> {
  const resolved = await resolveAccountId(accountId);
  const [backend, pinStatus] = await Promise.all([
    getBackendSecurityPrefs(resolved),
    getBackendPinStatus(resolved),
  ]);
  const pinEnabled = pinStatus.pin_exists === true;
  const backendBiometric = backend.biometricEnabled === true;
  const pinRegistrationRequired = !pinEnabled && (
    backend.pinEnabled === true || backendBiometric || backend.appLock === true
  );

  if (!native()) {
    return {
      pinEnabled,
      appLock: pinEnabled || backend.appLock === true || backendBiometric,
      biometricEnabled: backendBiometric,
      pinLength: Math.max(4, Math.min(6, Number(pinStatus.pin_length) || 4)),
      pinLengthKnown: Number(pinStatus.pin_length) >= 4 && Number(pinStatus.pin_length) <= 6,
      pinRegistrationRequired,
      biometricRegistrationRequired: false,
    };
  }

  await removeLegacyPinArtifacts(resolved);
  const keys = keySet(resolved);
  const [localAppLock, localBiometric] = await Promise.all([
    secureGet(keys.appLock), secureGet(keys.biometric),
  ]);
  const biometricEnabled = localBiometric === "1";
  const pinLength = Number(pinStatus.pin_length) || 4;

  return {
    pinEnabled,
    appLock: pinEnabled || localAppLock === "1" || backend.appLock === true || biometricEnabled,
    biometricEnabled,
    pinLength: Math.max(4, Math.min(6, pinLength)),
    pinLengthKnown: pinLength >= 4 && pinLength <= 6,
    pinRegistrationRequired,
    biometricRegistrationRequired: pinEnabled && backendBiometric && !biometricEnabled,
  };
}

export async function saveNativePin(pin: string, accountId?: string) {
  if (!/^[0-9]{4,6}$/.test(pin)) throw new Error("PIN must contain 4–6 digits.");
  const resolved = await resolveAccountId(accountId);
  if (!resolved) throw new Error("Your account session is not ready.");
  const { error } = await supabase.rpc("set_my_pin", { p_pin: pin });
  if (error) throw new Error(error.message || "Unable to save PIN securely.");
  await removeLegacyPinArtifacts(resolved);
  emitConfigChanged();
}

export async function verifyNativePin(pin: string, accountId?: string): Promise<boolean> {
  if (!/^[0-9]{4,6}$/.test(pin)) return false;
  const resolved = await resolveAccountId(accountId);
  if (!resolved) return false;
  try {
    const { data, error } = await supabase.rpc("verify_my_pin", { p_pin: pin });
    if (error) return false;
    if (data?.locked_until) throw new Error("Too many incorrect PIN attempts. Try again later.");
    return data?.success === true;
  } catch (error) {
    if (error?.message === "Too many incorrect PIN attempts. Try again later.") throw error;
    return false;
  }
}

export async function disableNativePin(first: string, second?: string) {
  let pin = first;
  let accountId = second;
  if (!/^[0-9]{4,6}$/.test(first) && /^[0-9]{4,6}$/.test(second || "")) {
    accountId = first;
    pin = second as string;
  }
  if (!/^[0-9]{4,6}$/.test(pin)) throw new Error("Enter your current PIN.");
  const resolved = await resolveAccountId(accountId);
  if (!resolved) throw new Error("Your account session is not ready.");
  const { data, error } = await supabase.rpc("delete_my_pin", { p_pin: pin });
  if (error) throw new Error(error.message || "Unable to remove PIN.");
  if (data?.locked_until) throw new Error("Too many incorrect PIN attempts. Try again later.");
  if (data?.deleted !== true) throw new Error("Incorrect PIN.");
  await removeLegacyPinArtifacts(resolved);
  clearNativeSessionUnlock();
  emitConfigChanged();
}

export async function setNativeAppLock(enabled: boolean, accountId?: string) {
  const resolved = await resolveAccountId(accountId);
  if (!resolved) throw new Error("Your account session is not ready.");
  if (!native()) {
    const config = await getNativeLockConfig(resolved);
    if (enabled && !config.pinEnabled) {
      throw new Error("Set up a PIN before enabling App Lock.");
    }
    if (!enabled) clearNativeSessionUnlock();
    emitConfigChanged();
    return;
  }
  if (!resolved) throw new Error("Your account session is not ready.");

  const config = await getNativeLockConfig(resolved);
  if (enabled && !config.pinEnabled) {
    throw new Error("Set up a PIN before enabling App Lock.");
  }

  await secureSet(keySet(resolved).appLock, enabled ? "1" : "0");
  if (!enabled) clearNativeSessionUnlock();
  emitConfigChanged();
}

export async function setNativeBiometricEnabled(enabled: boolean, accountId?: string) {
  if (!native()) throw new Error("Biometrics are available in the native app only.");
  const resolved = await resolveAccountId(accountId);
  if (!resolved) throw new Error("Your account session is not ready.");
  const keys = keySet(resolved);

  if (enabled) {
    const config = await getNativeLockConfig(resolved);
    if (!config.pinEnabled) throw new Error("Set up a PIN before enabling biometric unlock.");
    const result = await BiometricAuth.checkBiometry();
    if (!result.isAvailable) {
      throw new Error("No app-usable biometric authentication is enrolled on this device.");
    }

    await BiometricAuth.authenticate({
      reason: "Confirm your identity to enable RainX biometric lock",
      cancelTitle: "Cancel",
      allowDeviceCredential: true,
      iosFallbackTitle: "Use passcode",
      androidTitle: "Enable RainX biometric lock",
      androidSubtitle: "Confirm your device identity",
      androidConfirmationRequired: false,
    });

    await secureSet(keys.biometric, "1");
    await secureSet(keys.appLock, "1");
  } else {
    await secureSet(keys.biometric, "0");
    const config = await getNativeLockConfig(resolved);
    if (!config.pinEnabled) await secureSet(keys.appLock, "0");
  }

  emitConfigChanged();
}

export async function getNativeBiometryInfo() {
  if (!native()) return null;
  try { return await BiometricAuth.checkBiometry(); } catch { return null; }
}

export async function authenticateNativeLock(accountId?: string): Promise<boolean> {
  if (!native()) return false;
  const config = await getNativeLockConfig(accountId);
  if (!config.appLock || !config.biometricEnabled) return false;

  try {
    await BiometricAuth.authenticate({
      reason: "Unlock RainX",
      cancelTitle: "Use PIN",
      allowDeviceCredential: false,
      iosFallbackTitle: "Use PIN",
      androidTitle: "Unlock RainX",
      androidSubtitle: "Confirm your identity",
      androidConfirmationRequired: false,
    });
    return true;
  } catch { return false; }
}

export async function getNativeDeviceInfo() {
  if (!native()) return null;
  const [id, info, app] = await Promise.all([Device.getId(), Device.getInfo(), App.getInfo()]);
  return {
    deviceId: id.identifier,
    platform: info.platform,
    name: info.name || null,
    model: info.model || null,
    manufacturer: info.manufacturer || null,
    osVersion: info.osVersion || null,
    appVersion: app.version || app.build || "unknown",
  };
}

export async function registerNativeDeviceSession() {
  if (!native()) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const device = await getNativeDeviceInfo();
  if (!device) return;
  await supabase.rpc("register_my_device_session", {
    p_device_id: device.deviceId,
    p_platform: device.platform,
    p_device_name: device.name,
    p_manufacturer: device.manufacturer,
    p_model: device.model,
    p_os_version: device.osVersion,
    p_app_version: device.appVersion,
  });
}

export async function recordNativeLogin() {
  if (!native()) return;
  const device = await getNativeDeviceInfo();
  if (!device) return;
  await supabase.rpc("record_my_login_event", {
    p_device_id: device.deviceId,
    p_platform: device.platform,
    p_device_name: device.name,
    p_model: device.model,
    p_os_version: device.osVersion,
    p_app_version: device.appVersion,
  });
}

export async function attachNativeResumeListener(onLocked: () => void, accountId?: string) {
  if (!native()) return { remove: async () => {} };
  let wasBackgrounded = false;
  return App.addListener("appStateChange", async ({ isActive }) => {
    if (!isActive) {
      wasBackgrounded = true;
      return;
    }
    if (!wasBackgrounded) return;
    wasBackgrounded = false;
    const config = await getNativeLockConfig(accountId);
    if (config.appLock) {
      clearNativeSessionUnlock();
      onLocked();
    }
    await registerNativeDeviceSession().catch(() => {});
  });
}
