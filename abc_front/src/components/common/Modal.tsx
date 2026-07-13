// 공통 모달 다이얼로그 — ESC/배경 클릭 닫기 등을 지원하는 재사용 가능한 모달 컴포넌트
import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: string;
  titleId?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  closeLabel?: string;
};

export function Modal({
  isOpen,
  onClose,
  title,
  eyebrow,
  titleId = 'modal-title',
  headerExtra,
  children,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = '',
  closeLabel = '닫기',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <section
        className={`${styles.modal} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <div className={styles.headerActions}>
            {headerExtra}
            <button className={styles.close} type="button" aria-label={closeLabel} onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
