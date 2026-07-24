// 제네릭 공통 테이블 컴포넌트 — 컬럼 정의 기반으로 렌더링하며 로딩/빈 상태를 처리
import type { ReactNode } from 'react';
import styles from './Table.module.css';

export type TableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  /** 길어질 수 있는 텍스트 컬럼(도서명 등)의 최대 너비. 지정하면 한 줄로 말줄임 처리한다. */
  maxWidth?: string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  className?: string;
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  loadingMessage = '불러오는 중입니다.',
  emptyMessage = '데이터가 없습니다.',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`${styles.tableWrap} ${className}`.trim()}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={{ textAlign: column.align ?? 'left' }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length}>{loadingMessage}</td>
            </tr>
          ) : rows.length > 0 ? (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => {
                  const value = column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '');

                  return (
                    <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                      {column.maxWidth ? (
                        <span
                          className={styles.truncate}
                          style={{ maxWidth: column.maxWidth }}
                          title={typeof value === 'string' ? value : undefined}
                        >
                          {value}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
