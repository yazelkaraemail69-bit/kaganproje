import { createApp } from "./app";
import { env, logStartupWarnings } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`El Yazisi Cevirmen backend ${env.PORT} portunda calisiyor.`);
  console.log(`Web arayuzu: http://localhost:${env.PORT}`);
  logStartupWarnings();
});
