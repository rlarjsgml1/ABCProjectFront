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
