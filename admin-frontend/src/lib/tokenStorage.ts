/**
 * Wraps localStorage/sessionStorage so the rest of the app never has to
 * know which one is in play. "Remember me" decides the backing store:
 *  - checked   -> localStorage   (survives closing the browser)
 *  - unchecked -> sessionStorage (cleared when the tab closes)
 *
 * The "remember" flag itself always lives in localStorage so we know,
 * on next app load, which store to read the tokens back from.
 */

const REMEMBER_FLAG = "auth:remember";

const KEYS = {
  accessToken: "auth:accessToken",
  refreshToken: "auth:refreshToken",
  admin: "auth:admin",
} as const;

function activeStore(): Storage {
  const remember = localStorage.getItem(REMEMBER_FLAG) === "true";
  return remember ? localStorage : sessionStorage;
}

export const tokenStorage = {
  save(
    tokens: { accessToken: string; refreshToken: string },
    admin: unknown,
    remember: boolean,
  ) {
    // Clear both stores first so a switched preference doesn't leave
    // stale tokens sitting in the other one.
    this.clear();

    localStorage.setItem(REMEMBER_FLAG, String(remember));
    const store = remember ? localStorage : sessionStorage;

    store.setItem(KEYS.accessToken, tokens.accessToken);
    store.setItem(KEYS.refreshToken, tokens.refreshToken);
    store.setItem(KEYS.admin, JSON.stringify(admin));
  },

  updateTokens(tokens: { accessToken: string; refreshToken: string }) {
    const store = activeStore();
    store.setItem(KEYS.accessToken, tokens.accessToken);
    store.setItem(KEYS.refreshToken, tokens.refreshToken);
  },

  getAccessToken(): string | null {
    return activeStore().getItem(KEYS.accessToken);
  },

  getRefreshToken(): string | null {
    return activeStore().getItem(KEYS.refreshToken);
  },

   getAdmin<T>(): T | null {
    const raw = activeStore().getItem(KEYS.admin);
    if (!raw || raw === "undefined") return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  clear() {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(KEYS.accessToken);
      store.removeItem(KEYS.refreshToken);
      store.removeItem(KEYS.admin);
    }
    localStorage.removeItem(REMEMBER_FLAG);
  },
};