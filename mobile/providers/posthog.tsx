import { PostHogProvider } from 'posthog-react-native';
import { config } from '../lib/config';

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  if (!config.posthogApiKey) {
    return children;
  }

  return (
    <PostHogProvider
      apiKey={config.posthogApiKey}
      options={{
        host: config.posthogHost,
        disabled: __DEV__,
      }}
    >
      {children}
    </PostHogProvider>
  );
}
