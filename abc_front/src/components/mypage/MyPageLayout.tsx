import type { ReactNode } from 'react';
import { MyPageOverview } from './MyPageOverview';
import { MyPageSideMenu } from './MyPageSideMenu';
import type { UserProfile } from '../../types/api';

type MyPageLayoutProps = {
  profile: UserProfile | null;
  isLoading: boolean;
  errorMessage?: string;
  titleId: string;
  children: ReactNode;
};

export function MyPageLayout({ profile, isLoading, errorMessage, titleId, children }: MyPageLayoutProps) {
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
