import { Link } from 'react-router-dom';
import { EmptyState } from '../common/EmptyState';
import type { UserProfile } from '../../types/api';

type MyPageOverviewProps = {
  profile: UserProfile | null;
  isLoading: boolean;
  errorMessage?: string;
};

const emptyProfile: UserProfile = {
  loginId: '-',
  name: '회원',
  email: '-',
  phone: '-',
  gender: '-',
  birthDate: '-',
  role: '-',
  status: '-',
  point: 0,
  couponCount: 0,
  rentalCount: 0,
  completedBookCount: 0,
  favoriteCount: 0,
  unreadNotificationCount: 0,
  reviewCount: 0,
};

function valueOrDash(value: string | number | undefined) {
  return value ?? '-';
}

function getPercent(value: number | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  return Math.min(100, Math.max(12, value * 12));
}

export function MyPageOverview({ profile, isLoading, errorMessage = '' }: MyPageOverviewProps) {
  const displayProfile = profile ?? emptyProfile;
  const grade = displayProfile.gradeName ?? displayProfile.membershipGrade ?? '기본 등급';
  const countCards = [
    { label: '리뷰', value: valueOrDash(displayProfile.reviewCount) },
    { label: '포인트', value: valueOrDash(displayProfile.point) },
    { label: '쿠폰', value: valueOrDash(displayProfile.couponCount) },
    { label: '대여중', value: valueOrDash(displayProfile.rentalCount) },
    { label: '완독', value: valueOrDash(displayProfile.completedBookCount) },
    { label: '즐겨찾기', value: valueOrDash(displayProfile.favoriteCount) },
  ];
  const readingStats = [
    { label: '대여', value: displayProfile.rentalCount ?? 0, percent: getPercent(displayProfile.rentalCount, 56) },
    { label: '완독', value: displayProfile.completedBookCount ?? 0, percent: getPercent(displayProfile.completedBookCount, 72) },
    { label: '리뷰', value: displayProfile.reviewCount ?? 0, percent: getPercent(displayProfile.reviewCount, 38) },
    { label: '관심', value: displayProfile.favoriteCount ?? 0, percent: getPercent(displayProfile.favoriteCount, 64) },
  ];

  return (
    <section className="page-section mypage-overview" aria-labelledby="mypage-overview-title">
      <div className="mypage-overview-hero">
        <div>
          <p className="eyebrow">MY PAGE</p>
          <h1 id="mypage-overview-title">마이페이지</h1>
          <p>내 서재와 이용 현황, 알림을 한 화면에서 확인하세요.</p>
        </div>
        <Link className="button button-primary" to="/me/profile">
          프로필 수정
        </Link>
      </div>

      {isLoading ? <div className="status-banner">회원 정보를 불러오는 중입니다.</div> : null}
      {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

      <div className="mypage-overview-summary">
        <section className="profile-summary-card" aria-label="회원 요약">
          <div className="profile-avatar" aria-hidden="true">
            {displayProfile.name.slice(0, 1)}
          </div>
          <div className="profile-summary-content">
            <p className="eyebrow">PROFILE</p>
            <h2>{displayProfile.name}</h2>
            <p>{grade}</p>
            <dl className="profile-meta-list">
              <div>
                <dt>아이디</dt>
                <dd>{displayProfile.loginId}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{displayProfile.status}</dd>
              </div>
              <div>
                <dt>알림</dt>
                <dd>{valueOrDash(displayProfile.unreadNotificationCount)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="count-card-grid" aria-label="이용 현황 요약">
          {countCards.map((card) => (
            <article className="count-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>
      </div>

      <section className="mypage-grid" aria-label="알림 요약">
        <article className="page-section alert-panel">
          <p className="eyebrow">RETURN ALERT</p>
          <h2>반납 알림</h2>
          <p>반납 예정 도서가 표시될 영역입니다.</p>
          <EmptyState title="현재 반납 알림이 없습니다." />
        </article>
        <article className="page-section alert-panel">
          <p className="eyebrow">NOTICE</p>
          <h2>일반 알림</h2>
          <p>서비스 공지와 개인 알림이 표시될 영역입니다.</p>
          <EmptyState title="새 알림이 없습니다." />
        </article>
      </section>

      <section className="mypage-grid" aria-label="활동 요약">
        <article className="page-section activity-card">
          <p className="eyebrow">ATTENDANCE</p>
          <h2>출석 현황</h2>
          <p>오늘의 출석과 연속 출석 기록을 연결할 예정입니다.</p>
        </article>
        <article className="page-section activity-card">
          <p className="eyebrow">CHALLENGE</p>
          <h2>챌린지</h2>
          <p>참여 중인 독서 챌린지 카드가 표시될 영역입니다.</p>
        </article>
      </section>

      <section className="page-section reading-stats" aria-label="독서 통계">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">READING STATS</p>
            <h2>독서 통계</h2>
          </div>
          <span>최근 이용 기준</span>
        </div>
        <div className="mini-bar-list">
          {readingStats.map((item) => (
            <div className="mini-bar-row" key={item.label}>
              <span>{item.label}</span>
              <div className="mini-bar-track" aria-hidden="true">
                <div className="mini-bar-fill" style={{ width: `${item.percent}%` }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
