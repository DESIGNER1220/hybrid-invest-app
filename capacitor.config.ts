import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hybridinvest.app",
  appName: "Hybrid Invest",
  webDir: "public",
  server: {
    url: "https://www.hybrunimoz.mom",
    cleartext: false,
  },
};

export default config;