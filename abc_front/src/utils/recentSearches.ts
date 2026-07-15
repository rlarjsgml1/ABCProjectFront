// 헤더 검색창의 최근 검색어 — 브라우저 localStorage에만 저장한다 (계정/서버 연동 없음).
const STORAGE_KEY = 'abc_recent_searches';
const MAX_ITEMS = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(items: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)에서는 조용히 무시한다.
  }
}

export function addRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();

  const next = [trimmed, ...getRecentSearches().filter((item) => item !== trimmed)].slice(0, MAX_ITEMS);
  saveRecentSearches(next);
  return next;
}

export function removeRecentSearch(query: string): string[] {
  const next = getRecentSearches().filter((item) => item !== query);
  saveRecentSearches(next);
  return next;
}

export function clearRecentSearches(): string[] {
  saveRecentSearches([]);
  return [];
}
