import { QueryClient } from '@tanstack/react-query';

export class AppStartup {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  async initialize(): Promise<void> {
    // Prefetch critical data on app startup
    // Additional initialization steps can be added here
  }
}
