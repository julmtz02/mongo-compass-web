interface AppConfig {
  appName: string;
  csrfToken?: string;
}

export function getConfig(): AppConfig {
  const config = (window as any).__APP_CONFIG__;
  return {
    appName: config?.appName ?? 'Compass Web',
    csrfToken: config?.csrfToken,
  };
}
