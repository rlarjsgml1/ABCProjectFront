// 도서 목록 화면(U006) — 목록 조회, 카테고리/정렬/유형 필터, 페이지네이션, 섹션별 더보기를 담당한다.
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBooks, getCategories, getRecommendedBooks, type BookListQuery } from '../../../api/bookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { EmptyState } from '../../../components/common/EmptyState';
import { Pagination } from '../../../components/common/Pagination';
import type { BookCard, Category, PageResponse } from '../../../types/api';
import '../../../styles/books.css';

const PAGE_SIZE = 15;
const SECTION_PAGE_SIZE = 16;

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

type SectionKey = 'recommend' | 'latest' | 'best';

type SectionConfig = {
  title: string;
  count: number;
  query: BookListQuery;
  emptyTitle: string;
};

const sectionConfigs: Record<SectionKey, SectionConfig> = {
  recommend: {
    title: '추천 도서',
    count: 16,
    query: { section: 'recommend', sort: 'popular' },
    emptyTitle: '추천 도서가 없습니다.',
  },
  latest: {
    title: '새로 나온 작품',
    count: 16,
    query: { sort: 'latest' },
    emptyTitle: '신간 도서가 없습니다.',
  },
  best: {
    title: '베스트 작품',
    count: 16,
    query: { section: 'best', sort: 'popular' },
    emptyTitle: '베스트 도서가 없습니다.',
  },
};

function formatRentalType(book: BookCard) {
  if (book.rentalType === 'FREE' || book.rentalPrice === 0) return '무료';
  return '유료';
}

function formatAuthors(book: BookCard) {
  return book.authors?.length ? book.authors.join(', ') : book.publisherName || '작가 미상';
}

function getSectionKey(section: string | null): SectionKey | null {
  if (section === 'recommend' || section === 'latest' || section === 'best') {
    return section;
  }

  return null;
}

// 도서 목록 API(API-BOOK-001)는 이미 구현되어 있으므로, 조회 실패는 가짜 도서로
// 가리지 않고 빈 목록 + 에러 메시지로 정직하게 보여준다.
function getEmptyBookPage(page: number, size: number): PageResponse<BookCard> {
  return {
    content: [],
    page,
    size,
    totalElements: 0,
    totalPages: 1,
    last: true,
  };
}

export function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const [bookPage, setBookPage] = useState<PageResponse<BookCard>>(() => getEmptyBookPage(0, PAGE_SIZE));
  const [featuredBooks, setFeaturedBooks] = useState<BookCard[]>(weeklyArrivalBooks);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const currentPage = Number(searchParams.get('page') ?? '0');
  const sectionKey = getSectionKey(searchParams.get('section'));
  const sectionConfig = sectionKey ? sectionConfigs[sectionKey] : null;
  const sort = searchParams.get('sort') ?? (searchParams.get('section') === 'best' ? 'popular' : 'popular');
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const parentCategoryId = searchParams.get('parentCategoryId') ? Number(searchParams.get('parentCategoryId')) : undefined;
  const categoryName = searchParams.get('category') ?? undefined;
  const rentalType = searchParams.get('rentalType') ?? undefined;
  const availableOnly = searchParams.get('status') === 'AVAILABLE';

  const query = useMemo<BookListQuery>(
    () => ({
      sort,
      categoryId: parentCategoryId ? undefined : categoryId,
      parentCategoryId: parentCategoryId ?? categoryId,
      category: categoryName,
      rentalType,
      status: availableOnly ? 'AVAILABLE' : undefined,
      section: searchParams.get('section') ?? undefined,
    }),
    [availableOnly, categoryId, categoryName, parentCategoryId, rentalType, searchParams, sort],
  );

  useEffect(() => {
    if (!categoryId || parentCategoryId) return;

    const next = new URLSearchParams(searchParams);
    next.set('parentCategoryId', String(categoryId));
    next.delete('categoryId');
    setSearchParams(next, { replace: true });
  }, [categoryId, parentCategoryId, searchParams, setSearchParams]);

  const getFeaturedOffset = (index: number) => {
    const length = featuredBooks.length;
    let offset = index - featuredIndex;

    if (offset > length / 2) offset -= length;
    if (offset < length / -2) offset += length;

    return offset;
  };

  const moveFeaturedNext = useCallback(() => {
    if (featuredBooks.length <= 1) return;
    setFeaturedIndex((currentIndex) => (currentIndex + 1) % featuredBooks.length);
  }, [featuredBooks.length]);

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
    let ignore = false;

    async function loadFeaturedBooks() {
      try {
        const data = await getBooks(0, 10, { sort: 'popular' });
        if (!ignore && data.content.length) {
          setFeaturedBooks(data.content);
        }
      } catch {
        if (!ignore) {
          setFeaturedBooks(weeklyArrivalBooks);
        }
      }
    }

    void loadFeaturedBooks();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      moveFeaturedNext();
    }, 5000);

    return () => window.clearInterval(timerId);
  }, [moveFeaturedNext]);

  useEffect(() => {
    let ignore = false;

    async function loadBooks() {
      setIsLoading(true);
      try {
        let data: PageResponse<BookCard>;

        if (sectionKey === 'recommend' && isLoggedIn) {
          const content = await getRecommendedBooks(SECTION_PAGE_SIZE);
          data = {
            content,
            page: 0,
            size: SECTION_PAGE_SIZE,
            totalElements: content.length,
            totalPages: 1,
            last: true,
          };
        } else {
          const sectionQuery = sectionKey === 'recommend' && !isLoggedIn ? sectionConfigs.best.query : sectionConfig?.query;
          data = await getBooks(currentPage, sectionKey ? SECTION_PAGE_SIZE : PAGE_SIZE, sectionQuery ?? query);
        }

        if (!data?.content) {
          throw new Error('Invalid books response');
        }
        if (!ignore) {
          setBookPage(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (!ignore) {
          setBookPage(getEmptyBookPage(currentPage, sectionKey ? SECTION_PAGE_SIZE : PAGE_SIZE));
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadBooks();

    return () => {
      ignore = true;
    };
  }, [currentPage, isLoggedIn, query, sectionConfig, sectionKey]);

  const totalPages = Math.max(1, bookPage.totalPages);

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

  if (sectionKey && sectionConfig) {
    return (
      <div className="books-page">
        <section className="books-section-more-hero" aria-label={sectionConfig.title}>
          <div>
            <h1>{sectionConfig.title}</h1>
          </div>
          <div className="books-section-more-visual" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="books-section-more-content">
          <h2>전체 {bookPage.totalElements.toLocaleString('ko-KR')}건</h2>

          {errorMessage ? <div className="status-banner">{errorMessage}</div> : null}
          {isLoading ? <div className="status-banner">도서 목록을 불러오는 중입니다.</div> : null}

          {!isLoading && !bookPage.content.length ? <EmptyState title={sectionConfig.emptyTitle} description="다른 도서 목록을 확인해보세요." /> : null}

          <div className="books-section-more-grid" aria-label={`${sectionConfig.title} 목록`}>
            {bookPage.content.map((book) => (
              <Link className="books-section-more-card" to={`/books/${book.bookId}`} key={book.bookId}>
                {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" /> : <span />}
                <strong>{book.title}</strong>
                <small>{book.authors.join(', ') || book.publisherName || formatRentalType(book)}</small>
              </Link>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={movePage} />
        </section>
      </div>
    );
  }

  return (
    <div className="books-page">
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
                  <small>{formatAuthors(book)}</small>
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
        <aside className="books-filter" aria-label="도서 필터">
          <div className="books-filter-heading">
            <h2>정렬</h2>
            <button type="button" onClick={() => setSearchParams({})}>
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
            <button
              className={!categoryId && !parentCategoryId && !categoryName ? 'is-active' : ''}
              type="button"
              onClick={() => updateFilter({ categoryId: undefined, parentCategoryId: undefined, category: undefined })}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                className={parentCategoryId === category.categoryId || categoryId === category.categoryId || categoryName === category.name ? 'is-active' : ''}
                type="button"
                onClick={() => updateFilter({ parentCategoryId: String(category.categoryId), categoryId: undefined, category: undefined })}
                key={category.categoryId}
              >
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
            <div className="books-view-toggle" aria-label="도서 목록 보기 방식">
              <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" aria-label="카드형 보기" onClick={() => setViewMode('grid')}>
                <span className="books-view-icon books-view-icon-grid" aria-hidden="true" />
              </button>
              <button className={viewMode === 'list' ? 'is-active' : ''} type="button" aria-label="목록형 보기" onClick={() => setViewMode('list')}>
                <span className="books-view-icon books-view-icon-list" aria-hidden="true" />
              </button>
            </div>
          </div>

          {errorMessage ? <div className="status-banner">{errorMessage}</div> : null}
          {isLoading ? <div className="status-banner">도서 목록을 불러오는 중입니다.</div> : null}

          {!isLoading && !bookPage.content.length ? <EmptyState title="표시할 도서가 없습니다." description="필터를 바꾸거나 전체 도서를 확인해보세요." /> : null}

          <div className={`books-grid books-grid-${viewMode}`} aria-label="도서 목록">
            {bookPage.content.map((book) => (
              <Link className="books-card" to={`/books/${book.bookId}`} key={book.bookId}>
                {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" /> : <span />}
                <strong>{book.title}</strong>
                <small>{formatAuthors(book)}</small>
              </Link>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={movePage} />
        </div>
      </section>
    </div>
  );
}


