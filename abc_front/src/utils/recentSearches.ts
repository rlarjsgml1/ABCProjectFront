// 헤더 검색창의 최근 검색어 — 브라우저 localStorage에만 저장한다 (서버 연동 없음).
// 로그인한 memberId별로 키를 분리해서, 같은 브라우저를 여러 계정이 돌려 쓰더라도 서로의 검색 기록이 섞이지 않게 한다.
const STORAGE_KEY_PREFIX = 'abc_recent_searches';
const MAX_ITEMS = 8;

function getStorageKey() {
  const memberId = window.localStorage.getItem('memberId');
  return `${STORAGE_KEY_PREFIX}:${memberId || 'guest'}`;
}

export function getRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(items: string[]) {
  try {
    window.localStorage.setItem(getStorageKey(), JSON.stringify(items));
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
