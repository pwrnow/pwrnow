import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  notificationsEnabled: boolean;
  theme: ThemeMode;
}

const SETTINGS_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  theme: 'system',
};

export class SettingsStorage {
  private static instance: SettingsStorage;
  private settings: AppSettings = defaultSettings;
  private listeners: Set<(settings: AppSettings) => void> = new Set();

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): SettingsStorage {
    if (!SettingsStorage.instance) {
      SettingsStorage.instance = new SettingsStorage();
    }
    return SettingsStorage.instance;
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.settings));
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener);
    // Call immediately with current settings
    listener(this.settings);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ notificationsEnabled: enabled });
  }

  async setTheme(theme: ThemeMode): Promise<void> {
    await this.updateSettings({ theme });
  }
}

export const settingsStorage = SettingsStorage.getInstance();
