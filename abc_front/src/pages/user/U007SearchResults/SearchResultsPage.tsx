import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getBooks, getCategories, searchBooks, type BookSearchQuery } from '../../../api/bookApi';
import { createBookRequest } from '../../../api/bookRequestsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import type { BookCard, Category, PageResponse } from '../../../types/api';
import '../../../styles/books.css';
import '../../../styles/search.css';

const PAGE_SIZE = 15;

const fallbackCategories: Category[] = [
  { categoryId: 1, name: '소설' },
  { categoryId: 2, name: '경제 / 경영' },
  { categoryId: 3, name: '인문 / 사회 / 역사' },
  { categoryId: 4, name: '컴퓨터 / IT' },
  { categoryId: 5, name: '자기계발' },
  { categoryId: 6, name: '에세이 / 시' },
  { categoryId: 7, name: '자연 / 환경' },
  { categoryId: 8, name: '전공서적' },
  { categoryId: 9, name: '취미 / 실용 / 스포츠' },
  { categoryId: 10, name: '취업 / 수험서' },
];

const sortOptions = [
  { label: '인기순', value: 'popular' },
  { label: '최신순', value: 'latest' },
  { label: '제목순', value: 'title' },
  { label: '평점순', value: 'rating' },
  { label: '리뷰순', value: 'reviews' },
];

const weeklyArrivalBooks: BookCard[] = [
  '싯다르타',
  '나의 첫 번째 부동산 교과서',
  '해커스 토익 기출 VOCA',
  '유럽 도시 기행',
  '부의 갈림길',
  '품격 있는 대화를 위한 지식 브리핑',
  '니체의 초월자',
  '별별한국사 심화',
  '안녕이라 그랬어',
  '토익 정기시험 기출문제집',
].map((title, index) => ({
  bookId: index + 201,
  title,
  coverImageUrl: '',
  authors: [index % 2 === 0 ? '김하늘' : '이서윤'],
  publisherName: index % 2 === 0 ? 'ABC 출판' : '미래출판',
  rentalType: index % 3 === 0 ? 'PAID' : 'FREE',
  rentalPrice: index % 3 === 0 ? 3000 : 0,
  averageRating: 4.7 - index * 0.15,
  reviewCount: 42 - index,
  favoriteYn: false,
})) as BookCard[];

function getEmptyPage(page = 0): PageResponse<BookCard> {
  return {
    content: [],
    page,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
    last: true,
  };
}

function formatRentalType(book: BookCard) {
  if (book.rentalType === 'FREE' || book.rentalPrice === 0) return '무료';
  return '유료';
}

function getRequestStorageKey(keyword: string) {
  return `abc-book-request:${keyword.trim().toLowerCase()}`;
}

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q')?.trim() ?? '';
  const currentPage = Number(searchParams.get('page') ?? '0');
  const sort = searchParams.get('sort') ?? 'popular';
  const rentalType = searchParams.get('rentalType') ?? undefined;
  const availableOnly = searchParams.get('status') === 'AVAILABLE';
  const requestMode = searchParams.get('request') === '1';
  const searchType = (searchParams.get('type') as BookSearchQuery['searchType']) ?? 'ALL';

  const [bookPage, setBookPage] = useState<PageResponse<BookCard>>(getEmptyPage());
  const [featuredPage, setFeaturedPage] = useState<PageResponse<BookCard>>(getEmptyPage());
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRequested, setIsRequested] = useState(() => Boolean(keyword && localStorage.getItem(getRequestStorageKey(keyword))));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const query = useMemo<BookSearchQuery>(
    () => ({
      q: keyword,
      sort,
      rentalType,
      status: availableOnly ? 'AVAILABLE' : undefined,
      searchType,
    }),
    [availableOnly, keyword, rentalType, searchType, sort],
  );

  const featuredBooks = featuredPage.content.length ? featuredPage.content : weeklyArrivalBooks;

  const getFeaturedOffset = (index: number) => {
    const length = featuredBooks.length;
    let offset = index - featuredIndex;

    if (offset > length / 2) offset -= length;
    if (offset < length / -2) offset += length;

    return offset;
  };

  const moveFeaturedNext = () => {
    if (featuredBooks.length <= 1) return;
    setFeaturedIndex((currentIndex) => (currentIndex + 1) % featuredBooks.length);
  };

  useEffect(() => {
    setIsRequested(Boolean(keyword && localStorage.getItem(getRequestStorageKey(keyword))));
  }, [keyword]);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!ignore && data.length) {
          setCategories(data);
        }
      } catch {
        if (!ignore) {
          setCategories(fallbackCategories);
        }
      }
    }

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      moveFeaturedNext();
    }, 5000);

    return () => window.clearInterval(timerId);
  }, [featuredPage.content.length, featuredIndex]);

  useEffect(() => {
    let ignore = false;

    async function loadFeaturedBooks() {
      try {
        const data = await getBooks(0, 10, { sort: 'popular' });
        if (!ignore) {
          setFeaturedPage(data.content.length ? data : { ...data, content: weeklyArrivalBooks });
        }
      } catch {
        if (!ignore) {
          setFeaturedPage({
            ...getEmptyPage(),
            content: weeklyArrivalBooks,
            totalElements: weeklyArrivalBooks.length,
          });
        }
      }
    }

    void loadFeaturedBooks();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadSearchResults() {
      if (!keyword) {
        setBookPage(getEmptyPage());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchBooks(currentPage, PAGE_SIZE, query);
        if (!ignore) {
          setBookPage(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (!ignore) {
          setBookPage(getEmptyPage(currentPage));
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSearchResults();

    return () => {
      ignore = true;
    };
  }, [currentPage, keyword, query]);

  const totalPages = Math.max(1, bookPage.totalPages);
  const showRequestPanel = Boolean(keyword && (requestMode || (!isLoading && bookPage.totalElements === 0)));
  const updateFilter = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });

    setSearchParams(next);
  };

  const movePage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  };

  const handleRequest = async () => {
    if (!keyword) return;

    if (!localStorage.getItem('accessToken')) {
      navigate(`/login?redirect=${encodeURIComponent(`/search?q=${keyword}&request=1`)}`);
      return;
    }

    if (isRequested) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createBookRequest({
        title: keyword,
        author: '미상',
        publisher: '미상',
        reason: `검색 결과가 없어 희망 도서로 신청합니다. 검색어: ${keyword}`,
      });
      localStorage.setItem(getRequestStorageKey(keyword), '1');
      setIsRequested(true);
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (message.includes('이미') || message.includes('중복')) {
        localStorage.setItem(getRequestStorageKey(keyword), '1');
        setIsRequested(true);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="books-page search-page">
      <section className="books-featured books-recommend-section" aria-label="이번 주 입고 도서">
        <div className="books-recommend-heading">
          <div>
            <h2>이번 주 입고 도서</h2>
            <p>새로 들어온 책을 ABC에서 먼저 만나보세요.</p>
          </div>
        </div>

        <div className="books-recommend-carousel">
          <div className="books-recommend-viewport">
            <div className="books-recommend-track">
              {featuredBooks.map((book, index) => {
                const offset = getFeaturedOffset(index);
                const isVisible = Math.abs(offset) <= 2;

                return (
                <Link
                  className={`books-recommend-card ${offset === 0 ? 'is-featured' : ''} ${isVisible ? '' : 'is-hidden'}`}
                  style={{ '--book-offset': offset } as CSSProperties}
                  to={`/books/${book.bookId}`}
                  key={book.bookId}
                >
                  {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" /> : <span>책 표지</span>}
                  <strong>{book.title}</strong>
                  <small>{book.authors.join(', ') || formatRentalType(book)}</small>
                </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="books-recommend-dots" role="tablist" aria-label="입고 도서 슬라이드 이동">
          {featuredBooks.map((book, index) => (
            <button
              key={book.bookId}
              type="button"
              role="tab"
              className={`books-recommend-dot ${index === featuredIndex ? 'is-active' : ''}`}
              aria-label={`${index + 1}번째 도서로 이동`}
              aria-selected={index === featuredIndex}
              onClick={() => setFeaturedIndex(index)}
            />
          ))}
        </div>
      </section>

      <section className="books-content">
        <aside className="books-filter" aria-label="검색 필터">
          <div className="books-filter-heading">
            <h2>정렬</h2>
            <button type="button" onClick={() => setSearchParams(keyword ? { q: keyword } : {})}>
              초기화
            </button>
          </div>

          <div className="books-filter-list">
            {sortOptions.map((option) => (
              <button className={sort === option.value ? 'is-active' : ''} type="button" onClick={() => updateFilter({ sort: option.value })} key={option.value}>
                {option.label}
              </button>
            ))}
          </div>

          <div className="books-filter-group">
            <h2>카테고리</h2>
            <button type="button" className="is-active">
              전체
            </button>
            {categories.map((category) => (
              <button type="button" onClick={() => navigate(`/books?parentCategoryId=${category.categoryId}`)} key={category.categoryId}>
                {category.name}
              </button>
            ))}
          </div>

          <div className="books-filter-group">
            <h2>무료 / 유료 / 대여 가능</h2>
            <label>
              <input checked={rentalType === 'FREE'} type="checkbox" onChange={(event) => updateFilter({ rentalType: event.target.checked ? 'FREE' : undefined })} />
              무료
            </label>
            <label>
              <input checked={rentalType === 'PAID'} type="checkbox" onChange={(event) => updateFilter({ rentalType: event.target.checked ? 'PAID' : undefined })} />
              유료
            </label>
            <label>
              <input checked={availableOnly} type="checkbox" onChange={(event) => updateFilter({ status: event.target.checked ? 'AVAILABLE' : undefined })} />
              대여 가능
            </label>
          </div>
        </aside>

        <div className="books-result">
          <div className="books-result-heading">
            <h1>전체 {bookPage.totalElements.toLocaleString('ko-KR')}건</h1>
            <div className="books-type-tabs" aria-label="대여 유형 빠른 필터">
              <button className={!rentalType ? 'is-active' : ''} type="button" onClick={() => updateFilter({ rentalType: undefined })}>
                전체
              </button>
              <button className={rentalType === 'FREE' ? 'is-active' : ''} type="button" onClick={() => updateFilter({ rentalType: 'FREE' })}>
                무료
              </button>
              <button className={rentalType === 'PAID' ? 'is-active' : ''} type="button" onClick={() => updateFilter({ rentalType: 'PAID' })}>
                유료
              </button>
            </div>
          </div>

          {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
          {isLoading ? <div className="status-banner">검색 결과를 불러오는 중입니다.</div> : null}

          {!keyword ? <EmptyState title="검색어를 입력하세요" description="상단 검색창에서 제목, 저자, 출판사를 검색할 수 있습니다." /> : null}

          {showRequestPanel ? (
            <div className="search-request-panel">
              <h2>{isRequested ? '요청이 완료 되었습니다.' : `"${keyword}"에 대한 검색 결과가 없습니다.`}</h2>
              {!isRequested ? <p>희망 도서를 신청하시겠습니까?</p> : null}
              <button type="button" onClick={handleRequest} disabled={isSubmitting || isRequested}>
                {isSubmitting ? '요청 중...' : '요청하기'}
              </button>
            </div>
          ) : null}

          {!isLoading && keyword && !showRequestPanel && bookPage.content.length ? (
            <>
              <div className="books-grid" aria-label="검색 결과">
                {bookPage.content.map((book) => (
                  <Link className="books-card" to={`/books/${book.bookId}`} key={book.bookId}>
                    {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" /> : <span />}
                    <strong>{book.title}</strong>
                    <small>{book.authors.join(', ') || formatRentalType(book)}</small>
                  </Link>
                ))}
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={movePage} />
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
