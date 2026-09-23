import type { ModelContext,Tool } from "./types";

// Serialize registrations on the same document across React StrictMode remounts.
const queues = new WeakMap<ModelContext,Promise<void>>();
export function registerAdminTools(context:ModelContext,tools:Tool[],signal:AbortSignal):Promise<void> {
  const previous = queues.get(context) ?? Promise.resolve();
  const next = previous.catch(()=>{}).then(async()=>{
    const registration = new AbortController();
    const stop=()=>registration.abort();
    if(signal.aborted) return;
    signal.addEventListener("abort",stop,{once:true});
    try {
      for(const tool of tools) {
        if(signal.aborted) break;
        await context.registerTool(tool,{signal:registration.signal});
      }
    } catch(error) {
      registration.abort();
      signal.removeEventListener("abort",stop);
      if(!signal.aborted) throw error;
    }
  });
  queues.set(context,next);
  return next;
}
