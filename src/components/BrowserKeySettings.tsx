import { useEffect, useState } from "react";
import { KEY_PROVIDERS, readBrowserKeys, saveBrowserKeys, type BrowserKeys } from "@/lib/browser-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BrowserKeySettings() {
  const [keys, setKeys] = useState<BrowserKeys>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => setKeys(readBrowserKeys()), []);
  return <section className="rounded-xl border border-border bg-card p-6 space-y-4">
    <div><h2 className="text-xl font-semibold">Your browser session keys</h2>
      <p className="mt-2 text-sm text-muted-foreground">Keys stay in this tab’s session storage. They pass through the server only when you run a workflow and are never saved to its database or environment. Closing the tab clears this session. Gemini powers Captain Echo; Gemini or OpenAI powers text workflows. Ad images require OpenAI.</p>
      <p className="mt-2 text-sm text-muted-foreground">No key means no provider call. Saving here does not validate a key or spend credits. Model access depends on your provider account.</p></div>
    <div className="grid gap-4 md:grid-cols-2">{KEY_PROVIDERS.map(provider => <div key={provider} className="space-y-2">
      <label htmlFor={`byok-${provider}`} className="text-sm font-medium capitalize">{provider} API key</label>
      <Input id={`byok-${provider}`} type="password" autoComplete="off" value={keys[provider] || ""} placeholder="Disconnected" maxLength={500}
        onChange={event => { setSaved(false); setKeys({ ...keys, [provider]: event.target.value.trim() }); }} />
      {(provider === "gemini" || provider === "openai") && <>
        <label htmlFor={`model-${provider}`} className="text-xs text-muted-foreground">Text model ID</label>
        <Input id={`model-${provider}`} value={keys[`model-${provider}`] || ""} placeholder={provider === "gemini" ? "gemini-2.5-flash" : "gpt-4.1-mini"}
          onChange={event => { setSaved(false); setKeys({ ...keys, [`model-${provider}`]: event.target.value.trim() }); }} />
      </>}
    </div>)}</div>
    <div className="flex items-center gap-3 flex-wrap">
      <Button onClick={() => { saveBrowserKeys(keys); setSaved(true); }}>Save for this session</Button>
      <Button variant="outline" onClick={() => { saveBrowserKeys({}); setKeys({}); setSaved(false); }}>Disconnect all</Button>
      <span role="status" className="text-sm text-muted-foreground">{saved ? "Saved for this browser session. Connection has not been tested." : ""}</span>
    </div>
  </section>;
}
