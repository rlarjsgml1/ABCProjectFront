// 홈 화면(U001) — 배너 슬라이드, 카테고리, 추천/신간/베스트 도서 섹션을 보여준다.
import { useEffect, useMemo, useState } from 'react';
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
  /** 운영 배너 이미지 URL. 값을 넣으면 플레이스홀더 대신 실제 이미지가 표시된다. */
  imageUrl?: string;
};

const bannerItems: BannerItem[] = [
  {
    badge: 'EVENT',
    title: 'ABC에서 만나는 이번 주 특별 도서',
    description: '추천 작품과 신간을 한곳에서 빠르게 확인해보세요.',
    coverTitle: 'ABC Pick',
  },
  {
    badge: 'NEW',
    title: '새로 들어온 전자책을 먼저 만나보세요',
    description: '매일 업데이트되는 신간 도서를 ABC가 골라드립니다.',
    coverTitle: 'New Book',
  },
  {
    badge: 'BEST',
    title: '지금 가장 많이 읽는 베스트 작품',
    description: '독자들이 선택한 인기 도서를 메인에서 바로 확인하세요.',
    coverTitle: 'Best Book',
  },
];

const quickMenuItems = [
  { to: '/me/attendance', icon: 'D-1', label: '출석체크', description: '매일 읽고 혜택 받기' },
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
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0 }),
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
  const [recommendedBooks, setRecommendedBooks] = useState<BookItem[]>(isLoggedIn ? fallbackRecommendedBooks : fallbackBestBooks);
  const [newBooks, setNewBooks] = useState<BookItem[]>(fallbackNewBooks);
  const [bestBooks, setBestBooks] = useState<BookItem[]>(fallbackBestBooks);
  const [latestNotice, setLatestNotice] = useState<NoticeItem | null>(null);
  const [collectionSection, setCollectionSection] = useState<{ collectionId: number; title: string; books: BookItem[] } | null>(null);
  const memberName = localStorage.getItem('memberName');

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setBannerState(([currentIndex]) => [(currentIndex + 1) % bannerItems.length, 1]);
    }, 5000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const [recommendedResult, latestResult, bestResult, noticeResult, collectionsResult] = await Promise.allSettled([
        isLoggedIn ? getRecommendedBooks(5) : getBestBooks(5),
        getLatestBooks(5),
        getBestBooks(10),
        getNotices(0, 1),
        getCollections({ status: 'ACTIVE', page: 0, size: 5, previewSize: 10 }),
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
        // 앞선 컬렉션에 도서가 하나도 없으면 건너뛰고, 실제로 보여줄 도서가 있는 첫 컬렉션을 찾는다.
        const collectionWithBooks = collectionsResult.value.content.find((collection) => collection.previewBooks.length > 0);
        if (collectionWithBooks) {
          setCollectionSection({
            collectionId: collectionWithBooks.collectionId,
            title: collectionWithBooks.collectionName,
            books: toCollectionBookItems(collectionWithBooks.previewBooks),
          });
        }
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
        title: memberName ? `${memberName}님을 위한 ABC 추천 도서` : 'ABC 추천 도서',
        moreTo: '/books?section=recommend&source=home',
        books: recommendedBooks,
        kind: 'recommend',
      },
      {
        title: 'NEW 신간',
        moreTo: '/books?section=latest&source=home',
        books: newBooks,
        kind: 'latest',
      },
      {
        title: 'BEST 작품',
        moreTo: '/books?section=best&source=home',
        books: bestBooks,
        kind: 'best',
        ranked: true,
      },
    ];

    if (collectionSection) {
      sections.push({
        title: collectionSection.title,
        moreTo: `/books?section=collection&collectionId=${collectionSection.collectionId}&source=home`,
        books: collectionSection.books,
      });
    }

    return sections;
  }, [bestBooks, collectionSection, memberName, newBooks, recommendedBooks]);

  function moveBanner(direction: 1 | -1) {
    setBannerState(([currentIndex]) => [(currentIndex + direction + bannerItems.length) % bannerItems.length, direction]);
  }

  const activeBanner = bannerItems[activeBannerIndex];

  return (
    <div className="home-page">
      <section className="home-hero" aria-label="광고 이벤트 배너">
        <Link className="home-hero-link" to="/events">
          <div className="home-hero-track">
            <AnimatePresence initial={false} custom={bannerDirection} mode="wait">
              <motion.article
                className="home-hero-slide"
                key={activeBanner.title}
                custom={bannerDirection}
                variants={heroSlideVariants}
                initial={prefersReducedMotion ? 'center' : 'enter'}
                animate="center"
                exit={prefersReducedMotion ? 'center' : 'exit'}
                transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeInOut' }}
              >
                <div className="home-hero-copy">
                  <span>{activeBanner.badge}</span>
                  <h1>{activeBanner.title}</h1>
                  <p>{activeBanner.description}</p>
                </div>
                <div className="home-hero-book" aria-hidden="true">
                  {activeBanner.imageUrl ? (
                    <img className="home-hero-face home-hero-face-image" src={activeBanner.imageUrl} alt="" />
                  ) : (
                    <div className="home-hero-face">
                      <span className="home-hero-face-icon">📖</span>
                      <strong>{activeBanner.coverTitle}</strong>
                    </div>
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

        <div className="home-hero-dots" role="tablist" aria-label="배너 슬라이드 이동">
          {bannerItems.map((banner, index) => (
            <button
              key={banner.title}
              type="button"
              role="tab"
              className={`home-hero-dot ${index === activeBannerIndex ? 'is-active' : ''}`}
              aria-label={`${index + 1}번째 배너로 이동`}
              aria-selected={index === activeBannerIndex}
              onClick={() => setBannerState(([currentIndex]) => [index, index > currentIndex ? 1 : -1])}
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
          <section className={sectionClassName} key={section.title}>
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
              <Link to={section.moreTo}>더보기 &gt;</Link>
            </div>

            <motion.div
              className={section.ranked ? 'home-best-grid' : 'home-book-row'}
              variants={sectionGridVariants}
              initial={prefersReducedMotion ? false : 'hidden'}
              whileInView={prefersReducedMotion ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.15 }}
            >
              {section.books.map((book, index) => (
                <motion.div variants={sectionCardVariants} key={book.id}>
                  <Link className="home-book-card" to={`/books/${book.id}`}>
                    {book.coverImageUrl ? (
                      <img className="home-book-cover" src={book.coverImageUrl} alt="" />
                    ) : (
                      <span className="home-book-cover" style={{ backgroundColor: book.tone }} />
                    )}
                    <strong>{section.ranked ? `${index + 1}. ${book.title}` : book.title}</strong>
                    <small>{book.author}</small>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
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
