import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from '../../../components/common/Pagination';
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
  { id: 1, bookName: '초록의 문장', subtitle: '신간 단독 공개', description: '새 책을 가장 먼저 만나는 ABC 이벤트', title: '초록의 문장 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#d8d8d8' },
  { id: 2, bookName: '밤의 서점', subtitle: '첫 대여 혜택', description: '읽고 싶던 책을 가볍게 시작하세요', title: '밤의 서점 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#b56aff' },
  { id: 3, bookName: '여름의 기록', subtitle: '포인트 추가 적립', description: '이벤트 기간 동안 더 크게 적립됩니다', title: '여름의 기록 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#ffd99b' },
  { id: 4, bookName: '작은 습관', subtitle: '추천 도서 기획전', description: '매일 읽기 좋은 책을 모았습니다', title: '작은 습관 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#add9ba' },
  { id: 5, bookName: '파란 시간', subtitle: '무료 체험 이벤트', description: '처음 만나는 독자를 위한 특별 혜택', title: '파란 시간 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#82c2f4' },
  { id: 6, bookName: '읽는 마음', subtitle: '베스트 작품전', description: '이번 주 많이 읽힌 책을 확인하세요', title: '읽는 마음 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#aad25e' },
  { id: 7, bookName: '회색 도시', subtitle: '장르 특별전', description: '몰입감 있는 이야기를 준비했습니다', title: '회색 도시 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#727271', dark: true },
  { id: 8, bookName: '분홍 편지', subtitle: '이달의 이벤트', description: '새로운 독서 취향을 찾아보세요', title: '분홍 편지 책 신간 출시', period: '2026.06.22 ~ 2026.07.22', tone: '#f36ac2' },
  { id: 9, bookName: '오늘의 과학', subtitle: '지식 도서 모음', description: '쉽게 읽는 과학 도서를 골라봤어요', title: '오늘의 과학 책 신간 출시', period: '2026.07.01 ~ 2026.07.31', tone: '#cdddf8' },
  { id: 10, bookName: '문장의 온도', subtitle: '에세이 추천전', description: '편하게 읽기 좋은 문장을 만나보세요', title: '문장의 온도 책 신간 출시', period: '2026.07.01 ~ 2026.07.31', tone: '#f4c1a1' },
  { id: 11, bookName: '경제의 감각', subtitle: '실용서 기획전', description: '지금 필요한 경제 감각을 채워보세요', title: '경제의 감각 책 신간 출시', period: '2026.07.01 ~ 2026.07.31', tone: '#c8e6c9' },
  { id: 12, bookName: '깊은 바다', subtitle: '소설 신작전', description: '새로 들어온 소설을 먼저 소개합니다', title: '깊은 바다 책 신간 출시', period: '2026.07.01 ~ 2026.07.31', tone: '#94d2bd' },
  { id: 13, bookName: '컴퓨터 노트', subtitle: 'IT 도서 특가', description: '개발과 컴퓨터 도서를 모았습니다', title: '컴퓨터 노트 책 신간 출시', period: '2026.07.08 ~ 2026.08.08', tone: '#bde0fe' },
  { id: 14, bookName: '조용한 여행', subtitle: '자연 도서전', description: '쉬어가는 마음으로 읽는 책', title: '조용한 여행 책 신간 출시', period: '2026.07.08 ~ 2026.08.08', tone: '#d9ed92' },
  { id: 15, bookName: '일상의 기술', subtitle: '자기계발 모음', description: '작은 변화를 만드는 책을 소개합니다', title: '일상의 기술 책 신간 출시', period: '2026.07.08 ~ 2026.08.08', tone: '#ffcad4' },
  { id: 16, bookName: '고전의 밤', subtitle: '인문 고전전', description: '오래 읽히는 책을 다시 만나는 시간', title: '고전의 밤 책 신간 출시', period: '2026.07.08 ~ 2026.08.08', tone: '#cdb4db' },
  { id: 17, bookName: '비밀 서가', subtitle: '숨은 명작전', description: '놓치기 아쉬운 작품을 준비했습니다', title: '비밀 서가 책 신간 출시', period: '2026.07.15 ~ 2026.08.15', tone: '#f7d6e0' },
  { id: 18, bookName: '푸른 문', subtitle: '신규 입고 알림', description: '이번 주 새로 들어온 책입니다', title: '푸른 문 책 신간 출시', period: '2026.07.15 ~ 2026.08.15', tone: '#90dbf4' },
  { id: 19, bookName: '말의 지도', subtitle: '교양 도서전', description: '생각을 넓히는 책을 만나보세요', title: '말의 지도 책 신간 출시', period: '2026.07.15 ~ 2026.08.15', tone: '#fbf8cc' },
  { id: 20, bookName: '별의 문장', subtitle: '만화 특별전', description: '가볍게 즐기는 인기 작품 모음', title: '별의 문장 책 신간 출시', period: '2026.07.15 ~ 2026.08.15', tone: '#ffcfd2' },
  { id: 21, bookName: '작가의 방', subtitle: '작가 추천전', description: '작가가 고른 책을 확인하세요', title: '작가의 방 책 신간 출시', period: '2026.07.22 ~ 2026.08.22', tone: '#d0f4de' },
  { id: 22, bookName: '오늘도 독서', subtitle: '출석 이벤트', description: '매일 읽고 혜택을 받아보세요', title: '오늘도 독서 책 신간 출시', period: '2026.07.22 ~ 2026.08.22', tone: '#a9def9' },
  { id: 23, bookName: '햇빛 책방', subtitle: '여름 기획전', description: '여름에 어울리는 책을 준비했습니다', title: '햇빛 책방 책 신간 출시', period: '2026.07.22 ~ 2026.08.22', tone: '#fcf6bd' },
  { id: 24, bookName: '검은 표지', subtitle: '스릴러 특별전', description: '긴장감 넘치는 작품을 소개합니다', title: '검은 표지 책 신간 출시', period: '2026.07.22 ~ 2026.08.22', tone: '#6c757d', dark: true },
  { id: 25, bookName: '새벽 독자', subtitle: '새벽 독서전', description: '조용한 시간에 어울리는 책', title: '새벽 독자 책 신간 출시', period: '2026.07.29 ~ 2026.08.29', tone: '#b8c0ff' },
  { id: 26, bookName: '느린 산책', subtitle: '힐링 도서전', description: '천천히 읽기 좋은 책을 모았습니다', title: '느린 산책 책 신간 출시', period: '2026.07.29 ~ 2026.08.29', tone: '#caffbf' },
  { id: 27, bookName: '도시의 문법', subtitle: '사회 도서전', description: '지금의 사회를 읽는 책', title: '도시의 문법 책 신간 출시', period: '2026.07.29 ~ 2026.08.29', tone: '#ffd6a5' },
  { id: 28, bookName: '책의 온기', subtitle: '독자 감사전', description: 'ABC 독자를 위한 작은 선물', title: '책의 온기 책 신간 출시', period: '2026.07.29 ~ 2026.08.29', tone: '#ffadad' },
  { id: 29, bookName: '하루 한 장', subtitle: '짧은 독서전', description: '부담 없이 시작하는 독서', title: '하루 한 장 책 신간 출시', period: '2026.08.01 ~ 2026.08.31', tone: '#bdb2ff' },
  { id: 30, bookName: '생각의 숲', subtitle: '인문 추천전', description: '깊게 생각하게 만드는 책', title: '생각의 숲 책 신간 출시', period: '2026.08.01 ~ 2026.08.31', tone: '#e9edc9' },
  { id: 31, bookName: '작은 세계', subtitle: '아동 도서전', description: '함께 읽기 좋은 책을 골랐어요', title: '작은 세계 책 신간 출시', period: '2026.08.01 ~ 2026.08.31', tone: '#caf0f8' },
  { id: 32, bookName: '긴 편지', subtitle: '감성 소설전', description: '마음을 건드리는 이야기를 만나보세요', title: '긴 편지 책 신간 출시', period: '2026.08.01 ~ 2026.08.31', tone: '#ffc8dd' },
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

      <Pagination
        className="event-pagination"
        currentPage={currentPage - 1}
        totalPages={totalPages}
        onPageChange={(nextPage) => changePage(nextPage + 1)}
        ariaLabel="이벤트 페이지 이동"
      />
    </div>
  );
}
