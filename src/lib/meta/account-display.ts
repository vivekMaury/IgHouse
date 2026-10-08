export function formatInstagramAccountName(
  username: string | null | undefined,
  instagramAccountId: string | null | undefined,
): string {
  const name = username?.trim();
  return name
    ? name.startsWith("@")
      ? name
      : `@${name}`
    : `@ig_account_${instagramAccountId?.slice(-4) || "connected"}`;
}
