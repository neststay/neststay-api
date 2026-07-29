import { AsyncLocalStorage } from 'node:async_hooks';

export type QueryLogEntry = {
  query: string;
  params: string;
  duration: number;
};

export const queryLogStore = new AsyncLocalStorage<QueryLogEntry[]>();
