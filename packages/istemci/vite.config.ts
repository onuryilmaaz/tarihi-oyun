import { defineConfig } from "vite";

// Senaryo verisi depo kökündeki veri/ klasöründen sunulur: /senaryo-1453/harita.json vb.
export default defineConfig({
  publicDir: "../../veri",
  worker: { format: "es" },
  build: {
    chunkSizeWarningLimit: 600, // three.js tek başına ~550 kB; daha fazla bölünemez
    // 9e: three.js ayrı parçada (oyun kodu değiştikçe tarayıcı önbelleği three.js'i yeniden indirmez)
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: "three", test: /node_modules[\\/]three/ }] } } },
  },
});
