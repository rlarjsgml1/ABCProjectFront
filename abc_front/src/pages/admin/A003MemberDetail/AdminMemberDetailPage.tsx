// 회원 상세(A003) 화면 — 회원 상세 정보와 이용 이력을 조회하고 상태 변경/포인트 지급·차감을 담당한다
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  adjustAdminMemberPoint,
  changeAdminMemberStatus,
  getAdminMember,
  getAdminMemberPayments,
  getAdminMemberPoints,
  getAdminMemberRentals,
  getAdminMemberReports,
  getAdminMemberSanctions,
} from '../../../api/adminMemberApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { GradeBadgeIcon } from '../../../components/mypage/GradeBadgeIcon';
import type {
  AdminMemberDetail,
  AdminMemberPaymentHistory,
  AdminMemberPointHistory,
  AdminMemberReportHistory,
  AdminMemberRentalHistory,
  AdminMemberSanctionHistory,
  AdminMemberStatus,
  AdminMemberStatusChangeRequest,
  AdminSanctionType,
} from '../../../types/api';
import styles from '../../../styles/AdminMemberDetailPage.module.css';

// 'reviews'는 백엔드 탭(RENTALS/PAYMENTS/REPORTS/POINTS/SANCTIONS)에 대응 항목이 없다 — 리뷰 신고는
// REPORTS 탭(reportSourceType=REVIEW_REPORT)으로 이미 포함되고, 별도 리뷰 이력 API는 없다.
type HistoryTab = 'rentals' | 'payments' | 'reports' | 'points' | 'sanctions';

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

// 백엔드는 sanctionType=RENTAL_BAN/REVIEW_BAN일 때 status가 JOINED로 유지되어야 한다고 요구한다.
// 이 화면은 status=SANCTIONED 선택 시에만 제재 유형을 입력하는 흐름이라, 새 UI 흐름 없이는 그 두
// 유형을 지원할 수 없어 범위에서 제외한다(A002 목록 화면과 동일한 판단).
const sanctionTypeOptions: Array<{ value: AdminSanctionType; label: string }> = [
  { value: 'ACCOUNT_SUSPENSION', label: '계정 정지' },
];

const tabs: Array<{ value: HistoryTab; label: string }> = [
  { value: 'rentals', label: '대여 내역' },
  { value: 'payments', label: '결제 내역' },
  { value: 'reports', label: '책/리뷰 신고 내역' },
  { value: 'points', label: '포인트 이력' },
  { value: 'sanctions', label: '제재 이력' },
];

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
  const sanction = member.usageSummary.activeSanctions[0];
  if (!sanction) return '없음';

  const type = getOptionLabel(sanctionTypeOptions, sanction.sanctionType);
  const endedAt = sanction.endedAt ? `${formatDate(sanction.endedAt)} 종료` : '';

  return [type, endedAt].filter(Boolean).join(' · ');
}

export function AdminMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const numericMemberId = Number(memberId);
  const [member, setMember] = useState<AdminMemberDetail | null>(null);
  const [sanctionCount, setSanctionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [activeTab, setActiveTab] = useState<HistoryTab>('rentals');
  const [rentalHistories, setRentalHistories] = useState<AdminMemberRentalHistory[]>([]);
  const [paymentHistories, setPaymentHistories] = useState<AdminMemberPaymentHistory[]>([]);
  const [reportHistories, setReportHistories] = useState<AdminMemberReportHistory[]>([]);
  const [pointHistories, setPointHistories] = useState<AdminMemberPointHistory[]>([]);
  const [sanctionHistories, setSanctionHistories] = useState<AdminMemberSanctionHistory[]>([]);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [tabErrorMessage, setTabErrorMessage] = useState('');
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
      setMember(null);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMember();
  }, [numericMemberId]);

  // usageSummary.activeSanctions는 "현재 유효한" 제재만 담고 있어 전체 제재 이력 건수와 다르다 —
  // 정확한 총 건수는 제재 탭 조회의 totalElements로만 확인할 수 있어 별도로 가져온다.
  useEffect(() => {
    if (!Number.isFinite(numericMemberId)) return;

    let ignore = false;

    getAdminMemberSanctions(numericMemberId, 0, 1)
      .then((result) => {
        if (!ignore) setSanctionCount(result.tab.totalElements);
      })
      .catch(() => {
        if (!ignore) setSanctionCount(0);
      });

    return () => {
      ignore = true;
    };
  }, [numericMemberId, refreshToken]);

  useEffect(() => {
    if (!Number.isFinite(numericMemberId)) return;

    let ignore = false;

    async function loadTab() {
      setIsTabLoading(true);
      setTabErrorMessage('');

      try {
        if (activeTab === 'rentals') {
          const result = await getAdminMemberRentals(numericMemberId);
          if (!ignore) setRentalHistories(result.tab.content);
        } else if (activeTab === 'payments') {
          const result = await getAdminMemberPayments(numericMemberId);
          if (!ignore) setPaymentHistories(result.tab.content);
        } else if (activeTab === 'reports') {
          const result = await getAdminMemberReports(numericMemberId);
          if (!ignore) setReportHistories(result.tab.content);
        } else if (activeTab === 'points') {
          const result = await getAdminMemberPoints(numericMemberId);
          if (!ignore) setPointHistories(result.tab.content);
        } else {
          const result = await getAdminMemberSanctions(numericMemberId);
          if (!ignore) setSanctionHistories(result.tab.content);
        }
      } catch (error) {
        if (!ignore) setTabErrorMessage(getApiErrorMessage(error));
      } finally {
        if (!ignore) setIsTabLoading(false);
      }
    }

    void loadTab();

    return () => {
      ignore = true;
    };
  }, [activeTab, numericMemberId, refreshToken]);

  function openStatusModal() {
    if (!member) return;

    setStatusForm({
      status: member.profile.status,
      reason: '',
      sanctionType: member.usageSummary.activeSanctions[0]?.sanctionType as AdminSanctionType | undefined,
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
      setRefreshToken((token) => token + 1);
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

    if (pointAmount < 0 && member.usageSummary.pointBalance + pointAmount < 0) {
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
        requestId: crypto.randomUUID(),
      });
      setStatusMessage('회원 포인트가 조정되었습니다.');
      setIsPointModalOpen(false);
      await loadMember();
      setRefreshToken((token) => token + 1);
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
            ['아이디', member.profile.loginId],
            ['이름', member.profile.name],
            ['이메일', member.profile.email],
            ['전화번호', member.profile.phone ?? '-'],
            ['생년월일', formatDate(member.profile.birthDate)],
            ['성별', member.profile.gender ?? '-'],
          ]}
        />
        <InfoCard
          title="계정 정보"
          badge={getOptionLabel(statusOptions, member.profile.status)}
          badgeTone={member.profile.status}
          rows={[
            ['역할', roleLabels[member.profile.role] ?? member.profile.role],
            ['상태', getOptionLabel(statusOptions, member.profile.status)],
            [
              '등급',
              member.profile.gradeName ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <GradeBadgeIcon gradeName={member.profile.gradeName} size={14} />
                  {member.profile.gradeName}
                </span>
              ) : (
                '-'
              ),
            ],
            ['포인트', formatPoint(member.usageSummary.pointBalance)],
            ['제재 이력 요약', `${sanctionCount}건`],
            ['현재 유효 제재', getSanctionText(member)],
          ]}
        />
        <InfoCard
          title="이용 요약"
          rows={[
            ['대여', `${member.usageSummary.rentalCount.toLocaleString('ko-KR')}건`],
            ['결제', `${member.usageSummary.paymentCount.toLocaleString('ko-KR')}건`],
            ['책/리뷰 신고', `${member.usageSummary.reportCount.toLocaleString('ko-KR')}건`],
            ['리뷰', '-'],
            ['독서 통계', '-'],
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

        {tabErrorMessage ? <p className={styles.notice}>{tabErrorMessage}</p> : null}

        <HistoryTable
          activeTab={activeTab}
          memberId={member.memberId}
          isLoading={isTabLoading}
          rentalHistories={rentalHistories}
          paymentHistories={paymentHistories}
          reportHistories={reportHistories}
          pointHistories={pointHistories}
          sanctionHistories={sanctionHistories}
        />
      </div>

      {isStatusModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeModals}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-status-modal-title" onSubmit={handleStatusSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="member-status-modal-title">회원 상태 변경</h2>
                <p>
                  {member.profile.loginId} / {member.profile.name}
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
                <p>현재 잔액 {formatPoint(member.usageSummary.pointBalance)}</p>
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

function HistoryTable({
  activeTab,
  memberId,
  isLoading,
  rentalHistories,
  paymentHistories,
  reportHistories,
  pointHistories,
  sanctionHistories,
}: {
  activeTab: HistoryTab;
  memberId: number;
  isLoading: boolean;
  rentalHistories: AdminMemberRentalHistory[];
  paymentHistories: AdminMemberPaymentHistory[];
  reportHistories: AdminMemberReportHistory[];
  pointHistories: AdminMemberPointHistory[];
  sanctionHistories: AdminMemberSanctionHistory[];
}) {
  if (activeTab === 'rentals') {
    return (
      <Table
        rows={rentalHistories}
        isLoading={isLoading}
        emptyMessage="대여 내역이 없습니다."
        columns={['도서', '상태', '대여 기간', '등록일', '관리']}
        renderRow={(item) => <RentalRow item={item} memberId={memberId} />}
      />
    );
  }

  if (activeTab === 'payments') {
    return (
      <Table
        rows={paymentHistories}
        isLoading={isLoading}
        emptyMessage="결제 내역이 없습니다."
        columns={['도서', '금액', '결제수단/상태', '결제일', '관리']}
        renderRow={(item) => <PaymentRow item={item} memberId={memberId} />}
      />
    );
  }

  if (activeTab === 'reports') {
    return (
      <Table
        rows={reportHistories}
        isLoading={isLoading}
        emptyMessage="신고 내역이 없습니다."
        columns={['구분', '신고 유형', '상태', '일자', '관리']}
        renderRow={(item) => <ReportRow item={item} />}
      />
    );
  }

  if (activeTab === 'points') {
    return (
      <Table
        rows={pointHistories}
        isLoading={isLoading}
        emptyMessage="포인트 이력이 없습니다."
        columns={['이력 구분', '내용', '포인트', '일자', '관리']}
        renderRow={(item) => <PointRow item={item} />}
      />
    );
  }

  return (
    <Table
      rows={sanctionHistories}
      isLoading={isLoading}
      emptyMessage="제재 이력이 없습니다."
      columns={['제재 유형', '사유', '기간', '등록일', '관리']}
      renderRow={(item) => <SanctionRow item={item} />}
    />
  );
}

function Table<T>({
  rows,
  columns,
  emptyMessage,
  renderRow,
  isLoading,
}: {
  rows: T[];
  columns: string[];
  emptyMessage: string;
  renderRow: (item: T) => JSX.Element;
  isLoading: boolean;
}) {
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
          {isLoading ? (
            <tr>
              <td colSpan={columns.length}>불러오는 중입니다.</td>
            </tr>
          ) : rows.length > 0 ? (
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
      <td>{item.rentalStatus}</td>
      <td>
        {formatDate(item.rentalStartAt)} ~ {formatDate(item.rentalEndAt)}
      </td>
      <td>{formatDateTime(item.createdAt)}</td>
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
      <td>{formatMoney(item.amount)}</td>
      <td>
        {item.paymentMethod} · {item.paymentStatus}
      </td>
      <td>{formatDateTime(item.paidAt)}</td>
      <td>
        <Link className={styles.tableAction} to={`/admin/payments?memberId=${memberId}`}>
          결제 전체보기
        </Link>
      </td>
    </tr>
  );
}

function ReportRow({ item }: { item: AdminMemberReportHistory }) {
  return (
    <tr>
      <td>{item.reportSourceType === 'REVIEW_REPORT' ? '리뷰 신고' : '도서 신고'}</td>
      <td>{item.reportType}</td>
      <td>{item.status}</td>
      <td>{formatDateTime(item.processedAt ?? item.createdAt)}</td>
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
      <td>
        {formatDate(item.startedAt)} ~ {formatDate(item.endedAt)}
      </td>
      <td>{formatDateTime(item.createdAt)}</td>
      <td>-</td>
    </tr>
  );
}
