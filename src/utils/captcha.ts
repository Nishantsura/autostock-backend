import { config } from '../config';

export async function verifyCaptcha(token?: string): Promise<boolean> {
  if (config.CAPTCHA_PROVIDER === 'none') return true;
  if (!token) return false;

  try {
    const fetchFn: any = (global as any).fetch;
    if (!fetchFn) return false;
    if (config.CAPTCHA_PROVIDER === 'hcaptcha') {
      const secret = config.HCAPTCHA_SECRET;
      if (!secret) return false;
      const resp = await fetchFn('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }).toString(),
      });
      const data = (await resp.json()) as { success?: boolean };
      return !!data.success;
    }

    if (config.CAPTCHA_PROVIDER === 'recaptcha') {
      const secret = config.RECAPTCHA_SECRET;
      if (!secret) return false;
      const resp = await fetchFn('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }).toString(),
      });
      const data = (await resp.json()) as { success?: boolean };
      return !!data.success;
    }
  } catch {
    return false;
  }

  return false;
}


