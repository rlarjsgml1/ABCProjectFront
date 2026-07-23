// 책 보유 도서관 위치(U024) 화면 — 정보나루 종이책 소장 도서관 검색. region(시/도)은 API 필수값이라 사용자가 먼저 선택해야 조회된다.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBookDetail } from '../../../api/bookApi';
import { getBookLibraries } from '../../../api/libraryApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import type { LibrarySearchResponse } from '../../../types/api';
import { districtsByRegion, regionOptions } from './libraryRegions';
import styles from '../../../styles/BookLibrariesPage.module.css';

const PAGE_SIZE = 10;

function formatDistance(distanceKm: number | undefined) {
  if (typeof distanceKm !== 'number') return null;
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;
}

export function BookLibrariesPage() {
  const { bookId } = useParams();
  const [region, setRegion] = useState('');
  const [dtlRegion, setDtlRegion] = useState('');
  const [nameKeyword, setNameKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [result, setResult] = useState<LibrarySearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookSummary, setBookSummary] = useState<{ title: string; author?: string; coverImageUrl?: string } | null>(null);

  // 지역 검색 전에도 책 표지를 보여주기 위해 상세 API를 별도로 가볍게 조회한다. 실패해도 화면 동작에는 영향 없다.
  useEffect(() => {
    if (!bookId) return;
    let ignore = false;

    getBookDetail(Number(bookId))
      .then((detail) => {
        if (!ignore) {
          setBookSummary({ title: detail.title, author: detail.author ?? detail.authors?.join(', '), coverImageUrl: detail.coverImageUrl });
        }
      })
      .catch(() => {
        // 표지 조회 실패는 화면 진행에 필수가 아니므로 조용히 무시한다.
      });

    return () => {
      ignore = true;
    };
  }, [bookId]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setCoords(null),
      { timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (!bookId || !region) {
      setResult(null);
      return;
    }

    let ignore = false;

    async function loadLibraries() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getBookLibraries(Number(bookId), {
          region,
          dtlRegion: dtlRegion || undefined,
          page,
          size: PAGE_SIZE,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        if (!ignore) setResult(data);
      } catch (error) {
        if (!ignore) {
          setResult(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadLibraries();

    return () => {
      ignore = true;
    };
  }, [bookId, region, dtlRegion, page, coords]);

  function handleRegionChange(nextRegion: string) {
    setRegion(nextRegion);
    setDtlRegion('');
    setPage(0);
  }

  function handleDtlRegionChange(nextDtlRegion: string) {
    setDtlRegion(nextDtlRegion);
    setPage(0);
  }

  const districtOptions = districtsByRegion[region] ?? [];

  const libraries = (result?.libraries ?? []).filter((library) =>
    nameKeyword.trim() ? library.libraryName.toLowerCase().includes(nameKeyword.trim().toLowerCase()) : true,
  );
  const shownPage = (result?.page ?? 0) + 1;
  const totalPages = Math.max(result?.totalPages ?? 1, 1);

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="book-libraries-title">
      <div className={styles.bookHeader}>
        <div className={styles.bookCoverFrame}>
          {(result?.coverImageUrl ?? bookSummary?.coverImageUrl) ? (
            <img src={result?.coverImageUrl ?? bookSummary?.coverImageUrl} alt="" />
          ) : (
            <span className={styles.bookCoverFallback} aria-hidden="true">📖</span>
          )}
        </div>
        <div className={styles.bookHeaderText}>
          <h1 id="book-libraries-title">{result?.title ?? bookSummary?.title ?? '도서'} 보유 도서관</h1>
          {bookSummary?.author ? <p className={styles.bookAuthor}>{bookSummary.author}</p> : null}
          <p className="field-hint">종이책을 소장한 전국 공공도서관을 지역별로 검색합니다.</p>
        </div>
        {bookId ? (
          <div className={styles.backLinkGroup}>
            <Link className={styles.backLink} to={`/books/${bookId}`}>
              ← 도서 상세로
            </Link>
            {coords && region ? <span className={styles.geoHint}>📍 내 위치 기준 거리 표시</span> : null}
          </div>
        ) : null}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup} role="group" aria-label="지역 필터">
          <label className={styles.filterSelect}>
            <span className={styles.filterSelectLabel}>지역</span>
            <select value={region} onChange={(event) => handleRegionChange(event.target.value)}>
              <option value="" disabled>
                지역을 선택하세요
              </option>
              {regionOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {region && districtOptions.length > 0 ? (
            <label className={styles.filterSelect}>
              <span className={styles.filterSelectLabel}>구/군</span>
              <select value={dtlRegion} onChange={(event) => handleDtlRegionChange(event.target.value)}>
                <option value="">전체</option>
                {districtOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {region ? (
          <input
            className={styles.searchInput}
            type="search"
            aria-label="도서관명 검색"
            placeholder="도서관 이름으로 찾기"
            value={nameKeyword}
            onChange={(event) => setNameKeyword(event.target.value)}
          />
        ) : null}
      </div>

      {!region ? (
        <EmptyState title="지역을 먼저 선택해 주세요." description="선택한 지역의 공공도서관 소장 현황을 보여드립니다." />
      ) : null}

      {region && isLoading ? <div className="status-banner">도서관 정보를 불러오는 중입니다.</div> : null}
      {region && !isLoading && errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

      {region && !isLoading && !errorMessage && result?.stale ? (
        <div className="status-banner">최신 정보를 불러오지 못해 이전에 확인된 정보를 보여드립니다.</div>
      ) : null}

      {region && !isLoading && !errorMessage && result?.warnings.length ? (
        <div className="status-banner">{result.warnings.join(' ')}</div>
      ) : null}

      {region && !isLoading && !errorMessage && libraries.length === 0 && (result?.libraries.length ?? 0) > 0 ? (
        <EmptyState title="검색어와 일치하는 도서관이 없습니다." description="도서관명 검색어를 지우거나 다르게 입력해 보세요." />
      ) : null}

      {region && !isLoading && !errorMessage && (result?.libraries.length ?? 0) === 0 ? (
        <EmptyState title="선택하신 지역에서 이 책을 보유한 도서관을 찾지 못했습니다." description="다른 지역을 선택해 보세요." />
      ) : null}

      {region && !isLoading && !errorMessage && libraries.length > 0 ? (
        <>
          <ul className={styles.libraryList} aria-label="보유 도서관 목록">
            {libraries.map((library) => {
              const distance = formatDistance(library.distanceKm);

              return (
                <li className={styles.libraryItem} key={library.libraryCode}>
                  <span className={styles.libraryIcon} aria-hidden="true">🏛</span>
                  <div className={styles.libraryBody}>
                    <div className={styles.libraryTitleRow}>
                      <strong>{library.libraryName}</strong>
                      {distance ? <span className={styles.distanceChip}>{distance}</span> : null}
                    </div>
                    <p className={styles.libraryAddress}>{library.address}</p>
                    {library.operationTime || library.closedDays ? (
                      <p className={styles.libraryMeta}>
                        {library.operationTime ? `운영 ${library.operationTime}` : ''}
                        {library.operationTime && library.closedDays ? ' · ' : ''}
                        {library.closedDays ? `휴관 ${library.closedDays}` : ''}
                      </p>
                    ) : null}
                    {library.homepageUrl ? (
                      <a className={styles.homeLink} href={library.homepageUrl} target="_blank" rel="noreferrer">
                        홈페이지 ↗
                      </a>
                    ) : null}
                  </div>
                  <span className={`${styles.statusBadge} ${library.holding ? styles.statusAvailable : styles.statusUnavailable}`}>
                    {library.holding ? '소장' : '미소장'}
                    {library.holding && library.loanAvailable === false ? ' · 대출중' : ''}
                  </span>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 ? (
            <div className={styles.pagination}>
              <Button type="button" variant="secondary" disabled={shownPage <= 1} onClick={() => setPage((current) => current - 1)}>
                이전
              </Button>
              <span>
                {shownPage} / {totalPages}
              </span>
              <Button type="button" variant="secondary" disabled={shownPage >= totalPages} onClick={() => setPage((current) => current + 1)}>
                다음
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
