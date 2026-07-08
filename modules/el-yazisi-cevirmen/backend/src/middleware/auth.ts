import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const SHARED_SECRET_HEADER = "x-app-secret";

/**
 * Basit paylasilan-sir kontrolu. Amac, OpenRouter anahtarini barindiran
 * backend'i rastgele tarayici/bot trafiginden korumaktir; gercek bir
 * kullanici kimlik dogrulamasi yerine gecmez. Coklu kullanicili bir
 * senaryoda bunun yerine JWT/oturum tabanli bir auth katmani kullanilmalidir.
 */
export function requireAppSecret(req: Request, res: Response, next: NextFunction) {
  const provided = req.header(SHARED_SECRET_HEADER);

  if (!provided || provided !== env.APP_SHARED_SECRET) {
    res.status(401).json({ error: "Yetkisiz istek: gecersiz veya eksik uygulama anahtari." });
    return;
  }

  next();
}
