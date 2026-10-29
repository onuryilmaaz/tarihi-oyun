import { defineConfig } from "vite";

// Senaryo verisi depo kökündeki veri/ klasöründen sunulur: /senaryo-1453/harita.json vb.
export default defineConfig({
  publicDir: "../../veri",
  worker: { format: "es" },
});
