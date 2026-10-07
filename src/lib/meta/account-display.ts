export function formatInstagramAccountName(
  username: string | null | undefined,
  accountId: string,
): string {
  const name = username?.trim();
  if (!name || /^\d+$/.test(name)) {
    return `@ig_account_${accountId.slice(-4)}`;
  }

  if (/\s/.test(name)) return name;
  return name.startsWith("@") ? name : `@${name}`;
}
