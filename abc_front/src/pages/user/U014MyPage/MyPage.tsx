import { EmptyState } from '../../../components/common/EmptyState';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';

const libraryItems = [
  { title: '대여 중인 도서', description: '현재 읽고 있는 전자책 목록이 연결될 영역입니다.' },
  { title: '완독 도서', description: '완독 처리한 도서와 최근 독서 기록을 표시합니다.' },
  { title: '나의 리뷰', description: '작성한 리뷰와 별점 활동이 모이는 공간입니다.' },
];

export function MyPage() {
  return (
    <MyPageLayout titleId="mypage-library-title">
      <section className="page-section usage-history-panel">
        <div className="section-heading-row">
          <div>
            <h2 id="mypage-library-title">내 서재</h2>
          </div>
          <span>이용 현황</span>
        </div>
        <p>대여, 완독, 리뷰 활동이 연결되면 이 영역에서 내 독서 흐름을 확인합니다.</p>
        <div className="library-preview-list" aria-label="내 서재 미리보기">
          {libraryItems.map((item) => (
            <article className="library-preview-item" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <EmptyState title="표시할 이용 내역이 없습니다." description="대여, 완독, 리뷰 API 연결 후 목록을 표시합니다." />
      </section>
    </MyPageLayout>
  );
}
