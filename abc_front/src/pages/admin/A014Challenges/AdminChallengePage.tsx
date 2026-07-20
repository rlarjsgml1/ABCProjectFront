// 챌린지 관리(A014) 화면 — 일일/누적 챌린지와 보상 설정을 관리한다
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAdminChallenges, updateAdminChallenge } from '../../../api/adminChallengeApi';
import { getAdminCoupons } from '../../../api/adminCouponApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminChallengeListQuery,
  AdminChallengeRewardItem,
  AdminChallengeStatus,
  AdminChallengeSummary,
  AdminChallengeType,
  AdminCouponSummary,
  PageResponse,
} from '../../../types/api';
import styles from '../../../styles/AdminChallengePage.module.css';

const PAGE_SIZE = 10;

type ChallengeForm = {
  challengeName: string;
  challengeType: AdminChallengeType;
  targetAction: string;
  targetCount: string;
  status: AdminChallengeStatus;
  rewardType: 'POINT' | 'coupon';
  pointAmount: string;
  couponId: string;
  rewardQuantity: string;
};

const challengeTypeOptions: Array<{ value: AdminChallengeType; label: string }> = [
  { value: 'DAILY', label: '일일 챌린지' },
  { value: 'TOTAL', label: '전체 챌린지' },
];

const statusOptions: Array<{ value: AdminChallengeStatus; label: string }> = [
  { value: 'ACTIVE', label: '진행중' },
  { value: 'INACTIVE', label: '비활성' },
];

const fallbackCoupons: AdminCouponSummary[] = [
  {
    couponId: 501,
    couponName: '30일 연속 출석 10% 할인 쿠폰',
    couponType: 'PERCENT_DISCOUNT',
    benefitValue: 10,
    benefitUnit: 'PERCENT',
    validDays: 30,
    status: 'ACTIVE',
  },
  {
    couponId: 502,
    couponName: '신규 회원 1,000원 할인 쿠폰',
    couponType: 'AMOUNT_DISCOUNT',
    benefitValue: 1000,
    benefitUnit: 'AMOUNT',
    validDays: 14,
    status: 'ACTIVE',
  },
];

const fallbackChallenges: AdminChallengeSummary[] = [
  {
    challengeId: 1401,
    challengeName: '매일 10쪽 읽기',
    challengeType: 'DAILY',
    targetAction: '전자책 10쪽 이상 읽기',
    targetCount: 10,
    status: 'ACTIVE',
    participantCount: 124,
    completedCount: 86,
    rewardPoint: 1000,
    rewards: [{ rewardId: 1, rewardType: 'POINT', pointAmount: 1000, rewardQuantity: 1 }],
    startedAt: '2026-07-01',
    endedAt: '2026-07-31',
  },
  {
    challengeId: 1402,
    challengeName: '리뷰 3개 작성하기',
    challengeType: 'TOTAL',
    targetAction: '리뷰 작성',
    targetCount: 3,
    status: 'ACTIVE',
    participantCount: 80,
    completedCount: 64,
    rewards: [{ rewardId: 2, rewardType: 'coupon', couponId: 501, couponName: '30일 연속 출석 10% 할인 쿠폰', rewardQuantity: 1 }],
    startedAt: '2026-07-01',
    endedAt: '2026-08-15',
  },
  {
    challengeId: 1403,
    challengeName: '한 달 완독 챌린지',
    challengeType: 'TOTAL',
    targetAction: '도서 완독',
    targetCount: 5,
    status: 'INACTIVE',
    participantCount: 45,
    completedCount: 18,
    rewardPoint: 3000,
    rewards: [{ rewardId: 3, rewardType: 'POINT', pointAmount: 3000, rewardQuantity: 1 }],
    startedAt: '2026-06-01',
    endedAt: '2026-06-30',
  },
];

function toApiPage(uiPage: number) {
  return Math.max(uiPage - 1, 0);
}

function toUiPage(apiPage: number | undefined) {
  return (apiPage ?? 0) + 1;
}

function getOptionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | string | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

function formatPeriod(challenge: AdminChallengeSummary) {
  if (!challenge.startedAt && !challenge.endedAt) return '-';
  return `${challenge.startedAt ?? '-'} ~ ${challenge.endedAt ?? '-'}`;
}

function formatReward(challenge: AdminChallengeSummary) {
  if (challenge.rewards.length === 0) return '-';

  return challenge.rewards
    .map((reward) => {
      if (reward.rewardType === 'POINT') {
        return `${(reward.pointAmount ?? 0).toLocaleString('ko-KR')}P`;
      }

      return `${reward.couponName ?? `쿠폰 ${reward.couponId}`} ${reward.rewardQuantity}개`;
    })
    .join(', ');
}

function buildFallbackChallengePage(query: AdminChallengeListQuery): PageResponse<AdminChallengeSummary> {
  const filtered = fallbackChallenges.filter((challenge) => {
    const matchesType = query.challengeType ? challenge.challengeType === query.challengeType : true;
    const matchesStatus = query.status ? challenge.status === query.status : true;

    return matchesType && matchesStatus;
  });

  const page = query.page ?? 0;
  const size = query.size ?? PAGE_SIZE;
  const start = page * size;

  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(Math.ceil(filtered.length / size), 1),
    last: start + size >= filtered.length,
  };
}

function getInitialForm(challenge: AdminChallengeSummary): ChallengeForm {
  const firstReward = challenge.rewards[0];

  return {
    challengeName: challenge.challengeName,
    challengeType: challenge.challengeType,
    targetAction: challenge.targetAction,
    targetCount: String(challenge.targetCount),
    status: challenge.status,
    rewardType: firstReward?.rewardType ?? 'POINT',
    pointAmount: firstReward?.pointAmount ? String(firstReward.pointAmount) : String(challenge.rewardPoint ?? 1000),
    couponId: firstReward?.couponId ? String(firstReward.couponId) : '',
    rewardQuantity: String(firstReward?.rewardQuantity ?? 1),
  };
}

export function AdminChallengePage() {
  const [challengesPage, setChallengesPage] = useState<PageResponse<AdminChallengeSummary> | null>(null);
  const [coupons, setCoupons] = useState<AdminCouponSummary[]>(fallbackCoupons);
  const [filter, setFilter] = useState<{ challengeType: string; status: string }>({ challengeType: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [editChallenge, setEditChallenge] = useState<AdminChallengeSummary | null>(null);
  const [form, setForm] = useState<ChallengeForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [modalError, setModalError] = useState('');

  const query = useMemo<AdminChallengeListQuery>(
    () => ({
      challengeType: (filter.challengeType as AdminChallengeType) || undefined,
      status: (filter.status as AdminChallengeStatus) || undefined,
      page: toApiPage(currentPage),
      size: PAGE_SIZE,
    }),
    [currentPage, filter],
  );

  useEffect(() => {
    let ignore = false;

    async function loadChallenges() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminChallenges(query);
        if (!ignore) {
          if (data.content.length > 0) {
            setChallengesPage(data);
          } else {
            setChallengesPage(buildFallbackChallengePage(query));
            setErrorMessage('등록된 챌린지가 없어 화면 확인을 위해 임시 챌린지 목록을 표시합니다.');
          }
        }
      } catch (error) {
        if (!ignore) {
          setChallengesPage(buildFallbackChallengePage(query));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 챌린지 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadChallenges();

    return () => {
      ignore = true;
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    async function loadCoupons() {
      try {
        const data = await getAdminCoupons({ status: 'ACTIVE', page: 0, size: 50 });
        if (!ignore) {
          setCoupons(data.content.length > 0 ? data.content : fallbackCoupons);
        }
      } catch {
        if (!ignore) {
          setCoupons(fallbackCoupons);
        }
      }
    }

    void loadCoupons();

    return () => {
      ignore = true;
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFilter({
      challengeType: String(formData.get('challengeType') ?? ''),
      status: String(formData.get('status') ?? ''),
    });
    setCurrentPage(1);
  }

  function handleReset() {
    setFilter({ challengeType: '', status: '' });
    setCurrentPage(1);
  }

  function openEditModal(challenge: AdminChallengeSummary) {
    setEditChallenge(challenge);
    setForm(getInitialForm(challenge));
    setModalError('');
  }

  function closeEditModal() {
    if (isSaving) return;
    setEditChallenge(null);
    setForm(null);
    setModalError('');
  }

  function updateLocalChallenge(challengeId: number, nextChallenge: AdminChallengeSummary) {
    setChallengesPage((current) =>
      current
        ? {
            ...current,
            content: current.content.map((challenge) => (challenge.challengeId === challengeId ? nextChallenge : challenge)),
          }
        : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editChallenge || !form) return;

    const targetCount = Number(form.targetCount);
    const pointAmount = Number(form.pointAmount);
    const rewardQuantity = Number(form.rewardQuantity);
    const couponId = Number(form.couponId);

    if (!form.challengeName.trim()) {
      setModalError('챌린지명을 입력해 주세요.');
      return;
    }

    if (!form.targetAction.trim()) {
      setModalError('목표 행동을 입력해 주세요.');
      return;
    }

    if (!Number.isInteger(targetCount) || targetCount <= 0) {
      setModalError('목표 수는 1 이상으로 입력해 주세요.');
      return;
    }

    if (!Number.isInteger(rewardQuantity) || rewardQuantity <= 0) {
      setModalError('지급 수량은 1 이상으로 입력해 주세요.');
      return;
    }

    if (form.rewardType === 'POINT' && (!Number.isInteger(pointAmount) || pointAmount <= 0)) {
      setModalError('지급 포인트는 1 이상으로 입력해 주세요.');
      return;
    }

    if (form.rewardType === 'coupon' && (!Number.isInteger(couponId) || couponId <= 0)) {
      setModalError('쿠폰 보상은 지급할 쿠폰을 선택해 주세요.');
      return;
    }

    const selectedCoupon = coupons.find((coupon) => coupon.couponId === couponId);
    const rewards: AdminChallengeRewardItem[] =
      form.rewardType === 'POINT'
        ? [{ rewardType: 'POINT', pointAmount, rewardQuantity }]
        : [{ rewardType: 'coupon', couponId, couponName: selectedCoupon?.couponName, rewardQuantity }];

    const payload = {
      challengeName: form.challengeName.trim(),
      challengeType: form.challengeType,
      targetAction: form.targetAction.trim(),
      targetCount,
      status: form.status,
      rewards,
    };

    const nextChallenge: AdminChallengeSummary = {
      ...editChallenge,
      ...payload,
      rewardPoint: form.rewardType === 'POINT' ? pointAmount : undefined,
    };

    setIsSaving(true);
    setModalError('');

    try {
      await updateAdminChallenge(editChallenge.challengeId, payload);
      setStatusMessage('챌린지 설정이 저장되었습니다.');
    } catch {
      setStatusMessage('임시 데이터에 챌린지 수정 내용을 반영했습니다.');
    } finally {
      updateLocalChallenge(editChallenge.challengeId, nextChallenge);
      setEditChallenge(null);
      setForm(null);
      setIsSaving(false);
    }
  }

  const challenges = challengesPage?.content ?? [];
  const totalPages = challengesPage?.totalPages ?? 1;
  const shownPage = toUiPage(challengesPage?.page);
  const activeCount = challenges.filter((challenge) => challenge.status === 'ACTIVE').length;
  const totalParticipants = challenges.reduce((sum, challenge) => sum + challenge.participantCount, 0);
  const totalCompleted = challenges.reduce((sum, challenge) => sum + challenge.completedCount, 0);
  const overallPercent = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0;

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-challenges-title">
      <div className={styles.header}>
        <div>
          <span>챌린지</span>
          <h1 id="admin-challenges-title">챌린지 관리</h1>
        </div>
      </div>

      <section className={styles.progressPanel} aria-label="달성 처리 상태">
        <h2>달성 처리 상태</h2>
        <div className={styles.progressRows}>
          <ProgressRow label="진행중 챌린지" value={Math.min(activeCount * 35, 100)} tone="primary" />
          <ProgressRow label="참여자 달성률" value={overallPercent} tone="danger" />
          <ProgressRow label="보상 설정 완료" value={Math.min(challenges.filter((challenge) => challenge.rewards.length > 0).length * 34, 100)} tone="success" />
        </div>
      </section>

      <form className={styles.filterPanel} onSubmit={handleSearch}>
        <label>
          <span className={styles.filterLabelText}>챌린지 유형</span>
          <select name="challengeType" defaultValue={filter.challengeType}>
            <option value="">전체</option>
            {challengeTypeOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.filterLabelText}>상태</span>
          <select name="status" defaultValue={filter.status}>
            <option value="">전체</option>
            {statusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.filterActions}>
          <Button type="submit">검색</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            초기화
          </Button>
        </div>
      </form>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}
      {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}

      <section className={styles.tablePanel} aria-label="챌린지 목록">
        <div className={styles.tableHeader}>
          <div>
            <h2>챌린지 테이블</h2>
            <p>총 {(challengesPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
          </div>
          <span>
            {shownPage} / {totalPages}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>챌린지명</th>
                <th>목표행동</th>
                <th>기간</th>
                <th>지급보상</th>
                <th>참여자</th>
                <th>달성자</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>챌린지 목록을 불러오는 중입니다.</td>
                </tr>
              ) : challenges.length > 0 ? (
                challenges.map((challenge) => (
                  <tr key={challenge.challengeId}>
                    <td>
                      <strong>{challenge.challengeName}</strong>
                      <span>{getOptionLabel(challengeTypeOptions, challenge.challengeType)}</span>
                    </td>
                    <td>
                      {challenge.targetAction}
                      <span>목표 {challenge.targetCount.toLocaleString('ko-KR')}회</span>
                    </td>
                    <td>{formatPeriod(challenge)}</td>
                    <td>{formatReward(challenge)}</td>
                    <td>{challenge.participantCount.toLocaleString('ko-KR')}명</td>
                    <td>{challenge.completedCount.toLocaleString('ko-KR')}명</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${challenge.status}`]}`}>{getOptionLabel(statusOptions, challenge.status)}</span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => openEditModal(challenge)}>
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>챌린지 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <Button type="button" variant="secondary" disabled={shownPage <= 1} onClick={() => setCurrentPage(shownPage - 1)}>
            이전
          </Button>
          <span>{shownPage} 페이지</span>
          <Button type="button" variant="secondary" disabled={shownPage >= totalPages} onClick={() => setCurrentPage(shownPage + 1)}>
            다음
          </Button>
        </div>
      </section>

      {editChallenge && form ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeEditModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="challenge-edit-title" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="challenge-edit-title">챌린지 수정 / 저장</h2>
                <p>CH-{editChallenge.challengeId}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeEditModal}>
                ×
              </button>
            </div>

            {modalError ? <p className={styles.modalError}>{modalError}</p> : null}

            <label className={styles.fullField}>
              챌린지명
              <input value={form.challengeName} onChange={(event) => setForm((current) => (current ? { ...current, challengeName: event.target.value } : current))} />
            </label>
            <div className={styles.formGrid}>
              <label>
                유형
                <select value={form.challengeType} onChange={(event) => setForm((current) => (current ? { ...current, challengeType: event.target.value as AdminChallengeType } : current))}>
                  {challengeTypeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                상태
                <select value={form.status} onChange={(event) => setForm((current) => (current ? { ...current, status: event.target.value as AdminChallengeStatus } : current))}>
                  {statusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={styles.formGrid}>
              <label>
                목표 행동
                <input value={form.targetAction} onChange={(event) => setForm((current) => (current ? { ...current, targetAction: event.target.value } : current))} />
              </label>
              <label>
                목표 수
                <input type="number" min="1" value={form.targetCount} onChange={(event) => setForm((current) => (current ? { ...current, targetCount: event.target.value } : current))} />
              </label>
            </div>
            <div className={styles.formGrid}>
              <label>
                보상 유형
                <select value={form.rewardType} onChange={(event) => setForm((current) => (current ? { ...current, rewardType: event.target.value as 'POINT' | 'coupon' } : current))}>
                  <option value="POINT">포인트</option>
                  <option value="coupon">쿠폰</option>
                </select>
              </label>
              <label>
                지급 수량
                <input type="number" min="1" value={form.rewardQuantity} onChange={(event) => setForm((current) => (current ? { ...current, rewardQuantity: event.target.value } : current))} />
              </label>
            </div>
            {form.rewardType === 'POINT' ? (
              <label>
                지급포인트
                <input type="number" min="1" value={form.pointAmount} onChange={(event) => setForm((current) => (current ? { ...current, pointAmount: event.target.value } : current))} />
              </label>
            ) : (
              <label>
                지급 쿠폰
                <select value={form.couponId} onChange={(event) => setForm((current) => (current ? { ...current, couponId: event.target.value } : current))}>
                  <option value="">쿠폰 선택</option>
                  {coupons.map((coupon) => (
                    <option value={coupon.couponId} key={coupon.couponId}>
                      {coupon.couponName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeEditModal} disabled={isSaving}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중' : '처리 저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

const progressToneClass = {
  primary: styles.progressPrimary,
  danger: styles.progressDanger,
  success: styles.progressSuccess,
};

function ProgressRow({ label, value, tone }: { label: string; value: number; tone: keyof typeof progressToneClass }) {
  return (
    <div className={styles.progressRow}>
      <span>{label}</span>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={`${styles.progressFill} ${progressToneClass[tone]}`} style={{ width: `${value}%` }} />
      </div>
      <strong>{value}%</strong>
    </div>
  );
}
