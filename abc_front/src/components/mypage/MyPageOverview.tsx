import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../types/api';

type MyPageOverviewProps = {
  profile: UserProfile | null;
  isLoading: boolean;
  errorMessage?: string;
};

type BarStyle = CSSProperties & {
  '--bar-height': string;
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

function formatPoint(value: number | undefined) {
  return `${value ?? 0}p`;
}

function getPercent(value: number | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  return Math.min(100, Math.max(12, value * 12));
}

function getBarStyle(percent: number): BarStyle {
  return { '--bar-height': `${percent}%` };
}

export function MyPageOverview({ profile, isLoading, errorMessage = '' }: MyPageOverviewProps) {
  const displayProfile = profile ?? emptyProfile;
  const grade = displayProfile.gradeName ?? displayProfile.membershipGrade ?? '기본 등급';
  const topStats = [
    { label: '리뷰', value: valueOrDash(displayProfile.reviewCount) },
    { label: '포인트', value: formatPoint(displayProfile.point) },
    { label: '쿠폰', value: valueOrDash(displayProfile.couponCount) },
  ];
  const bottomStats = [
    { label: '대여', value: valueOrDash(displayProfile.rentalCount) },
    { label: '완독', value: valueOrDash(displayProfile.completedBookCount) },
    { label: '즐겨찾기', value: valueOrDash(displayProfile.favoriteCount) },
  ];
  const readingBars = [
    { label: '리뷰', value: valueOrDash(displayProfile.reviewCount), percent: getPercent(displayProfile.reviewCount, 44) },
    { label: '포인트', value: formatPoint(displayProfile.point), percent: getPercent(displayProfile.point, 72) },
    { label: '쿠폰', value: valueOrDash(displayProfile.couponCount), percent: getPercent(displayProfile.couponCount, 68) },
    { label: '대여', value: valueOrDash(displayProfile.rentalCount), percent: getPercent(displayProfile.rentalCount, 88) },
    { label: '완독', value: valueOrDash(displayProfile.completedBookCount), percent: getPercent(displayProfile.completedBookCount, 76) },
    { label: '즐겨찾기', value: valueOrDash(displayProfile.favoriteCount), percent: getPercent(displayProfile.favoriteCount, 32) },
    { label: '알림', value: valueOrDash(displayProfile.unreadNotificationCount), percent: getPercent(displayProfile.unreadNotificationCount, 58) },
    { label: '챌린지', value: valueOrDash(displayProfile.completedBookCount), percent: getPercent(displayProfile.completedBookCount, 28) },
    { label: '출석', value: valueOrDash(displayProfile.reviewCount), percent: getPercent(displayProfile.reviewCount, 24) },
  ];
  const attendanceCount = Math.min(7, Math.max(0, displayProfile.completedBookCount ?? 0));
  const challengeCount = Math.min(6, Math.max(0, displayProfile.reviewCount ?? 0));
  const readingStatsSummary = readingBars.map((item) => `${item.label} ${item.value}`).join(', ');

  return (
    <section className="page-section mypage-overview" aria-labelledby="mypage-overview-title">
      <h1 id="mypage-overview-title" className="visually-hidden">
        마이페이지 요약
      </h1>

      {isLoading ? <div className="status-banner">회원 정보를 불러오는 중입니다.</div> : null}
      {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

      <div className="mypage-dashboard-banner">
        <section className="profile-summary-card" aria-label="회원 요약">
          <div className="profile-avatar" aria-hidden="true">
            {displayProfile.name.slice(0, 1)}
          </div>
          <div className="profile-summary-stack">
            <div className="profile-chip-row">
              <Link className="profile-chip" to="/me/profile" aria-label="프로필 수정으로 이동">
                <span>이름</span>
                <strong>{displayProfile.name}</strong>
              </Link>
              <div className="profile-chip">
                <span aria-hidden="true">◆</span>
                <strong>회원등급</strong>
                <small>{grade}</small>
              </div>
            </div>
            <div className="count-card-grid count-card-grid-top" aria-label="리뷰 포인트 쿠폰 요약">
              {topStats.map((card) => (
                <div className="count-card" key={card.label}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="count-card-grid count-card-grid-bottom" aria-label="대여 완독 즐겨찾기 요약">
            {bottomStats.map((card) => (
              <div className="count-card" key={card.label}>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mypage-grid" aria-label="알림과 활동 요약">
          <article className="alert-panel overview-widget">
            <div className="overview-widget-title">
              <span className="overview-alert-icon" aria-hidden="true">
                !
              </span>
              <h2>반납 알림</h2>
            </div>
            <p className="overview-widget-surface">대여 {valueOrDash(displayProfile.rentalCount)}권 확인</p>
          </article>
          <article className="alert-panel overview-widget" aria-label="일반 알림">
            <div className="overview-widget-title">
              <span className="overview-alert-icon" aria-hidden="true">
                !
              </span>
              <h2>알림</h2>
            </div>
            <p className="overview-widget-surface">새 알림 {valueOrDash(displayProfile.unreadNotificationCount)}건</p>
          </article>
          <article className="activity-card overview-widget">
            <h2>출석체크</h2>
            <div className="overview-stamp-row" aria-label={`출석 스탬프 ${attendanceCount}개`}>
              {Array.from({ length: 7 }, (_, index) => (
                <span
                  className={`overview-stamp${index < attendanceCount ? ' is-active' : ''}`}
                  key={`attendance-${index + 1}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </article>
          <article className="activity-card overview-widget">
            <h2>챌린지 현황</h2>
            <div className="overview-trophy-row" aria-label={`챌린지 트로피 ${challengeCount}개`}>
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  className={`overview-trophy${index < challengeCount ? ' is-active' : ''}`}
                  key={`challenge-${index + 1}`}
                  aria-hidden="true"
                >
                  ♜
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="reading-stats" aria-label="독서 통계">
          <div className="section-heading-row">
            <h2>나의 독서통계</h2>
            <Link to="/me" aria-label="나의 독서통계 상세 보기">
              ›
            </Link>
          </div>
          <div className="mini-bar-list" role="img" aria-label={`나의 독서통계 막대그래프: ${readingStatsSummary}`}>
            {readingBars.map((item) => (
              <span
                className="mini-bar-fill"
                key={item.label}
                aria-hidden="true"
                style={getBarStyle(item.percent)}
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
