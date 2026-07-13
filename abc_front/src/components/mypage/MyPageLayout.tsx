// 마이페이지 공통 레이아웃 — 상단 요약, 사이드 메뉴, 본문 영역을 배치
import type { ReactNode } from 'react';
import { MyPageOverview } from './MyPageOverview';
import { MyPageSideMenu } from './MyPageSideMenu';
import { useMyProfile } from '../../context/MyProfileContext';

type MyPageLayoutProps = {
  titleId: string;
  children: ReactNode;
};

export function MyPageLayout({ titleId, children }: MyPageLayoutProps) {
  const { profile, isLoading, errorMessage } = useMyProfile();

  return (
    <div className="mypage-shell">
      <MyPageOverview profile={profile} isLoading={isLoading} errorMessage={errorMessage} />
      <div className="mypage-content-shell">
        <MyPageSideMenu />
        <section className="mypage-main" aria-labelledby={titleId}>
          {children}
        </section>
      </div>
    </div>
  );
}
