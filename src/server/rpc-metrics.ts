import { AsyncLocalStorage } from 'node:async_hooks';
type Metrics = { calls: number; milliseconds: number };
const context = new AsyncLocalStorage<Metrics>();
export const withRpcMetrics = <T>(run: () => Promise<T>) =>
  context.run({ calls: 0, milliseconds: 0 }, run);
export const rpcTiming = () => {
  const m = context.getStore();
  return m ? `odoo;dur=${m.milliseconds.toFixed(1)};desc="${m.calls} RPC"` : undefined;
};
export async function observeRpc<T>(run: () => Promise<T>): Promise<T> {
  const m = context.getStore();
  const start = performance.now();
  if (m) m.calls++;
  try {
    return await run();
  } finally {
    if (m) m.milliseconds += performance.now() - start;
  }
}
