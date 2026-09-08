import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your preferences and configuration.
        </p>
      </div>

      {/* Appearance section */}
      <section className="rounded-lg border border-bg-border bg-bg-panel shadow-sm">
        <div className="border-b border-bg-border px-6 py-4">
          <h2 className="text-sm font-medium text-text-primary">Appearance</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Customize how Vikestore looks on your device.
          </p>
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-bg-border bg-bg text-text-secondary">
              {isDark ? (
                <Moon size={16} strokeWidth={1.75} />
              ) : (
                <Sun size={16} strokeWidth={1.75} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Theme</p>
              <p className="text-xs text-text-muted">
                {isDark ? "Dark mode is on" : "Light mode is on"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle theme"
            className={`relative h-6 w-11 shrink-0 rounded-full border p-0 transition-colors ${
              isDark
                ? "border-accent bg-accent"
                : "border-bg-border bg-bg"
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform ${
                isDark ? "translate-x-5 bg-white" : "translate-x-0.5 bg-text-secondary"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Future settings sections go here, e.g.:
      <section className="mt-6 rounded-lg border border-bg-border bg-bg-panel shadow-sm">
        ...
      </section>
      */}
    </div>
  );
}

export default SettingsPage;