/**
 * Recursively converts all Prisma Decimal instances to plain JS numbers.
 * Must be called on Prisma query results before passing data from Server
 * Components to Client Components, because Next.js cannot serialize the
 * Prisma Decimal class across the server/client boundary.
 */
export function serializeDecimals<T>(data: T): T {
  if (data === null || data === undefined) return data;
  // Prisma Decimal instances expose a toNumber() method
  if (typeof (data as any)?.toNumber === "function") {
    return (data as any).toNumber() as unknown as T;
  }
  // Preserve Date objects as-is
  if (data instanceof Date) return data;
  // Recurse into arrays
  if (Array.isArray(data)) {
    return data.map(serializeDecimals) as unknown as T;
  }
  // Recurse into plain objects
  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeDecimals(v),
      ])
    ) as unknown as T;
  }
  return data;
}
