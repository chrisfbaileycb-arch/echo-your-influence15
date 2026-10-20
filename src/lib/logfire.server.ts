// Local-only diagnostics for the private BYOK workspace. No automatic HTTP
// instrumentation: provider authorization headers must never be captured.
export const logfire = {
  async span<T>(_name: string, options: { attributes?: Record<string, unknown>; callback: () => T | Promise<T> }): Promise<T> {
    return await options.callback();
  },
  info(message: string, _attributes?: Record<string, unknown>) { console.info(message); },
  error(message: string, _attributes?: Record<string, unknown>) { console.error(message); },
};
export function getLogfire() { return logfire; }
