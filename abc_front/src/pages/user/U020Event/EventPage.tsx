import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../styles/event.css';

type EventItem = {
  id: number;
  bookName: string;
  subtitle: string;
  description: string;
  title: string;
  period: string;
  tone: string;
  dark?: boolean;
};

const PAGE_SIZE = 8;

const eventItems: EventItem[] = [
  { id: 1, bookName: '(과학이 톡톡 쌓이다!) 사이다 =Sci-da', subtitle: '과학 탐험 기획전', description: '어린이 과학 베스트 도서를 만나보세요', title: '사이다 =Sci-da 과학 탐험전', period: '2026.07.24 ~ 2026.08.31', tone: '#d8d8d8' },
  { id: 2, bookName: '(쉽고 재밌는) 컴퓨터와 코딩', subtitle: '코딩 첫걸음 이벤트', description: '처음 배우는 컴퓨터와 코딩 추천전', title: '컴퓨터와 코딩 입문 기획전', period: '2026.07.24 ~ 2026.08.31', tone: '#b56aff' },
  { id: 3, bookName: '신기한 스쿨 버스:키즈', subtitle: '스쿨버스 과학 여행', description: '아이들이 좋아하는 과학 도서를 모았어요', title: '신기한 스쿨 버스 입고 이벤트', period: '2026.07.24 ~ 2026.08.07', tone: '#ffd99b' },
  { id: 4, bookName: '도티&잠뜰 코딩', subtitle: '게임처럼 배우는 코딩', description: 'IT 어린이 추천 도서를 확인하세요', title: '도티&잠뜰 코딩 챌린지', period: '2026.07.24 ~ 2026.08.31', tone: '#add9ba' },
  { id: 5, bookName: '팜:기발한 상상력이 가득한 판타지 코딩과학동화', subtitle: '상상력 충전소', description: '코딩과 과학을 이야기로 읽어보세요', title: '팜 시리즈 상상력 충전전', period: '2026.07.24 ~ 2026.08.31', tone: '#82c2f4' },
  { id: 6, bookName: '휴대폰 전쟁', subtitle: '디지털 생활 독서 토론', description: '스마트폰 주제 도서로 생각을 나눠요', title: '휴대폰 전쟁 독서 토론 이벤트', period: '2026.07.24 ~ 2026.08.22', tone: '#aad25e' },
  { id: 7, bookName: '분수와 소수', subtitle: '수학이 쉬워지는 시간', description: '초등 수학 추천 도서를 만나보세요', title: '분수와 소수 수학 클리닉', period: '2026.08.01 ~ 2026.08.31', tone: '#727271', dark: true },
  { id: 8, bookName: '생각하지 않는 사람들', subtitle: '인터넷 시대의 생각법', description: '인문 교양 도서 기획전', title: '생각하는 독서 캠페인', period: '2026.08.01 ~ 2026.08.31', tone: '#f36ac2' },
];

export function EventPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filteredEvents = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase();

    if (!trimmedKeyword) {
      return eventItems;
    }

    return eventItems.filter((event) =>
      [event.bookName, event.subtitle, event.description, event.title]
        .join(' ')
        .toLowerCase()
        .includes(trimmedKeyword),
    );
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  return (
    <div className="event-page">
      <section className="event-page-heading">
        <h1>이벤트</h1>

        <label className="event-search">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
          </span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => handleKeywordChange(event.target.value)}
            placeholder="이벤트 검색"
            aria-label="이벤트 검색"
          />
        </label>
      </section>

      {visibleEvents.length > 0 ? (
        <section className="event-grid" aria-label="이벤트 목록">
          {visibleEvents.map((event) => (
            <Link
              className="event-card"
              to={`/events?eventId=${event.id}`}
              aria-label={`${event.title} 이벤트 보기`}
              key={event.id}
            >
              <div
                className={`event-banner ${event.dark ? 'is-dark' : ''}`}
                style={{ backgroundColor: event.tone }}
              >
                <div className="event-banner-copy">
                  <strong>&lt;{event.bookName}&gt;</strong>
                  <b>{event.subtitle}</b>
                  <span>{event.description}</span>
                </div>

                <div className="event-book-cover" aria-hidden="true">
                  <span />
                </div>
              </div>

              <div className="event-card-info">
                <h2>{event.title}</h2>
                <p>{event.period}</p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="event-empty">검색 결과가 없습니다.</div>
      )}

      <nav className="event-pagination" aria-label="이벤트 페이지 이동">
        <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
          &lt;
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            className={pageNumber === currentPage ? 'is-active' : ''}
            type="button"
            onClick={() => changePage(pageNumber)}
            key={pageNumber}
            aria-current={pageNumber === currentPage ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </nav>
    </div>
  );
}
