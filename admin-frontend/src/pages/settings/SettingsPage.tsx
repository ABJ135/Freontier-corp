import { useEffect, useState } from "react";
import {
  Bell,
  Globe,
  Lock,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  User,
  Store,
  Mail,
  DollarSign,
  Image,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";
import { getAdminProfile, updateAdminPreferences } from "../../services/authApi";
import { getStoreSettings, updateStoreSettings } from "../../services/settingsApi";
import type { StoreSettings } from "../../types/settings";

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { admin } = useAuthStore();
  const isDark = theme === "dark";

  const [notifyLowStock, setNotifyLowStock] = useState<boolean>(true);
  const [notifyNewOrder, setNotifyNewOrder] = useState<boolean>(true);

  // ── Store Config state ──────────────────────────────────────────
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    supportEmail: "",
    currency: "",
    logoUrl: "",
  });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Fetch admin preferences on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchPreferences() {
      try {
        const data = await getAdminProfile();
        if (isMounted && data) {
          if (typeof data.notifyLowStock === "boolean") {
            setNotifyLowStock(data.notifyLowStock);
          }
          if (typeof data.notifyNewOrder === "boolean") {
            setNotifyNewOrder(data.notifyNewOrder);
          }
        }
      } catch (error) {
        console.warn("Could not load notification preferences from server:", error);
      }
    }
    fetchPreferences();
    return () => { isMounted = false; };
  }, []);

  // Fetch store settings on mount
  useEffect(() => {
    let isMounted = true;
    setStoreLoading(true);
    getStoreSettings()
      .then((data) => {
        if (!isMounted) return;
        setStoreSettings(data);
        setStoreForm({
          storeName: data.storeName ?? "",
          supportEmail: data.supportEmail ?? "",
          currency: data.currency ?? "",
          logoUrl: data.logoUrl ?? "",
        });
      })
      .catch((err) => {
        if (isMounted) {
          setStoreError("Failed to load store settings.");
          console.warn(err);
        }
      })
      .finally(() => { if (isMounted) setStoreLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const handleToggleLowStock = async () => {
    const nextVal = !notifyLowStock;
    setNotifyLowStock(nextVal);
    try {
      await updateAdminPreferences({ notifyLowStock: nextVal });
    } catch (error) {
      console.warn("Failed to save low stock preference to server:", error);
    }
  };

  const handleToggleNewOrder = async () => {
    const nextVal = !notifyNewOrder;
    setNotifyNewOrder(nextVal);
    try {
      await updateAdminPreferences({ notifyNewOrder: nextVal });
    } catch (error) {
      console.warn("Failed to save new order preference to server:", error);
    }
  };

  const handleStoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreSaving(true);
    setStoreError(null);
    try {
      const updated = await updateStoreSettings({
        storeName: storeForm.storeName || undefined,
        supportEmail: storeForm.supportEmail || undefined,
        currency: storeForm.currency || undefined,
        logoUrl: storeForm.logoUrl || undefined,
      });
      setStoreSettings(updated);
      setStoreSaved(true);
      setTimeout(() => setStoreSaved(false), 2500);
    } catch (err) {
      setStoreError("Failed to save store settings. Please try again.");
      console.warn(err);
    } finally {
      setStoreSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="font-[Space_Grotesk] text-2xl font-bold text-text-primary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure your workspace preferences and account options.
        </p>
      </div>

      <div className="space-y-4">
        {/* ── Profile section ── */}
        <SettingsSection
          title="Account"
          description="Your admin profile information"
          icon={<User size={17} className="text-accent" />}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {admin?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary">{admin?.name ?? "—"}</p>
              <p className="text-sm text-text-secondary">{admin?.email ?? "—"}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                <ShieldCheck size={10} /> {admin?.role ?? "—"}
              </span>
            </div>
          </div>
        </SettingsSection>

        {/* ── Store Configuration ── */}
        <SettingsSection
          title="Store Configuration"
          description="Manage your store's public details"
          icon={<Store size={17} className="text-violet-500" />}
        >
          {storeLoading ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm text-text-muted">
              <Loader2 size={16} className="animate-spin" />
              Loading store settings…
            </div>
          ) : (
            <form onSubmit={handleStoreSave} className="space-y-0">
              <StoreField
                id="storeName"
                label="Store Name"
                description="Displayed in emails and the storefront"
                icon={<Store size={15} className="text-text-secondary" />}
                value={storeForm.storeName}
                onChange={(v) => setStoreForm((f) => ({ ...f, storeName: v }))}
                placeholder="Vikestore"
                maxLength={100}
              />
              <StoreField
                id="supportEmail"
                label="Support Email"
                description="Used for order confirmations and support"
                icon={<Mail size={15} className="text-text-secondary" />}
                value={storeForm.supportEmail}
                onChange={(v) => setStoreForm((f) => ({ ...f, supportEmail: v }))}
                placeholder="support@vikestore.com"
                type="email"
                maxLength={254}
              />
              <StoreField
                id="currency"
                label="Currency Code"
                description="ISO 4217 code, e.g. USD, EUR, PKR"
                icon={<DollarSign size={15} className="text-text-secondary" />}
                value={storeForm.currency}
                onChange={(v) => setStoreForm((f) => ({ ...f, currency: v }))}
                placeholder="USD"
                maxLength={10}
              />
              <StoreField
                id="logoUrl"
                label="Logo URL"
                description="Full URL to your store's logo image"
                icon={<Image size={15} className="text-text-secondary" />}
                value={storeForm.logoUrl}
                onChange={(v) => setStoreForm((f) => ({ ...f, logoUrl: v }))}
                placeholder="https://cdn.example.com/logo.png"
                type="url"
                maxLength={2048}
              />
              {storeError && (
                <p className="px-5 py-2 text-xs font-medium text-danger">{storeError}</p>
              )}
              <div className="flex items-center justify-between border-t border-bg-border/60 px-5 py-4">
                {storeSaved ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle size={14} /> Saved successfully
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">
                    {storeSettings ? `Last updated: ${new Date(storeSettings.updatedAt ?? "").toLocaleDateString()}` : ""}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={storeSaving}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {storeSaving && <Loader2 size={13} className="animate-spin" />}
                  {storeSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </SettingsSection>

        {/* ── Appearance section ── */}
        <SettingsSection
          title="Appearance"
          description="Customize how the admin console looks"
          icon={<Palette size={17} className="text-indigo-500" />}
        >
          <SettingsRow
            label="Theme"
            description={isDark ? "Dark mode is currently active" : "Light mode is currently active"}
            icon={isDark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-warning" />}
          >
            <Toggle checked={isDark} onToggle={toggleTheme} aria="Toggle theme" />
          </SettingsRow>
        </SettingsSection>

        {/* ── Security section ── */}
        <SettingsSection
          title="Security"
          description="Session and access control information"
          icon={<Lock size={17} className="text-success" />}
        >
          <SettingsRow
            label="Role-Based Access Control"
            description="Your access level is enforced server-side per route"
            icon={<ShieldCheck size={16} className="text-success" />}
          >
            <span className="rounded-full border border-success-border bg-success-bg px-3 py-1 text-xs font-semibold text-success">
              Enabled
            </span>
          </SettingsRow>
          <SettingsRow
            label="Session Persistence"
            description="Tokens are stored securely based on 'Remember me' preference"
            icon={<Globe size={16} className="text-text-secondary" />}
          >
            <span className="rounded-full border border-bg-border bg-bg px-3 py-1 text-xs font-semibold text-text-secondary">
              Active
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* ── Notifications section ── */}
        <SettingsSection
          title="Notifications"
          description="Manage alert preferences"
          icon={<Bell size={17} className="text-warning" />}
        >
          <SettingsRow
            label="Low Stock Alerts"
            description="Notify via email when product stock falls below 10 units"
            icon={<Bell size={16} className="text-text-secondary" />}
          >
            <Toggle
              checked={notifyLowStock}
              onToggle={handleToggleLowStock}
              aria="Toggle low stock alerts"
            />
          </SettingsRow>
          <SettingsRow
            label="New Order Alerts"
            description="Notify via email when a new order is placed"
            icon={<Bell size={16} className="text-text-secondary" />}
          >
            <Toggle
              checked={notifyNewOrder}
              onToggle={handleToggleNewOrder}
              aria="Toggle order alerts"
            />
          </SettingsRow>
        </SettingsSection>
      </div>

      <p className="mt-8 text-center text-xs text-text-muted">
        Vikestore Admin Console · Version 1.0.0
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-bg-border bg-bg-panel shadow-sm">
      <div className="flex items-center gap-3 border-b border-bg-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-hover">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-bg-border/60">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-bg-border bg-bg text-text-secondary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function StoreField({
  id,
  label,
  description,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-bg-border bg-bg text-text-secondary">
          {icon}
        </div>
        <div>
          <label htmlFor={id} className="text-sm font-medium text-text-primary">
            {label}
          </label>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-2 w-full rounded-lg border border-bg-border bg-bg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:mt-0 sm:w-60"
      />
    </div>
  );
}

function Toggle({
  checked,
  onToggle,
  aria,
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  aria: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      aria-label={aria}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-accent" : "bg-bg-border hover:bg-bg-hover"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default SettingsPage;