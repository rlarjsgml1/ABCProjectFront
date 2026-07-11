import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adjustAdminMemberPoint, changeAdminMemberStatus, getAdminMember } from '../../../api/adminMemberApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminMemberDetail,
  AdminMemberPaymentHistory,
  AdminMemberPointHistory,
  AdminMemberReportHistory,
  AdminMemberRentalHistory,
  AdminMemberReviewHistory,
  AdminMemberSanctionHistory,
  AdminMemberStatus,
  AdminMemberStatusChangeRequest,
  AdminSanctionType,
} from '../../../types/api';
import styles from './AdminMemberDetailPage.module.css';

type HistoryTab = 'rentals' | 'payments' | 'reviews' | 'reports' | 'points' | 'sanctions';

const statusOptions: Array<{ value: AdminMemberStatus; label: string }> = [
  { value: 'JOINED', label: '가입' },
  { value: 'SANCTIONED', label: '제재' },
  { value: 'WITHDRAWN', label: '탈퇴' },
  { value: 'DEACTIVATED', label: '비활성' },
];

const roleLabels = {
  USER: '회원',
  ADMIN: '관리자',
};

const sanctionTypeOptions: Array<{ value: AdminSanctionType; label: string }> = [
  { value: 'ACCOUNT_SUSPENSION', label: '계정 정지' },
  { value: 'SERVICE_LIMIT', label: '서비스 제한' },
  { value: 'WARNING', label: '경고' },
];

const tabs: Array<{ value: HistoryTab; label: string }> = [
  { value: 'rentals', label: '대여 내역' },
  { value: 'payments', label: '결제 내역' },
  { value: 'reviews', label: '리뷰 내역' },
  { value: 'reports', label: '책/리뷰 신고 내역' },
  { value: 'points', label: '포인트 이력' },
  { value: 'sanctions', label: '제재 이력' },
];

const fallbackMember: AdminMemberDetail = {
  memberId: 1024,
  loginId: 'park_reader',
  name: '박서연',
  email: 'seoyeon.park@example.com',
  phone: '010-1234-5678',
  birthDate: '1994-03-12',
  gender: '여성',
  role: 'USER',
  gradeId: 3,
  gradeName: '골드',
  pointBalance: 18500,
  status: 'JOINED',
  currentSanction: null,
  usageSummary: {
    rentalCount: 32,
    paymentAmount: 86000,
    reportCount: 1,
    reviewCount: 8,
    completedBookCount: 18,
    readingBookCount: 3,
  },
  rentalHistories: [
    {
      rentalId: 3001,
      bookTitle: '데이터베이스 입문',
      status: 'READING',
      progressRate: 68,
      rentedAt: '2026-06-08T10:20:00',
    },
  ],
  paymentHistories: [
    {
      paymentId: 801,
      bookTitle: '데이터베이스 입문',
      originalAmount: 26500,
      discountAmount: 3000,
      paidAmount: 23500,
      status: 'PAID',
      paidAt: '2026-06-08T10:21:00',
    },
  ],
  reviewHistories: [
    {
      reviewId: 501,
      bookTitle: '데이터베이스 입문',
      rating: 4,
      status: '노출',
      createdAt: '2026-06-12T18:30:00',
      updatedAt: '2026-06-13T09:10:00',
    },
  ],
  reportHistories: [
    {
      reportId: 41,
      targetType: 'REVIEW',
      reason: '부적절한 표현',
      status: '처리 완료',
      createdAt: '2026-06-15T14:05:00',
    },
  ],
  pointHistories: [
    {
      pointHistoryId: 71,
      pointType: 'ADMIN_ADJUST',
      pointAmount: 1000,
      description: '이벤트 보상 지급',
      createdAt: '2026-06-20T09:00:00',
    },
  ],
  sanctionHistories: [
    {
      sanctionHistoryId: 11,
      sanctionType: 'WARNING',
      startedAt: '2026-05-01',
      endedAt: '2026-05-01',
      reason: '리뷰 신고 누적 안내',
      status: '완료',
    },
  ],
};

function getOptionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | string | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

function formatDate(value: string | undefined) {
  if (!value) return '-';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(time);
}

function formatDateTime(value: string | undefined) {
  if (!value) return '-';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(time);
}

function formatMoney(value: number | undefined) {
  return `${(value ?? 0).toLocaleString('ko-KR')}원`;
}

function formatPoint(value: number | undefined) {
  return `${(value ?? 0).toLocaleString('ko-KR')}P`;
}

function getSanctionText(member: AdminMemberDetail) {
  const sanction = member.currentSanction;
  if (!sanction) return '없음';

  const type = getOptionLabel(sanctionTypeOptions, sanction.sanctionType);
  const endedAt = sanction.endedAt ? `${formatDate(sanction.endedAt)} 종료` : '';

  return [type, endedAt].filter(Boolean).join(' · ');
}

function getEmptyPage(memberId: number): AdminMemberDetail {
  return {
    ...fallbackMember,
    memberId,
    rentalHistories: [],
    paymentHistories: [],
    reviewHistories: [],
    reportHistories: [],
    pointHistories: [],
    sanctionHistories: [],
  };
}

export function AdminMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const numericMemberId = Number(memberId);
  const [member, setMember] = useState<AdminMemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState<HistoryTab>('rentals');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusForm, setStatusForm] = useState<AdminMemberStatusChangeRequest>({
    status: 'JOINED',
    reason: '',
  });
  const [pointForm, setPointForm] = useState({
    pointAmount: '',
    description: '',
  });

  async function loadMember() {
    if (!Number.isFinite(numericMemberId)) {
      setErrorMessage('회원 번호가 올바르지 않습니다.');
      setMember(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getAdminMember(numericMemberId);
      setMember(data);
    } catch (error) {
      setMember(getEmptyPage(numericMemberId));
      setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 상세 정보를 표시합니다.`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMember();
  }, [numericMemberId]);

  function openStatusModal() {
    if (!member) return;

    setStatusForm({
      status: member.status,
      reason: '',
      sanctionType: member.currentSanction?.sanctionType as AdminSanctionType | undefined,
      startedAt: '',
      endedAt: '',
    });
    setModalError('');
    setIsStatusModalOpen(true);
  }

  function openPointModal() {
    setPointForm({
      pointAmount: '',
      description: '',
    });
    setModalError('');
    setIsPointModalOpen(true);
  }

  function closeModals() {
    if (isSaving) return;
    setIsStatusModalOpen(false);
    setIsPointModalOpen(false);
    setModalError('');
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) return;

    if (!statusForm.reason.trim()) {
      setModalError('상태 변경 사유를 입력해 주세요.');
      return;
    }

    if (statusForm.status === 'SANCTIONED') {
      if (!statusForm.sanctionType || !statusForm.startedAt || !statusForm.endedAt) {
        setModalError('제재 상태는 제재 유형, 시작일, 종료일을 모두 입력해야 합니다.');
        return;
      }

      if (new Date(statusForm.startedAt).getTime() > new Date(statusForm.endedAt).getTime()) {
        setModalError('제재 종료일은 시작일보다 빠를 수 없습니다.');
        return;
      }
    }

    setIsSaving(true);
    setModalError('');

    try {
      await changeAdminMemberStatus(member.memberId, statusForm);
      setStatusMessage('회원 상태가 변경되었습니다.');
      setIsStatusModalOpen(false);
      await loadMember();
    } catch (error) {
      setModalError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePointSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) return;

    const pointAmount = Number(pointForm.pointAmount);

    if (!Number.isFinite(pointAmount) || !Number.isInteger(pointAmount) || pointAmount === 0) {
      setModalError('포인트 금액은 0이 아닌 정수로 입력해 주세요.');
      return;
    }

    if (pointAmount < 0 && member.pointBalance + pointAmount < 0) {
      setModalError('포인트 차감액은 현재 잔액보다 클 수 없습니다.');
      return;
    }

    if (!pointForm.description.trim()) {
      setModalError('포인트 조정 사유를 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    try {
      await adjustAdminMemberPoint(member.memberId, {
        pointAmount,
        description: pointForm.description.trim(),
      });
      setStatusMessage('회원 포인트가 조정되었습니다.');
      setIsPointModalOpen(false);
      await loadMember();
    } catch (error) {
      setModalError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className={`page-section ${styles.page}`}>
        <p className={styles.notice}>회원 상세 정보를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (!member) {
    return (
      <section className={`page-section ${styles.page}`}>
        <p className={styles.notice}>{errorMessage || '회원 정보를 찾을 수 없습니다.'}</p>
        <Button type="button" variant="secondary" onClick={() => navigate('/admin/members')}>
          목록으로
        </Button>
      </section>
    );
  }

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-member-detail-title">
      <div className={styles.header}>
        <div>
          <h1 id="admin-member-detail-title">회원 상세/상태 관리</h1>
        </div>
        <div className={styles.headerActions}>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/members')}>
            목록으로
          </Button>
          <Button type="button" onClick={openStatusModal}>
            상태 변경
          </Button>
          <Button type="button" className={styles.darkButton} onClick={openPointModal}>
            포인트 지급/차감
          </Button>
        </div>
      </div>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}
      {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}

      <div className={styles.summaryGrid}>
        <InfoCard
          title="기본 정보"
          rows={[
            ['아이디', member.loginId],
            ['이름', member.name],
            ['이메일', member.email],
            ['전화번호', member.phone ?? '-'],
            ['생년월일', formatDate(member.birthDate)],
            ['성별', member.gender ?? '-'],
          ]}
        />
        <InfoCard
          title="계정 정보"
          badge={getOptionLabel(statusOptions, member.status)}
          badgeTone={member.status}
          rows={[
            ['역할', roleLabels[member.role] ?? member.role],
            ['상태', getOptionLabel(statusOptions, member.status)],
            ['등급', member.gradeName ?? '-'],
            ['포인트', formatPoint(member.pointBalance)],
            ['제재 이력 요약', `${member.sanctionHistories.length}건`],
            ['현재 유효 제재', getSanctionText(member)],
          ]}
        />
        <InfoCard
          title="이용 요약"
          rows={[
            ['대여', `${member.usageSummary.rentalCount.toLocaleString('ko-KR')}건`],
            ['결제', formatMoney(member.usageSummary.paymentAmount)],
            ['책/리뷰 신고', `${member.usageSummary.reportCount.toLocaleString('ko-KR')}건`],
            ['리뷰', `${member.usageSummary.reviewCount.toLocaleString('ko-KR')}건`],
            ['독서 통계', `완독 ${member.usageSummary.completedBookCount}권 · 진행 ${member.usageSummary.readingBookCount}권`],
            [
              '전체보기',
              <div className={styles.inlineActions} key="links">
                <Link to={`/admin/rentals?memberId=${member.memberId}`}>대여 전체보기</Link>
                <Link to={`/admin/payments?memberId=${member.memberId}`}>결제 전체보기</Link>
              </div>,
            ],
          ]}
        />
      </div>

      <div className={styles.historyPanel}>
        <div className={styles.tabs} role="tablist" aria-label="회원 이력">
          {tabs.map((tab) => (
            <button type="button" role="tab" aria-selected={activeTab === tab.value} className={activeTab === tab.value ? styles.activeTab : ''} key={tab.value} onClick={() => setActiveTab(tab.value)}>
              {tab.label}
            </button>
          ))}
        </div>

        <HistoryTable activeTab={activeTab} member={member} />
      </div>

      {isStatusModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeModals}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-status-modal-title" onSubmit={handleStatusSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="member-status-modal-title">회원 상태 변경</h2>
                <p>
                  {member.loginId} / {member.name}
                </p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeModals}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label>
              변경 상태
              <select
                value={statusForm.status}
                onChange={(event) =>
                  setStatusForm((current) => ({
                    ...current,
                    status: event.target.value as AdminMemberStatus,
                    sanctionType: event.target.value === 'SANCTIONED' ? current.sanctionType ?? 'ACCOUNT_SUSPENSION' : undefined,
                  }))
                }
              >
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {statusForm.status === 'SANCTIONED' ? (
              <div className={styles.formGrid}>
                <label>
                  제재 유형
                  <select value={statusForm.sanctionType ?? 'ACCOUNT_SUSPENSION'} onChange={(event) => setStatusForm((current) => ({ ...current, sanctionType: event.target.value as AdminSanctionType }))}>
                    {sanctionTypeOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  시작일
                  <input type="date" value={statusForm.startedAt ?? ''} onChange={(event) => setStatusForm((current) => ({ ...current, startedAt: event.target.value }))} />
                </label>
                <label>
                  종료일
                  <input type="date" value={statusForm.endedAt ?? ''} onChange={(event) => setStatusForm((current) => ({ ...current, endedAt: event.target.value }))} />
                </label>
              </div>
            ) : null}

            <label>
              사유
              <textarea rows={4} value={statusForm.reason} placeholder="상태 변경 사유를 입력하세요." onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))} />
            </label>

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeModals} disabled={isSaving}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중' : '저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {isPointModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeModals}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-point-modal-title" onSubmit={handlePointSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="member-point-modal-title">포인트 지급/차감</h2>
                <p>현재 잔액 {formatPoint(member.pointBalance)}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeModals}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label>
              조정 포인트
              <input type="number" value={pointForm.pointAmount} placeholder="지급은 양수, 차감은 음수" onChange={(event) => setPointForm((current) => ({ ...current, pointAmount: event.target.value }))} />
            </label>

            <label>
              사유
              <textarea rows={4} value={pointForm.description} placeholder="포인트 조정 사유를 입력하세요." onChange={(event) => setPointForm((current) => ({ ...current, description: event.target.value }))} />
            </label>

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeModals} disabled={isSaving}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중' : '저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function InfoCard({
  title,
  rows,
  badge,
  badgeTone,
}: {
  title: string;
  rows: Array<[string, string | JSX.Element]>;
  badge?: string;
  badgeTone?: AdminMemberStatus;
}) {
  return (
    <section className={styles.infoCard}>
      <div className={styles.cardTitle}>
        <h2>{title}</h2>
        {badge ? <span className={`${styles.statusBadge} ${styles[`status${badgeTone}`]}`}>{badge}</span> : null}
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HistoryTable({ activeTab, member }: { activeTab: HistoryTab; member: AdminMemberDetail }) {
  if (activeTab === 'rentals') {
    return <Table rows={member.rentalHistories} emptyMessage="대여 내역이 없습니다." columns={['도서', '상태', '진행률', '일자', '관리']} renderRow={(item) => <RentalRow item={item} memberId={member.memberId} />} />;
  }

  if (activeTab === 'payments') {
    return <Table rows={member.paymentHistories} emptyMessage="결제 내역이 없습니다." columns={['도서', '금액', '상태', '일자', '관리']} renderRow={(item) => <PaymentRow item={item} memberId={member.memberId} />} />;
  }

  if (activeTab === 'reviews') {
    return <Table rows={member.reviewHistories} emptyMessage="리뷰 내역이 없습니다." columns={['도서', '별점', '상태', '일자', '관리']} renderRow={(item) => <ReviewRow item={item} />} />;
  }

  if (activeTab === 'reports') {
    return <Table rows={member.reportHistories} emptyMessage="신고 내역이 없습니다." columns={['대상', '내용', '상태', '일자', '관리']} renderRow={(item) => <ReportRow item={item} />} />;
  }

  if (activeTab === 'points') {
    return <Table rows={member.pointHistories} emptyMessage="포인트 이력이 없습니다." columns={['이력 구분', '내용', '포인트', '일자', '관리']} renderRow={(item) => <PointRow item={item} />} />;
  }

  return <Table rows={member.sanctionHistories} emptyMessage="제재 이력이 없습니다." columns={['제재 유형', '사유', '상태', '기간', '관리']} renderRow={(item) => <SanctionRow item={item} />} />;
}

function Table<T>({ rows, columns, emptyMessage, renderRow }: { rows: T[]; columns: string[]; emptyMessage: string; renderRow: (item: T) => JSX.Element }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map(renderRow)
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

function RentalRow({ item, memberId }: { item: AdminMemberRentalHistory; memberId: number }) {
  return (
    <tr>
      <td>{item.bookTitle}</td>
      <td>{item.status}</td>
      <td>{item.progressRate ?? 0}%</td>
      <td>{formatDateTime(item.rentedAt)}</td>
      <td>
        <Link className={styles.tableAction} to={`/admin/rentals?memberId=${memberId}`}>
          대여 전체보기
        </Link>
      </td>
    </tr>
  );
}

function PaymentRow({ item, memberId }: { item: AdminMemberPaymentHistory; memberId: number }) {
  return (
    <tr>
      <td>{item.bookTitle}</td>
      <td>
        {formatMoney(item.paidAmount)}
        <span className={styles.subText}>할인 {formatMoney(item.discountAmount)}</span>
      </td>
      <td>{item.status}</td>
      <td>{formatDateTime(item.paidAt)}</td>
      <td>
        <Link className={styles.tableAction} to={`/admin/payments?memberId=${memberId}`}>
          결제 전체보기
        </Link>
      </td>
    </tr>
  );
}

function ReviewRow({ item }: { item: AdminMemberReviewHistory }) {
  return (
    <tr>
      <td>{item.bookTitle}</td>
      <td>{item.rating}점</td>
      <td>{item.status}</td>
      <td>{formatDateTime(item.createdAt)}</td>
      <td>-</td>
    </tr>
  );
}

function ReportRow({ item }: { item: AdminMemberReportHistory }) {
  return (
    <tr>
      <td>{item.targetType}</td>
      <td>{item.reason}</td>
      <td>{item.status}</td>
      <td>{formatDateTime(item.createdAt)}</td>
      <td>-</td>
    </tr>
  );
}

function PointRow({ item }: { item: AdminMemberPointHistory }) {
  return (
    <tr>
      <td>{item.pointType}</td>
      <td>{item.description}</td>
      <td className={item.pointAmount < 0 ? styles.minusPoint : styles.plusPoint}>{formatPoint(item.pointAmount)}</td>
      <td>{formatDateTime(item.createdAt)}</td>
      <td>-</td>
    </tr>
  );
}

function SanctionRow({ item }: { item: AdminMemberSanctionHistory }) {
  return (
    <tr>
      <td>{getOptionLabel(sanctionTypeOptions, item.sanctionType)}</td>
      <td>{item.reason ?? '-'}</td>
      <td>{item.status ?? '-'}</td>
      <td>
        {formatDate(item.startedAt)} ~ {formatDate(item.endedAt)}
      </td>
      <td>-</td>
    </tr>
  );
}
