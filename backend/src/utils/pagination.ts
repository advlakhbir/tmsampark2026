export function parsePage(query: { page?: unknown; limit?: unknown }): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function pageMeta(page: number, limit: number, total: number) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
