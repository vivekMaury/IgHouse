import { isIP } from 'node:net';

export function validateExternalHttpsUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    isIP(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error(`${label} must be an external HTTPS URL.`);
  }

  return url.toString();
}

export function validateAppsScriptUrl(value: string): string {
  const url = new URL(validateExternalHttpsUrl(value, 'Google Apps Script URL'));
  if (
    url.hostname !== 'script.google.com' ||
    !/^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname)
  ) {
    throw new Error('Google Apps Script URL must be a deployed Web App URL ending in /exec.');
  }

  return url.toString();
}
