import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is rendered per request (session + preferences), so no incremental
// cache bucket is needed for now. Add R2 here if ISR/`use cache` is adopted.
export default defineCloudflareConfig({});
