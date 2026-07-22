// 마이페이지 공통 레이아웃 — 상단 요약, 사이드 메뉴, 본문 영역을 배치
import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MyPageOverview } from './MyPageOverview';
import { MyPageSideMenu } from './MyPageSideMenu';
import { useMyProfile } from '../../context/MyProfileContext';

type MyPageLayoutProps = {
  titleId: string;
  children: ReactNode;
};

export function MyPageLayout({ titleId, children }: MyPageLayoutProps) {
  const { profile, isLoading, errorMessage } = useMyProfile();
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (location.pathname === '/me') return;

    requestAnimationFrame(() => {
      mainRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }, [location.pathname, location.search]);

  return (
    <div className="mypage-shell">
      <MyPageOverview profile={profile} isLoading={isLoading} errorMessage={errorMessage} />
      <div className="mypage-content-shell">
        <MyPageSideMenu />
        <section ref={mainRef} className="mypage-main" aria-labelledby={titleId}>
          {children}
        </section>
      </div>
    </div>
  );
}
