export type AppSettings = {
  username: string;
  theme: "dark" | "light";
  notifications: boolean;
};

const STORAGE_KEY = "veylora-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  username: "Intan",
  theme: "dark",
  notifications: true,
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return DEFAULT_SETTINGS;
    }

    const parsedData = JSON.parse(savedData);

    return {
      username:
        typeof parsedData.username === "string"
          ? parsedData.username
          : DEFAULT_SETTINGS.username,

      theme:
        parsedData.theme === "light" ||
        parsedData.theme === "dark"
          ? parsedData.theme
          : DEFAULT_SETTINGS.theme,

      notifications:
        typeof parsedData.notifications === "boolean"
          ? parsedData.notifications
          : DEFAULT_SETTINGS.notifications,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings)
  );
}