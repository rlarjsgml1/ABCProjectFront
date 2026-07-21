// 홈 화면(U001) — 배너 슬라이드, 카테고리, 추천/신간/베스트 도서 섹션을 보여준다.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBestBooks, getLatestBooks, getRecommendedBooks } from '../../../api/bookApi';
import { getCollections } from '../../../api/collectionApi';
import type { BookCard } from '../../../types/api';
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

const bannerItems = [
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

const fallbackRecommendedBooks: BookItem[] = [
  { id: 1, title: '바람의 문장', author: '김하늘', tone: '#eda0a4' },
  { id: 2, title: '작은 도서관', author: '이서윤', tone: '#e8989d' },
  { id: 3, title: '기억의 지도', author: '박도현', tone: '#eea5a8' },
  { id: 4, title: '느린 오후', author: '정유진', tone: '#e9939b' },
  { id: 5, title: '여름의 끝', author: '한지우', tone: '#efa7aa' },
];

const fallbackNewBooks: BookItem[] = [
  { id: 11, title: '오늘의 문법', author: '차민서', tone: '#e4eda4' },
  { id: 12, title: '초록빛 밤', author: '윤나래', tone: '#e7efa6' },
  { id: 13, title: '생활의 발견', author: '오지훈', tone: '#e2eba0' },
  { id: 14, title: '코드 산책', author: '문서연', tone: '#e9f1aa' },
  { id: 15, title: '달빛 기록', author: '백도윤', tone: '#e5eda3' },
];

const fallbackBestBooks: BookItem[] = [
  { id: 21, title: '가장 긴 하루', author: '서민준', tone: '#e34d9c' },
  { id: 22, title: '기획자의 생각', author: '강유리', tone: '#df4597' },
  { id: 23, title: '마음의 온도', author: '임하린', tone: '#e0529f' },
  { id: 24, title: '도시와 사람', author: '최현우', tone: '#dd4293' },
  { id: 25, title: '일상의 기술', author: '신아영', tone: '#e457a2' },
  { id: 26, title: '새벽 독서', author: '권지호', tone: '#dc4997' },
  { id: 27, title: '설명의 힘', author: '류다은', tone: '#e24f9c' },
  { id: 28, title: '기억 수집가', author: '남도겸', tone: '#df4796' },
  { id: 29, title: '계절의 이름', author: '홍예린', tone: '#e454a0' },
  { id: 30, title: '책상 위 우주', author: '송이준', tone: '#dd4594' },
];

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
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [recommendedBooks, setRecommendedBooks] = useState<BookItem[]>(isLoggedIn ? fallbackRecommendedBooks : fallbackBestBooks);
  const [newBooks, setNewBooks] = useState<BookItem[]>(fallbackNewBooks);
  const [bestBooks, setBestBooks] = useState<BookItem[]>(fallbackBestBooks);
  const [collectionSection, setCollectionSection] = useState<{ collectionId: number; title: string; books: BookItem[] } | null>(null);
  const memberName = localStorage.getItem('memberName');

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveBannerIndex((currentIndex) => (currentIndex + 1) % bannerItems.length);
    }, 5000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const [recommendedResult, latestResult, bestResult, collectionsResult] = await Promise.allSettled([
        isLoggedIn ? getRecommendedBooks(5) : getBestBooks(5),
        getLatestBooks(5),
        getBestBooks(10),
        getCollections({ status: 'ACTIVE', page: 0, size: 1, previewSize: 10 }),
      ]);

      if (ignore) return;

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
        const firstCollection = collectionsResult.value.content[0];
        if (firstCollection && firstCollection.previewBooks.length > 0) {
          setCollectionSection({
            collectionId: firstCollection.collectionId,
            title: firstCollection.collectionName,
            books: toCollectionBookItems(firstCollection.previewBooks),
          });
        }
      }
    }

    void loadHomeData();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

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
    setActiveBannerIndex((currentIndex) => (currentIndex + direction + bannerItems.length) % bannerItems.length);
  }

  return (
    <div className="home-page">
      <section className="home-hero" aria-label="광고 이벤트 배너">
        <Link className="home-hero-link" to="/events">
          <div className="home-hero-track" style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}>
            {bannerItems.map((banner) => (
              <article className="home-hero-slide" key={banner.title}>
                <div className="home-hero-copy">
                  <span>{banner.badge}</span>
                  <h1>{banner.title}</h1>
                  <p>{banner.description}</p>
                </div>
                <div className="home-hero-book" aria-hidden="true">
                  <div className="home-hero-face">
                    <strong>{banner.coverTitle}</strong>
                    <small>ABC Book</small>
                  </div>
                </div>
              </article>
            ))}
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
              onClick={() => setActiveBannerIndex(index)}
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

            <div className={section.ranked ? 'home-best-grid' : 'home-book-row'}>
              {section.books.map((book, index) => (
                <Link className="home-book-card" to={`/books/${book.id}`} key={book.id}>
                  {book.coverImageUrl ? (
                    <img className="home-book-cover" src={book.coverImageUrl} alt="" />
                  ) : (
                    <span className="home-book-cover" style={{ backgroundColor: book.tone }} />
                  )}
                  <strong>{section.ranked ? `${index + 1}. ${book.title}` : book.title}</strong>
                  <small>{book.author}</small>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <Link className="home-notice-ticker home-notice-footer" to="/notices">
        <span className="home-notice-icon" aria-hidden="true">📢</span>
        <strong>NOTICE</strong>
        <p>공지사항과 이벤트 소식을 ABC 메인에서 확인하세요.</p>
      </Link>
    </div>
  );
}
