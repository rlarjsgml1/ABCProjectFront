// 데이터가 없을 때 제목/설명을 보여주는 공통 빈 상태(empty state) 컴포넌트
type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
