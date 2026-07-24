// 홈 화면(U001) — 배너 슬라이드, 카테고리, 추천/신간/베스트 도서 섹션을 보여준다.
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { getBestBooks, getLatestBooks, getRecommendedBooks } from '../../../api/bookApi';
import { getCollections } from '../../../api/collectionApi';
import { getNotices } from '../../../api/noticeApi';
import type { BookCard, NoticeItem } from '../../../types/api';
import '../../../styles/HomePage.css';

type BookItem = {
  id: number;
  title: string;
  author: string;
  tone: string;
  coverImageUrl?: string;
};

type BookSection = {
  title: string;
  moreTo: string;
  books: BookItem[];
  kind?: 'recommend' | 'latest' | 'best';
  ranked?: boolean;
};

type BannerItem = {
  badge: string;
  title: string;
  description: string;
  coverTitle: string;
  theme?: 'brown' | 'forest' | 'midnight' | 'plum';
  /** 운영 배너 이미지 URL. 값을 넣으면 플레이스홀더 대신 실제 이미지가 표시된다. */
  imageUrl?: string;
  covers?: { title: string; imageUrl?: string }[];
  /** 클릭 시 이동 경로. 없으면 일반 이벤트 페이지로 이동한다. */
  linkTo?: string;
};

const bannerItems: BannerItem[] = [
  {
    badge: 'EVENT',
    title: 'ABC에서 만나는 이번 주 특별 도서',
    description: '추천 작품과 신간을 한곳에서 빠르게 확인해보세요.',
    coverTitle: 'ABC Pick',
    theme: 'brown',
  },
  {
    badge: 'NEW',
    title: '새로 들어온 전자책을 먼저 만나보세요',
    description: '매일 업데이트되는 신간 도서를 ABC가 골라드립니다.',
    coverTitle: 'New Book',
    theme: 'forest',
  },
  {
    badge: 'BEST',
    title: '지금 가장 많이 읽는 베스트 작품',
    description: '독자들이 선택한 인기 도서를 메인에서 바로 확인하세요.',
    coverTitle: 'Best Book',
    theme: 'midnight',
  },
];

const bannerThemes: NonNullable<BannerItem['theme']>[] = ['brown', 'forest', 'midnight', 'plum'];

const quickMenuItems = [
  { to: '/me/attendance', icon: '✔️', label: '출석체크', description: '매일 읽고 혜택 받기' },
  { to: '/events', icon: '🎁', label: '이벤트', description: '진행 중인 혜택 보기' },
  { to: '/me/challenges', icon: '🏆', label: '챌린지', description: '독서 미션 확인하기' },
  { to: '/books', icon: '📚', label: '카테고리', description: '분야별 도서 보기' },
];

// 표지 없는 책의 폴백 톤 — 브랜드 그린 소프트 2종 + 중성 그레이 1종만 사용한다
const fallbackCoverTones = ['#e3f5ee', '#d9ede4', '#eef1f4'];

function withFallbackTones(books: Omit<BookItem, 'tone'>[]): BookItem[] {
  return books.map((book, index) => ({ ...book, tone: fallbackCoverTones[index % fallbackCoverTones.length] }));
}

const fallbackRecommendedBooks: BookItem[] = withFallbackTones([
  { id: 1, title: '바람의 문장', author: '김하늘' },
  { id: 2, title: '작은 도서관', author: '이서윤' },
  { id: 3, title: '기억의 지도', author: '박도현' },
  { id: 4, title: '느린 오후', author: '정유진' },
  { id: 5, title: '여름의 끝', author: '한지우' },
]);

const fallbackNewBooks: BookItem[] = withFallbackTones([
  { id: 11, title: '오늘의 문법', author: '차민서' },
  { id: 12, title: '초록빛 밤', author: '윤나래' },
  { id: 13, title: '생활의 발견', author: '오지훈' },
  { id: 14, title: '코드 산책', author: '문서연' },
  { id: 15, title: '달빛 기록', author: '백도윤' },
]);

const fallbackBestBooks: BookItem[] = withFallbackTones([
  { id: 21, title: '가장 긴 하루', author: '서민준' },
  { id: 22, title: '기획자의 생각', author: '강유리' },
  { id: 23, title: '마음의 온도', author: '임하린' },
  { id: 24, title: '도시와 사람', author: '최현우' },
  { id: 25, title: '일상의 기술', author: '신아영' },
  { id: 26, title: '새벽 독서', author: '권지호' },
  { id: 27, title: '설명의 힘', author: '류다은' },
  { id: 28, title: '기억 수집가', author: '남도겸' },
  { id: 29, title: '계절의 이름', author: '홍예린' },
  { id: 30, title: '책상 위 우주', author: '송이준' },
]);

const heroSlideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0, scale: 0.98 }),
};

const heroCopyContainerVariants: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  exit: {},
};

const heroCopyItemVariants: Variants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const sectionGridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const sectionCardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function toBookItems(books: BookCard[], fallbackBooks: BookItem[]) {
  if (!books.length) return fallbackBooks;

  return books.map((book, index) => ({
    id: book.bookId,
    title: book.title,
    author: book.authors?.join(', ') || book.publisherName || 'ABC',
    tone: fallbackBooks[index % fallbackBooks.length].tone,
    coverImageUrl: book.coverImageUrl,
  }));
}

// 컬렉션 섹션은 실데이터가 없으면 더미로 대체하지 않고 섹션 자체를 표시하지 않는다.
function toCollectionBookItems(books: BookCard[]) {
  return books.map((book, index) => ({
    id: book.bookId,
    title: book.title,
    author: book.authors?.join(', ') || book.publisherName || 'ABC',
    tone: fallbackBestBooks[index % fallbackBestBooks.length].tone,
    coverImageUrl: book.coverImageUrl,
  }));
}

export function HomePage() {
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const prefersReducedMotion = useReducedMotion();
  const [[activeBannerIndex, bannerDirection], setBannerState] = useState<[number, number]>([0, 1]);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [recommendedBooks, setRecommendedBooks] = useState<BookItem[]>(isLoggedIn ? fallbackRecommendedBooks : fallbackBestBooks);
  const [newBooks, setNewBooks] = useState<BookItem[]>(fallbackNewBooks);
  const [bestBooks, setBestBooks] = useState<BookItem[]>(fallbackBestBooks);
  const [latestNotice, setLatestNotice] = useState<NoticeItem | null>(null);
  const [collectionSections, setCollectionSections] = useState<{ collectionId: number; title: string; books: BookItem[] }[]>([]);
  // 배너 3층 폴백: ① 노출 중인 컬렉션 → ② 표지 있는 신간/베스트 → ③ 하드코딩 기본 배너
  const [banners, setBanners] = useState<BannerItem[]>(bannerItems);
  const memberName = localStorage.getItem('memberName');

  useEffect(() => {
    if (isAutoplayPaused || isBannerHovered || prefersReducedMotion) {
      return;
    }

    const timerId = window.setInterval(() => {
      setBannerState(([currentIndex]) => [(currentIndex + 1) % banners.length, 1]);
    }, 5000);

    return () => window.clearInterval(timerId);
  }, [banners.length, isAutoplayPaused, isBannerHovered, activeBannerIndex, prefersReducedMotion]);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const [recommendedResult, latestResult, bestResult, noticeResult, collectionsResult] = await Promise.allSettled([
        isLoggedIn ? getRecommendedBooks(15) : getBestBooks(15),
        getLatestBooks(30),
        getBestBooks(10),
        getNotices(0, 1),
        getCollections({ status: 'ACTIVE', page: 0, size: 5, previewSize: 15 }),
      ]);

      if (ignore) return;

      if (noticeResult.status === 'fulfilled') {
        setLatestNotice(noticeResult.value.content[0] ?? null);
      }

      if (recommendedResult.status === 'fulfilled') {
        setRecommendedBooks(toBookItems(recommendedResult.value, isLoggedIn ? fallbackRecommendedBooks : fallbackBestBooks));
      }

      if (latestResult.status === 'fulfilled') {
        setNewBooks(toBookItems(latestResult.value, fallbackNewBooks));
      }

      if (bestResult.status === 'fulfilled') {
        setBestBooks(toBookItems(bestResult.value, fallbackBestBooks));
      }

      if (collectionsResult.status === 'fulfilled') {
        // 정렬 1순위가 startDate라서 기간이 없는 시리즈보다 이벤트가 항상 앞에 온다.
        // 도서가 매핑된 노출 컬렉션은 전부 홈 섹션으로 보여준다.
        setCollectionSections(
          collectionsResult.value.content
            .filter((collection) => collection.previewBooks.length > 0)
            .map((collection) => ({
              collectionId: collection.collectionId,
              title: collection.collectionName,
              books: toCollectionBookItems(collection.previewBooks),
            })),
        );
      }

      // 히어로 배너 구성 — 1층: 노출 중인 컬렉션 전부 (표지가 없으면 아이콘형 플레이스홀더로 표시)
      const dynamicBanners: BannerItem[] = [];

      if (collectionsResult.status === 'fulfilled') {
        for (const [index, collection] of collectionsResult.value.content.entries()) {
          const coverBook = collection.previewBooks.find((book) => book.coverImageUrl);
          const covers = collection.previewBooks
            .filter((book) => book.coverImageUrl)
            .slice(0, 2)
            .map((book) => ({ title: book.title, imageUrl: book.coverImageUrl }));

          dynamicBanners.push({
            badge: collection.collectionType === 'EVENT' ? 'EVENT' : 'SERIES',
            title: collection.collectionName,
            description: collection.description || '지금 ABC에서 준비한 컬렉션을 만나보세요.',
            coverTitle: coverBook?.title ?? collection.collectionName,
            theme: bannerThemes[index % bannerThemes.length],
            imageUrl: coverBook?.coverImageUrl,
            covers,
            linkTo:
              collection.collectionType === 'EVENT'
                ? '/events'
                : `/books?section=collection&collectionId=${collection.collectionId}&source=home`,
          });
        }
      }

      // 2층: 컬렉션이 없으면 표지 있는 신간/베스트 상위 도서로 채운다
      if (!dynamicBanners.length) {
        const candidates = [
          ...(latestResult.status === 'fulfilled' ? latestResult.value.map((book) => ({ book, badge: 'NEW' })) : []),
          ...(bestResult.status === 'fulfilled' ? bestResult.value.map((book) => ({ book, badge: 'BEST' })) : []),
        ].filter(({ book }) => book.coverImageUrl);

        for (const [index, { book, badge }] of candidates.slice(0, 3).entries()) {
          const pairBook = candidates.find((candidate) => candidate.book.bookId !== book.bookId)?.book;

          dynamicBanners.push({
            badge,
            title: book.title,
            description: book.authors?.join(', ') || book.publisherName || 'ABC가 고른 오늘의 책',
            coverTitle: book.title,
            theme: bannerThemes[index % bannerThemes.length],
            imageUrl: book.coverImageUrl,
            covers: [
              { title: book.title, imageUrl: book.coverImageUrl },
              ...(pairBook?.coverImageUrl ? [{ title: pairBook.title, imageUrl: pairBook.coverImageUrl }] : []),
            ],
            linkTo: `/books/${book.bookId}`,
          });
        }
      }

      // 3층: 그래도 없으면 기본 배너(bannerItems) 유지
      if (dynamicBanners.length < 4) {
        const supplementalCandidates = [
          ...(latestResult.status === 'fulfilled' ? latestResult.value.map((book) => ({ book, badge: 'NEW' })) : []),
          ...(bestResult.status === 'fulfilled' ? bestResult.value.map((book) => ({ book, badge: 'BEST' })) : []),
        ].filter(({ book }) => book.coverImageUrl);

        for (const { book, badge } of supplementalCandidates) {
          if (dynamicBanners.length >= 4) break;
          if (dynamicBanners.some((banner) => banner.linkTo === `/books/${book.bookId}`)) continue;

          const pairBook = supplementalCandidates.find((candidate) => candidate.book.bookId !== book.bookId)?.book;

          dynamicBanners.push({
            badge,
            title: book.title,
            description: book.authors?.join(', ') || book.publisherName || 'ABC 추천 도서',
            coverTitle: book.title,
            theme: bannerThemes[dynamicBanners.length % bannerThemes.length],
            imageUrl: book.coverImageUrl,
            covers: [
              { title: book.title, imageUrl: book.coverImageUrl },
              ...(pairBook?.coverImageUrl ? [{ title: pairBook.title, imageUrl: pairBook.coverImageUrl }] : []),
            ],
            linkTo: `/books/${book.bookId}`,
          });
        }
      }

      if (dynamicBanners.length < 2) {
        dynamicBanners.push(
          ...bannerItems.slice(0, 2 - dynamicBanners.length).map((banner) => ({
            ...banner,
            theme: bannerThemes[dynamicBanners.length % bannerThemes.length],
          })),
        );
      }

      if (dynamicBanners.length) {
        setBanners(dynamicBanners);
        setBannerState([0, 1]);
      }
    }

    void loadHomeData();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  // 최초 로딩은 위 loadHomeData가 담당하고, 여기서는 1분 주기로 최신 공지만 재조회한다.
  // 실시간은 아니고 최대 1분 지연되는 polling 방식이다.
  useEffect(() => {
    let ignore = false;

    async function pollLatestNotice() {
      try {
        const data = await getNotices(0, 1);
        if (!ignore) {
          setLatestNotice(data.content[0] ?? null);
        }
      } catch {
        // 폴링 실패는 조용히 무시하고 다음 주기에 재시도한다.
      }
    }

    const intervalId = window.setInterval(() => void pollLatestNotice(), 60000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const bookSections: BookSection[] = useMemo(() => {
    const sections: BookSection[] = [
      {
        title: memberName ? `${memberName}님을 위한 추천` : '오늘의 추천',
        moreTo: '/books?section=recommend&source=home',
        books: recommendedBooks,
        kind: 'recommend',
      },
      {
        title: '새로 들어왔어요',
        moreTo: '/books?section=latest&source=home',
        books: newBooks,
        kind: 'latest',
      },
      {
        title: 'ABC 랭킹',
        moreTo: '/books?section=best&source=home',
        books: bestBooks,
        kind: 'best',
        ranked: true,
      },
    ];

    for (const collection of collectionSections) {
      sections.push({
        title: collection.title,
        moreTo: `/books?section=collection&collectionId=${collection.collectionId}&source=home`,
        books: collection.books,
      });
    }

    return sections;
  }, [bestBooks, collectionSections, memberName, newBooks, recommendedBooks]);

  function moveBanner(direction: 1 | -1) {
    setBannerState(([currentIndex]) => [(currentIndex + direction + banners.length) % banners.length, direction]);
  }

  function selectBanner(index: number) {
    setBannerState(([currentIndex]) => [index, index >= currentIndex ? 1 : -1]);
  }

  function scrollRow(event: ReactMouseEvent<HTMLButtonElement>, direction: 1 | -1) {
    const wrap = event.currentTarget.closest('.home-book-row-scroll-wrap');
    const scrollEl = wrap?.querySelector('.home-book-row-scroll');
    scrollEl?.scrollBy({ left: direction * 640, behavior: 'smooth' });
  }

  function renderBookCard(book: BookItem) {
    return (
      <motion.div variants={sectionCardVariants} key={book.id}>
        <Link className="home-book-card" to={`/books/${book.id}`}>
          {book.coverImageUrl ? (
            <img className="home-book-cover" src={book.coverImageUrl} alt="" />
          ) : (
            <span className="home-book-cover" style={{ backgroundColor: book.tone }} />
          )}
          <strong>{book.title}</strong>
          <small>{book.author}</small>
        </Link>
      </motion.div>
    );
  }

  const activeBanner = banners[activeBannerIndex] ?? banners[0];

  return (
    <div className="home-page">
      <section
        className={`home-hero ${isAutoplayPaused ? 'is-paused' : ''}`}
        aria-label="광고 이벤트 배너"
        onMouseEnter={() => setIsBannerHovered(true)}
        onMouseLeave={() => setIsBannerHovered(false)}
        onFocus={() => setIsBannerHovered(true)}
        onBlur={() => setIsBannerHovered(false)}
      >
        <Link className="home-hero-link" to={activeBanner.linkTo ?? '/events'}>
          <div className="home-hero-track">
            <AnimatePresence initial={false} custom={bannerDirection}>
              <motion.article
                className={`home-hero-slide home-hero-slide-${activeBanner.theme ?? 'brown'}`}
                key={activeBanner.title}
                custom={bannerDirection}
                variants={heroSlideVariants}
                initial={prefersReducedMotion ? 'center' : 'enter'}
                animate="center"
                exit={prefersReducedMotion ? 'center' : 'exit'}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div className="home-hero-copy" variants={heroCopyContainerVariants}>
                  <motion.span variants={heroCopyItemVariants}>{activeBanner.badge}</motion.span>
                  <motion.h1 variants={heroCopyItemVariants}>{activeBanner.title}</motion.h1>
                  <motion.p variants={heroCopyItemVariants}>{activeBanner.description}</motion.p>
                </motion.div>
                <div className="home-hero-book-stack" aria-hidden="true">
                  {(activeBanner.covers?.length ? activeBanner.covers : [{ title: activeBanner.coverTitle, imageUrl: activeBanner.imageUrl }])
                    .slice(0, 2)
                    .map((cover) =>
                      cover.imageUrl ? (
                        <img
                          className="home-hero-face home-hero-face-image"
                          src={cover.imageUrl}
                          alt=""
                          key={`${activeBanner.title}-${cover.imageUrl}`}
                        />
                      ) : (
                        <div className="home-hero-face" key={`${activeBanner.title}-${cover.title}`}>
                          <span className="home-hero-face-icon">📖</span>
                          <strong>{cover.title}</strong>
                        </div>
                      ),
                    )}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </Link>
        <button type="button" className="home-hero-arrow home-hero-arrow-prev" aria-label="이전 배너 보기" onClick={() => moveBanner(-1)}>
          ‹
        </button>
        <button type="button" className="home-hero-arrow home-hero-arrow-next" aria-label="다음 배너 보기" onClick={() => moveBanner(1)}>
          ›
        </button>

        <div className="home-hero-controls" aria-label="배너 슬라이드 상태">
          <button
            type="button"
            className="home-hero-pause"
            aria-label={isAutoplayPaused ? '배너 자동 넘김 다시 시작' : '배너 자동 넘김 일시정지'}
            onClick={() => setIsAutoplayPaused((paused) => !paused)}
          >
            {isAutoplayPaused ? '▶' : 'Ⅱ'}
          </button>
          <span className="home-hero-count">
            {activeBannerIndex + 1} / {banners.length} +
          </span>
        </div>

        <div className="home-hero-dots" aria-label="배너 슬라이드 이동">
          {banners.map((banner, index) => (
            <button
              type="button"
              className={`home-hero-dot ${index === activeBannerIndex ? 'is-active' : ''}`}
              aria-label={`${index + 1}번째 배너 보기`}
              aria-current={index === activeBannerIndex ? 'true' : undefined}
              key={`${banner.title}-${index}`}
              onClick={() => selectBanner(index)}
            />
          ))}
        </div>
      </section>

      <div className="home-quick-menu" aria-label="빠른 메뉴">
        {quickMenuItems.map((item) => (
          <Link to={item.to} key={item.to}>
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </Link>
        ))}
      </div>

      {bookSections.map((section) => {
        const sectionClassName = [
          'home-book-section',
          section.kind ? `home-book-section-${section.kind}` : '',
          section.ranked ? 'home-book-section-best' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <section className={sectionClassName} key={section.moreTo}>
            <div className="home-section-heading">
              <div>
                <h2>
                  {section.kind === 'recommend' && memberName ? (
                    <>
                      <span className="home-member-name">{memberName}</span>님을 위한 ABC 추천 도서
                    </>
                  ) : (
                    section.title
                  )}
                </h2>
                {!memberName && section.title === 'ABC 추천 도서' ? (
                  <p>
                    지금 로그인하시면 ABC가 선택한 책을 보여드립니다. <Link to="/login">로그인하기</Link>
                  </p>
                ) : null}
              </div>
              <Link className="home-section-more" to={section.moreTo}>더보기</Link>
            </div>

            {section.ranked ? (
              <motion.div
                className="home-best-grid"
                variants={sectionGridVariants}
                initial={prefersReducedMotion ? false : 'hidden'}
                whileInView={prefersReducedMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 0.15 }}
              >
                {section.books.map((book) => renderBookCard(book))}
              </motion.div>
            ) : (
              <div className="home-book-row-scroll-wrap">
                <button
                  type="button"
                  className="home-book-row-arrow is-prev"
                  aria-label={`이전 ${section.title} 보기`}
                  onClick={(event) => scrollRow(event, -1)}
                >
                  ‹
                </button>
                {section.kind === 'latest' ? (
                  <motion.div
                    className="home-book-row home-book-row-scroll is-stacked"
                    variants={sectionGridVariants}
                    initial={prefersReducedMotion ? false : 'hidden'}
                    whileInView={prefersReducedMotion ? undefined : 'visible'}
                    viewport={{ once: true, amount: 0.15 }}
                  >
                    <div className="home-book-row-scroll-line">
                      {section.books.slice(0, 15).map((book) => renderBookCard(book))}
                    </div>
                    <div className="home-book-row-scroll-line">
                      {section.books.slice(15, 30).map((book) => renderBookCard(book))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="home-book-row home-book-row-scroll"
                    variants={sectionGridVariants}
                    initial={prefersReducedMotion ? false : 'hidden'}
                    whileInView={prefersReducedMotion ? undefined : 'visible'}
                    viewport={{ once: true, amount: 0.15 }}
                  >
                    {section.books.map((book) => renderBookCard(book))}
                  </motion.div>
                )}
                <button
                  type="button"
                  className="home-book-row-arrow is-next"
                  aria-label={`다음 ${section.title} 보기`}
                  onClick={(event) => scrollRow(event, 1)}
                >
                  ›
                </button>
              </div>
            )}
          </section>
        );
      })}

      <Link className="home-notice-ticker home-notice-footer" to={latestNotice ? `/notices/${latestNotice.noticeId}` : '/notices'}>
        <span className="home-notice-icon" aria-hidden="true">📢</span>
        <strong>NOTICE</strong>
        <p>{latestNotice ? latestNotice.title : '공지사항과 이벤트 소식을 ABC 메인에서 확인하세요.'}</p>
      </Link>
    </div>
  );
}
