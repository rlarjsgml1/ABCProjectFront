// 홈 화면(U001) — 배너 슬라이드, 카테고리, 추천/신간/베스트 도서 섹션을 보여준다.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBestBooks, getCategories, getLatestBooks, getRecommendedBooks } from '../../../api/bookApi';
import type { BookCard, Category } from '../../../types/api';
import '../../../styles/home.css';

type BookItem = {
  id: number;
  title: string;
  author: string;
  tone: string;
  coverImageUrl?: string;
};

type HomeCategory = {
  id?: number;
  name: string;
};

type BookSection = {
  title: string;
  moreTo: string;
  books: BookItem[];
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

const fallbackCategories: HomeCategory[] = [
  { name: '소설' },
  { name: '경제 / 경영' },
  { name: '인문 / 사회 / 역사' },
  { name: '컴퓨터 / IT' },
  { name: '자기계발' },
  { name: '에세이 / 시' },
  { name: '자연 / 환경' },
  { name: '전공서적' },
];

const categoryIcons = ['📖', '💼', '🏛', '💻', '🌱', '✒️', '🌿', '⭐'];

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

function toHomeCategories(categories: Category[]) {
  if (!categories.length) return fallbackCategories;

  return categories.map((category) => ({
    id: category.categoryId,
    name: category.name,
  }));
}

function getCategoryLink(category: HomeCategory) {
  if (category.id) {
    return `/books?parentCategoryId=${category.id}`;
  }

  return `/books?category=${encodeURIComponent(category.name)}`;
}

export function HomePage() {
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [categories, setCategories] = useState<HomeCategory[]>(fallbackCategories);
  const [recommendedBooks, setRecommendedBooks] = useState<BookItem[]>(isLoggedIn ? fallbackRecommendedBooks : fallbackBestBooks);
  const [newBooks, setNewBooks] = useState<BookItem[]>(fallbackNewBooks);
  const [bestBooks, setBestBooks] = useState<BookItem[]>(fallbackBestBooks);
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
      const [categoriesResult, recommendedResult, latestResult, bestResult] = await Promise.allSettled([
        getCategories(),
        isLoggedIn ? getRecommendedBooks(5) : getBestBooks(5),
        getLatestBooks(5),
        getBestBooks(10),
      ]);

      if (ignore) return;

      if (categoriesResult.status === 'fulfilled') {
        setCategories(toHomeCategories(categoriesResult.value));
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
    }

    void loadHomeData();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const bookSections: BookSection[] = useMemo(
    () => [
      {
        title: memberName ? `${memberName}님을 위한 ABC 추천 도서` : 'ABC 추천 도서',
        moreTo: '/books?section=recommend&source=home',
        books: recommendedBooks,
      },
      {
        title: 'NEW 신간',
        moreTo: '/books?section=latest&source=home',
        books: newBooks,
      },
      {
        title: 'BEST 작품',
        moreTo: '/books?section=best&source=home',
        books: bestBooks,
        ranked: true,
      },
    ],
    [bestBooks, memberName, newBooks, recommendedBooks],
  );

  return (
    <div className="home-page">
      <section className="home-hero" aria-label="광고 이벤트 배너">
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
        <Link to="/me/attendance">출석체크</Link>
        <Link to="/notices">이벤트</Link>
        <Link to="/me/challenges">챌린지</Link>
      </div>

      <Link className="home-notice-ticker" to="/notices">
        <span aria-hidden="true">NOTICE</span>
        <p>공지사항과 이벤트 소식을 ABC 메인에서 확인하세요.</p>
      </Link>

      <section className="home-category-section">
        <div className="home-section-heading">
          <h2>카테고리</h2>
          <Link to="/books">더보기 &gt;</Link>
        </div>
        <div className="home-category-grid">
          {categories.map((category, index) => (
            <Link className="home-category-item" to={getCategoryLink(category)} key={category.id ?? category.name}>
              <span aria-hidden="true">{categoryIcons[index % categoryIcons.length]}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      {bookSections.map((section) => (
        <section className={`home-book-section ${section.ranked ? 'home-book-section-best' : ''}`} key={section.title}>
          <div className="home-section-heading">
            <div>
              <h2>{section.title}</h2>
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
      ))}
    </div>
  );
}
