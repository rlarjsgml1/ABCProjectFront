// 쿠폰/포인트 관리(A013) 화면 — 쿠폰 정의 등록/발급과 회원 포인트 지급·차감을 담당한다
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createAdminCoupon, getAdminCoupons, issueAdminCoupon } from '../../../api/adminCouponApi';
import { adjustAdminMemberPoint, getAdminMember, getAdminMemberPoints, getAdminMembers } from '../../../api/adminMemberApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  AdminCouponBenefitUnit,
  AdminCouponCreateRequest,
  AdminCouponListQuery,
  AdminCouponStatus,
  AdminCouponSummary,
  AdminCouponType,
  AdminMemberListQuery,
  AdminMemberPointHistory,
  AdminMemberSummary,
  PageResponse,
} from '../../../types/api';
import styles from '../../../styles/AdminCouponsPointsPage.module.css';

const PAGE_SIZE = 10;

type TabKey = 'coupons' | 'points';

type CouponForm = {
  couponName: string;
  couponType: AdminCouponType;
  benefitValue: string;
  validDays: string;
  status: AdminCouponStatus;
};

type IssueForm = {
  quantity: string;
};

type PointForm = {
  pointAmount: string;
  description: string;
};

const couponTypeOptions: Array<{ value: AdminCouponType; label: string }> = [
  { value: 'PERCENT_DISCOUNT', label: '비율 할인' },
  { value: 'AMOUNT_DISCOUNT', label: '금액 할인' },
];

const couponStatusOptions: Array<{ value: AdminCouponStatus; label: string }> = [
  { value: 'ACTIVE', label: '활성' },
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
    issuedCount: 48,
    usedCount: 17,
    createdAt: '2026-07-01T09:20:00',
  },
  {
    couponId: 502,
    couponName: '신규 회원 1,000원 할인 쿠폰',
    couponType: 'AMOUNT_DISCOUNT',
    benefitValue: 1000,
    benefitUnit: 'AMOUNT',
    validDays: 14,
    status: 'ACTIVE',
    issuedCount: 126,
    usedCount: 71,
    createdAt: '2026-07-03T11:30:00',
  },
  {
    couponId: 503,
    couponName: '여름 독서 이벤트 20% 할인 쿠폰',
    couponType: 'PERCENT_DISCOUNT',
    benefitValue: 20,
    benefitUnit: 'PERCENT',
    validDays: 21,
    status: 'INACTIVE',
    issuedCount: 12,
    usedCount: 3,
    createdAt: '2026-06-25T14:00:00',
  },
];

// 관리자 회원 목록 API(AdminMemberSummaryResponse)에는 pointBalance가 없다 — 목록 단계에서는 실제로
// 조회하기 전까지 잔액을 알 수 없다는 사실을 타입에도 반영해, 미조회 상태(옵션 필드)와 조회 완료 상태
// (상세 API 또는 포인트 조정 성공 응답으로 확인된 number)를 구분한다(PR #100 코드리뷰 대응).
type MemberListRow = AdminMemberSummary & { pointBalance?: number };
type SelectedMember = AdminMemberSummary & { pointBalance: number };

const fallbackMembers: MemberListRow[] = [
  {
    memberId: 1024,
    loginId: 'park_reader',
    name: '박서연',
    maskedEmail: 'se***@example.com',
    maskedPhone: '010-****-5678',
    role: 'USER',
    gradeName: 'GOLD',
    status: 'JOINED',
    activeSanctions: [],
  },
  {
    memberId: 991,
    loginId: 'read_admin',
    name: '김도윤',
    maskedEmail: 'ad***@example.com',
    maskedPhone: '010-****-0000',
    role: 'ADMIN',
    status: 'JOINED',
    activeSanctions: [],
  },
  {
    memberId: 873,
    loginId: 'review_stop',
    name: '이민준',
    maskedEmail: 'mi***@example.com',
    maskedPhone: '010-****-1234',
    role: 'USER',
    gradeName: 'BASIC',
    status: 'SANCTIONED',
    activeSanctions: [{ sanctionType: 'ACCOUNT_SUSPENSION', endedAt: '2026-07-16T23:59:00' }],
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

function formatDate(value: string | undefined) {
  if (!value) return '-';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(time);
}

function formatCompactDate(value: string | undefined) {
  if (!value) return '-';

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(time);
}

function formatPoint(value: number | undefined) {
  if (value === undefined) return '-';

  return `${value.toLocaleString('ko-KR')}P`;
}

function getBenefitUnit(couponType: AdminCouponType): AdminCouponBenefitUnit {
  return couponType === 'PERCENT_DISCOUNT' ? 'PERCENT' : 'AMOUNT';
}

function formatBenefit(coupon: Pick<AdminCouponSummary, 'benefitValue' | 'benefitUnit'>) {
  return coupon.benefitUnit === 'PERCENT' ? `${coupon.benefitValue}%` : `${coupon.benefitValue.toLocaleString('ko-KR')}원`;
}

function buildFallbackCouponPage(query: AdminCouponListQuery): PageResponse<AdminCouponSummary> {
  const filtered = fallbackCoupons.filter((coupon) => {
    const matchesStatus = query.status ? coupon.status === query.status : true;
    const matchesType = query.couponType ? coupon.couponType === query.couponType : true;

    return matchesStatus && matchesType;
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

function buildFallbackMemberPage(query: AdminMemberListQuery): PageResponse<MemberListRow> {
  const keyword = query.q?.trim().toLowerCase();
  const filtered = fallbackMembers.filter((member) =>
    keyword ? [member.loginId, member.name, member.maskedEmail].join(' ').toLowerCase().includes(keyword) : true,
  );

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

export function AdminCouponsPointsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('coupons');
  const [couponsPage, setCouponsPage] = useState<PageResponse<AdminCouponSummary> | null>(null);
  const [membersPage, setMembersPage] = useState<PageResponse<MemberListRow> | null>(null);
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [pointHistories, setPointHistories] = useState<AdminMemberPointHistory[]>([]);
  const [pointHistoryError, setPointHistoryError] = useState('');
  const [isPointHistoryLoading, setIsPointHistoryLoading] = useState(false);
  const selectionRequestSequenceRef = useRef(0);
  const pointHistoryRequestSequenceRef = useRef(0);
  const [issueCoupon, setIssueCoupon] = useState<AdminCouponSummary | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm>({
    couponName: '',
    couponType: 'PERCENT_DISCOUNT',
    benefitValue: '',
    validDays: '14',
    status: 'ACTIVE',
  });
  const [issueForm, setIssueForm] = useState<IssueForm>({ quantity: '1' });
  const [issueMemberQuery, setIssueMemberQuery] = useState('');
  const [issueMemberResults, setIssueMemberResults] = useState<MemberListRow[]>([]);
  const [selectedIssueMembers, setSelectedIssueMembers] = useState<MemberListRow[]>([]);
  const [pointForm, setPointForm] = useState<PointForm>({ pointAmount: '', description: '' });
  const [isCouponLoading, setIsCouponLoading] = useState(true);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');

  const couponPage = Number(searchParams.get('couponPage') ?? '1') || 1;
  const memberPage = Number(searchParams.get('memberPage') ?? '1') || 1;

  const couponQuery = useMemo<AdminCouponListQuery>(
    () => ({
      status: (searchParams.get('status') as AdminCouponStatus | null) || undefined,
      couponType: (searchParams.get('couponType') as AdminCouponType | null) || undefined,
      page: toApiPage(couponPage),
      size: PAGE_SIZE,
    }),
    [couponPage, searchParams],
  );

  const memberQuery = useMemo<AdminMemberListQuery>(
    () => ({
      q: searchParams.get('memberQ') || undefined,
      page: toApiPage(memberPage),
      size: PAGE_SIZE,
    }),
    [memberPage, searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadCoupons() {
      setIsCouponLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminCoupons(couponQuery);
        if (!ignore) {
          setCouponsPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setCouponsPage(buildFallbackCouponPage(couponQuery));
          setErrorMessage(`${getApiErrorMessage(error)} 화면 확인을 위해 임시 쿠폰 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsCouponLoading(false);
        }
      }
    }

    void loadCoupons();

    return () => {
      ignore = true;
    };
  }, [couponQuery]);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsMemberLoading(true);

      try {
        const data = await getAdminMembers(memberQuery);
        if (!ignore) {
          setMembersPage(data);
        }
      } catch (error) {
        if (!ignore) {
          setMembersPage(buildFallbackMemberPage(memberQuery));
          setErrorMessage((current) => current || `${getApiErrorMessage(error)} 화면 확인을 위해 임시 회원 목록을 표시합니다.`);
        }
      } finally {
        if (!ignore) {
          setIsMemberLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      ignore = true;
    };
  }, [memberQuery]);

  function updateQuery(nextValues: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams);
  }

  function handleCouponSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    updateQuery({
      status: String(formData.get('status') ?? ''),
      couponType: String(formData.get('couponType') ?? ''),
      couponPage: '1',
    });
  }

  function handleMemberSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    updateQuery({
      memberQ: String(formData.get('memberQ') ?? '').trim(),
      memberPage: '1',
    });
  }

  function handleCouponReset() {
    updateQuery({ status: '', couponType: '', couponPage: '' });
  }

  function handleMemberReset() {
    updateQuery({ memberQ: '', memberPage: '' });
  }

  async function handleCouponCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const benefitValue = Number(couponForm.benefitValue);
    const validDays = Number(couponForm.validDays);
    const benefitUnit = getBenefitUnit(couponForm.couponType);

    if (!couponForm.couponName.trim()) {
      setFormError('쿠폰명을 입력해 주세요.');
      return;
    }

    if (!Number.isInteger(benefitValue) || benefitValue <= 0) {
      setFormError('혜택 값은 0보다 큰 정수로 입력해 주세요.');
      return;
    }

    if (benefitUnit === 'PERCENT' && benefitValue > 100) {
      setFormError('비율 할인은 1~100 범위로 입력해 주세요.');
      return;
    }

    if (!Number.isInteger(validDays) || validDays <= 0) {
      setFormError('유효일은 1일 이상으로 입력해 주세요.');
      return;
    }

    const payload: AdminCouponCreateRequest = {
      couponName: couponForm.couponName.trim(),
      couponType: couponForm.couponType,
      benefitValue,
      benefitUnit,
      validDays,
      status: couponForm.status,
    };

    setIsSaving(true);
    setFormError('');

    try {
      const data = await createAdminCoupon(payload);
      setStatusMessage('쿠폰이 등록되었습니다.');
      setCouponsPage((current) =>
        current
          ? {
              ...current,
              content: [
                {
                  couponId: data.couponId,
                  ...payload,
                  issuedCount: 0,
                  usedCount: 0,
                  createdAt: new Date().toISOString(),
                },
                ...current.content,
              ],
              totalElements: current.totalElements + 1,
            }
          : current,
      );
    } catch {
      setCouponsPage((current) =>
        current
          ? {
              ...current,
              content: [
                {
                  couponId: Date.now(),
                  ...payload,
                  issuedCount: 0,
                  usedCount: 0,
                  createdAt: new Date().toISOString(),
                },
                ...current.content,
              ],
              totalElements: current.totalElements + 1,
            }
          : current,
      );
      setStatusMessage('임시 데이터에 쿠폰 등록을 반영했습니다.');
    } finally {
      setCouponForm({ couponName: '', couponType: 'PERCENT_DISCOUNT', benefitValue: '', validDays: '14', status: 'ACTIVE' });
      setIsSaving(false);
    }
  }

  async function searchIssueMembers() {
    try {
      const data = await getAdminMembers({ q: issueMemberQuery.trim(), page: 0, size: 10 });
      setIssueMemberResults(data.content);
    } catch {
      setIssueMemberResults(buildFallbackMemberPage({ q: issueMemberQuery.trim(), page: 0, size: 10 }).content);
    }
  }

  function toggleIssueMember(member: MemberListRow) {
    setSelectedIssueMembers((current) =>
      current.some((item) => item.memberId === member.memberId) ? current.filter((item) => item.memberId !== member.memberId) : [...current, member],
    );
  }

  async function handleCouponIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!issueCoupon) return;

    const memberIds = selectedIssueMembers.map((member) => member.memberId);
    const quantity = Number(issueForm.quantity);

    if (memberIds.length === 0) {
      setFormError('발급할 회원을 검색해서 1명 이상 선택해 주세요.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFormError('발급 수량은 1 이상으로 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const data = await issueAdminCoupon(issueCoupon.couponId, { memberIds, quantity });
      updateIssuedCount(issueCoupon.couponId, data.issuedCount);
      setStatusMessage('쿠폰이 회원에게 발급되었습니다.');
    } catch {
      updateIssuedCount(issueCoupon.couponId, memberIds.length * quantity);
      setStatusMessage('임시 데이터에 쿠폰 발급 수량을 반영했습니다.');
    } finally {
      setIssueCoupon(null);
      setIssueForm({ quantity: '1' });
      setIssueMemberQuery('');
      setIssueMemberResults([]);
      setSelectedIssueMembers([]);
      setIsSaving(false);
    }
  }

  function updateIssuedCount(couponId: number, issuedCount: number) {
    setCouponsPage((current) =>
      current
        ? {
            ...current,
            content: current.content.map((coupon) =>
              coupon.couponId === couponId
                ? {
                    ...coupon,
                    issuedCount: (coupon.issuedCount ?? 0) + issuedCount,
                  }
                : coupon,
            ),
          }
        : current,
    );
  }

  async function handleSelectMember(member: MemberListRow) {
    if (isSaving) return;

    const memberId = member.memberId;
    const mySelectionSeq = ++selectionRequestSequenceRef.current;
    const myHistorySeq = ++pointHistoryRequestSequenceRef.current;

    setFormError('');
    setSelectedMember(null);
    setPointHistories([]);
    setPointHistoryError('');
    setIsPointHistoryLoading(true);

    const [detailResult, pointsResult] = await Promise.allSettled([getAdminMember(memberId), getAdminMemberPoints(memberId)]);

    if (selectionRequestSequenceRef.current !== mySelectionSeq) return;

    if (detailResult.status === 'rejected') {
      setFormError(`${getApiErrorMessage(detailResult.reason)} 회원 잔액을 불러오지 못해 포인트를 조정할 수 없습니다.`);
      setIsPointHistoryLoading(false);
      return;
    }

    const resolvedBalance = detailResult.value.usageSummary.pointBalance;

    setSelectedMember({ ...member, pointBalance: resolvedBalance });
    setMembersPage((current) =>
      current
        ? {
            ...current,
            content: current.content.map((row) => (row.memberId === memberId ? { ...row, pointBalance: resolvedBalance } : row)),
          }
        : current,
    );

    if (pointHistoryRequestSequenceRef.current !== myHistorySeq) return;

    if (pointsResult.status === 'fulfilled' && pointsResult.value.memberId === memberId) {
      setPointHistories(pointsResult.value.tab.content);
      setPointHistoryError('');
    } else {
      setPointHistories([]);
      setPointHistoryError('포인트 이력을 불러오지 못했습니다.');
    }

    setIsPointHistoryLoading(false);
  }

  async function handlePointSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMember) {
      setFormError('포인트를 조정할 회원을 선택해 주세요.');
      return;
    }

    const pointAmount = Number(pointForm.pointAmount);

    if (!Number.isInteger(pointAmount) || pointAmount === 0) {
      setFormError('포인트 금액은 0이 아닌 정수로 입력해 주세요.');
      return;
    }

    if (pointAmount < 0 && selectedMember.pointBalance + pointAmount < 0) {
      setFormError('포인트 차감액은 현재 잔액보다 클 수 없습니다.');
      return;
    }

    if (!pointForm.description.trim()) {
      setFormError('포인트 조정 사유를 입력해 주세요.');
      return;
    }

    const memberId = selectedMember.memberId;
    const mySelectionSeq = selectionRequestSequenceRef.current;

    setIsSaving(true);
    setFormError('');
    setStatusMessage('');

    try {
      const response = await adjustAdminMemberPoint(memberId, {
        pointAmount,
        description: pointForm.description.trim(),
        requestId: crypto.randomUUID(),
      });

      if (selectionRequestSequenceRef.current !== mySelectionSeq) return;

      setSelectedMember((current) => (current && current.memberId === memberId ? { ...current, pointBalance: response.pointBalance } : current));
      setMembersPage((current) =>
        current
          ? {
              ...current,
              content: current.content.map((member) => (member.memberId === memberId ? { ...member, pointBalance: response.pointBalance } : member)),
            }
          : current,
      );
      setPointForm({ pointAmount: '', description: '' });
      setStatusMessage('회원 포인트가 조정되었습니다.');

      const myHistorySeq = ++pointHistoryRequestSequenceRef.current;
      setIsPointHistoryLoading(true);

      try {
        const pointsResponse = await getAdminMemberPoints(memberId);

        if (selectionRequestSequenceRef.current !== mySelectionSeq || pointHistoryRequestSequenceRef.current !== myHistorySeq) return;

        if (pointsResponse.memberId === memberId) {
          setPointHistories(pointsResponse.tab.content);
          setPointHistoryError('');
        } else {
          setPointHistories([]);
          setPointHistoryError('포인트 이력을 불러오지 못했습니다.');
        }
      } catch {
        if (selectionRequestSequenceRef.current !== mySelectionSeq || pointHistoryRequestSequenceRef.current !== myHistorySeq) return;

        setPointHistories([]);
        setPointHistoryError('포인트 이력을 불러오지 못했습니다.');
      } finally {
        if (selectionRequestSequenceRef.current === mySelectionSeq && pointHistoryRequestSequenceRef.current === myHistorySeq) {
          setIsPointHistoryLoading(false);
        }
      }
    } catch (error) {
      if (selectionRequestSequenceRef.current === mySelectionSeq) {
        setFormError(getApiErrorMessage(error));
      }
    } finally {
      setIsSaving(false);
    }
  }

  function openIssueModal(coupon: AdminCouponSummary) {
    setIssueCoupon(coupon);
    setIssueForm({ quantity: '1' });
    setIssueMemberQuery('');
    setIssueMemberResults([]);
    setSelectedIssueMembers(selectedMember ? [selectedMember] : []);
    setFormError('');
  }

  function closeIssueModal() {
    if (isSaving) return;
    setIssueCoupon(null);
    setFormError('');
    setIssueMemberQuery('');
    setIssueMemberResults([]);
    setSelectedIssueMembers([]);
  }

  const coupons = couponsPage?.content ?? [];
  const couponShownPage = toUiPage(couponsPage?.page);
  const couponTotalPages = couponsPage?.totalPages ?? 1;
  const members = membersPage?.content ?? [];
  const memberShownPage = toUiPage(membersPage?.page);
  const memberTotalPages = membersPage?.totalPages ?? 1;

  const renderTabs = () => (
    <div className={styles.tabs} role="tablist" aria-label="쿠폰/포인트 관리 탭">
      <button type="button" role="tab" aria-selected={activeTab === 'coupons'} className={activeTab === 'coupons' ? styles.activeTab : ''} onClick={() => setActiveTab('coupons')}>
        쿠폰 관리
      </button>
      <button type="button" role="tab" aria-selected={activeTab === 'points'} className={activeTab === 'points' ? styles.activeTab : ''} onClick={() => setActiveTab('points')}>
        포인트 조정
      </button>
    </div>
  );

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="admin-benefits-title">
      <div className={styles.header}>
        <div>
          <span>쿠폰/포인트</span>
          <h1 id="admin-benefits-title">쿠폰/포인트 관리</h1>
        </div>
      </div>

      {errorMessage ? <p className={styles.notice}>{errorMessage}</p> : null}
      {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}

      {activeTab === 'coupons' ? (
        <div className={`${styles.contentGrid} ${styles.couponGrid}`}>
          <section className={styles.panel} aria-label="쿠폰 조회 및 등록">
            <form className={styles.filterPanel} onSubmit={handleCouponSearch}>
              {renderTabs()}
              <label>
                <span className={styles.filterLabelText}>쿠폰 상태</span>
                <select name="status" defaultValue={searchParams.get('status') ?? ''}>
                  <option value="">전체</option>
                  {couponStatusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={styles.filterLabelText}>쿠폰 유형</span>
                <select name="couponType" defaultValue={searchParams.get('couponType') ?? ''}>
                  <option value="">전체</option>
                  {couponTypeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.filterActions}>
                <Button type="submit">검색</Button>
                <Button type="button" variant="secondary" onClick={handleCouponReset}>
                  초기화
                </Button>
              </div>
            </form>

            <div className={styles.tableHeader}>
              <div>
                <h2>쿠폰 테이블</h2>
                <p>총 {(couponsPage?.totalElements ?? 0).toLocaleString('ko-KR')}건</p>
              </div>
              <span>
                {couponShownPage} / {couponTotalPages}
              </span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>쿠폰번호</th>
                    <th>쿠폰명</th>
                    <th>유형</th>
                    <th>혜택</th>
                    <th>유효일</th>
                    <th>상태</th>
                    <th>발급/사용</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {isCouponLoading ? (
                    <tr>
                      <td colSpan={9}>쿠폰 목록을 불러오는 중입니다.</td>
                    </tr>
                  ) : coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <tr key={coupon.couponId}>
                        <td>CP-{coupon.couponId}</td>
                        <td>
                          <span className={styles.couponName} title={coupon.couponName}>
                            {coupon.couponName}
                          </span>
                        </td>
                        <td>{getOptionLabel(couponTypeOptions, coupon.couponType)}</td>
                        <td>{formatBenefit(coupon)}</td>
                        <td>{coupon.validDays}일</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${coupon.status}`]}`}>{getOptionLabel(couponStatusOptions, coupon.status)}</span>
                        </td>
                        <td>
                          {(coupon.issuedCount ?? 0).toLocaleString('ko-KR')} / {(coupon.usedCount ?? 0).toLocaleString('ko-KR')}
                        </td>
                        <td className={styles.dateCell}>{formatCompactDate(coupon.createdAt)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button type="button" onClick={() => openIssueModal(coupon)} disabled={coupon.status !== 'ACTIVE'}>
                              회원 발급
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>쿠폰 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <Button type="button" variant="secondary" disabled={couponShownPage <= 1} onClick={() => updateQuery({ couponPage: String(couponShownPage - 1) })}>
                이전
              </Button>
              <span>{couponShownPage} 페이지</span>
              <Button type="button" variant="secondary" disabled={couponShownPage >= couponTotalPages} onClick={() => updateQuery({ couponPage: String(couponShownPage + 1) })}>
                다음
              </Button>
            </div>
          </section>

          <form className={`${styles.sidePanel} ${styles.couponCreatePanel}`} onSubmit={handleCouponCreate} aria-label="쿠폰 등록">
            <div className={styles.tableHeader}>
              <div>
                <h2>쿠폰 등록</h2>
                <p>정의한 쿠폰은 회원 발급에 사용할 수 있습니다.</p>
              </div>
            </div>
            {formError ? <p className={styles.modalError}>{formError}</p> : null}
            <label>
              쿠폰명
              <input value={couponForm.couponName} onChange={(event) => setCouponForm((current) => ({ ...current, couponName: event.target.value }))} placeholder="예: 신규 회원 1,000원 할인 쿠폰" />
            </label>
            <label>
              쿠폰 유형
              <select value={couponForm.couponType} onChange={(event) => setCouponForm((current) => ({ ...current, couponType: event.target.value as AdminCouponType }))}>
                {couponTypeOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.formGrid}>
              <label>
                혜택 값
                <input type="number" min="1" value={couponForm.benefitValue} onChange={(event) => setCouponForm((current) => ({ ...current, benefitValue: event.target.value }))} placeholder={couponForm.couponType === 'PERCENT_DISCOUNT' ? '1~100' : '금액'} />
              </label>
              <label>
                유효일
                <input type="number" min="1" value={couponForm.validDays} onChange={(event) => setCouponForm((current) => ({ ...current, validDays: event.target.value }))} />
              </label>
            </div>
            <label>
              상태
              <select value={couponForm.status} onChange={(event) => setCouponForm((current) => ({ ...current, status: event.target.value as AdminCouponStatus }))}>
                {couponStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? '저장 중' : '쿠폰 등록'}
            </Button>
          </form>
        </div>
      ) : (
        <div className={styles.contentGrid}>
          <section className={styles.panel} aria-label="회원 검색">
            <form className={styles.memberFilterPanel} onSubmit={handleMemberSearch}>
              {renderTabs()}
              <label>
                <span className={styles.filterLabelText}>회원 검색</span>
                <input name="memberQ" type="search" placeholder="회원명, 아이디, 이메일" defaultValue={searchParams.get('memberQ') ?? ''} />
              </label>
              <div className={styles.filterActions}>
                <Button type="submit">검색</Button>
                <Button type="button" variant="secondary" onClick={handleMemberReset}>
                  초기화
                </Button>
              </div>
            </form>

            <div className={styles.tableHeader}>
              <div>
                <h2>회원 테이블</h2>
                <p>포인트 조정 대상 회원을 선택하세요.</p>
              </div>
              <span>
                {memberShownPage} / {memberTotalPages}
              </span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.memberTable}>
                <thead>
                  <tr>
                    <th>회원번호</th>
                    <th>아이디/이름</th>
                    <th>이메일</th>
                    <th>등급</th>
                    <th>포인트</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {isMemberLoading ? (
                    <tr>
                      <td colSpan={6}>회원 목록을 불러오는 중입니다.</td>
                    </tr>
                  ) : members.length > 0 ? (
                    members.map((member) => (
                      <tr key={member.memberId} className={selectedMember?.memberId === member.memberId ? styles.selectedRow : ''}>
                        <td>M-{member.memberId}</td>
                        <td>
                          <Link className={styles.memberLink} to={`/admin/members/${member.memberId}`}>
                            <strong>{member.loginId}</strong>
                            <span>{member.name}</span>
                          </Link>
                        </td>
                        <td>{member.maskedEmail}</td>
                        <td>{member.gradeName ?? '-'}</td>
                        <td>{formatPoint(member.pointBalance)}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button type="button" disabled={isSaving} onClick={() => void handleSelectMember(member)}>
                              선택
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>검색된 회원이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <Button type="button" variant="secondary" disabled={memberShownPage <= 1} onClick={() => updateQuery({ memberPage: String(memberShownPage - 1) })}>
                이전
              </Button>
              <span>{memberShownPage} 페이지</span>
              <Button type="button" variant="secondary" disabled={memberShownPage >= memberTotalPages} onClick={() => updateQuery({ memberPage: String(memberShownPage + 1) })}>
                다음
              </Button>
            </div>
          </section>

          <aside className={styles.sidePanel} aria-label="포인트 조정">
            <div className={styles.tableHeader}>
              <div>
                <h2>포인트 조정</h2>
                <p>{selectedMember ? `${selectedMember.name} / ${selectedMember.loginId}` : '회원을 먼저 선택하세요.'}</p>
              </div>
            </div>
            {selectedMember ? (
              <div className={styles.selectedMemberCard}>
                <span>현재 포인트</span>
                <strong>{formatPoint(selectedMember.pointBalance)}</strong>
              </div>
            ) : null}
            {formError ? <p className={styles.modalError}>{formError}</p> : null}
            <form className={styles.pointForm} onSubmit={handlePointSubmit}>
              <label>
                조정 포인트
                <input type="number" value={pointForm.pointAmount} onChange={(event) => setPointForm((current) => ({ ...current, pointAmount: event.target.value }))} placeholder="지급은 양수, 차감은 음수" />
              </label>
              <label>
                조정 사유
                <textarea rows={4} value={pointForm.description} onChange={(event) => setPointForm((current) => ({ ...current, description: event.target.value }))} placeholder="관리자 조정 사유를 입력하세요." />
              </label>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중' : '포인트 조정'}
              </Button>
            </form>
            <div className={styles.historyList} aria-label="포인트 조정 이력">
              <h3>최근 조정 이력</h3>
              {isPointHistoryLoading ? (
                <p>포인트 이력을 불러오는 중입니다.</p>
              ) : pointHistoryError ? (
                <p className={styles.modalError}>{pointHistoryError}</p>
              ) : pointHistories.length > 0 ? (
                pointHistories.map((history) => (
                  <dl key={history.pointHistoryId}>
                    <div>
                      <dt>{history.description}</dt>
                      <dd className={history.pointAmount > 0 ? styles.plusPoint : styles.minusPoint}>{formatPoint(history.pointAmount)}</dd>
                    </div>
                    <span>{formatDate(history.createdAt)}</span>
                  </dl>
                ))
              ) : (
                <p>포인트 조정 이력이 없습니다.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {issueCoupon ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeIssueModal}>
          <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="coupon-issue-title" onSubmit={handleCouponIssue} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="coupon-issue-title">회원 쿠폰 발급</h2>
                <p>{issueCoupon.couponName}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeIssueModal}>
                ×
              </button>
            </div>
            {formError ? <p className={styles.modalError}>{formError}</p> : null}
            <label>
              회원 검색 (아이디 · 이름 · 이메일)
              <div className={styles.issueSearchRow}>
                <input value={issueMemberQuery} onChange={(event) => setIssueMemberQuery(event.target.value)} placeholder="예: park_reader" />
                <Button type="button" variant="secondary" onClick={() => void searchIssueMembers()}>
                  검색
                </Button>
              </div>
            </label>
            {issueMemberResults.length > 0 ? (
              <div className={styles.issueResults}>
                {issueMemberResults.map((member) => (
                  <button
                    type="button"
                    key={member.memberId}
                    className={`${styles.issueResultItem} ${selectedIssueMembers.some((item) => item.memberId === member.memberId) ? styles.issueResultItemSelected : ''}`}
                    onClick={() => toggleIssueMember(member)}
                  >
                    <span>
                      {member.loginId} ({member.name})
                    </span>
                    <span>{formatPoint(member.pointBalance)}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {selectedIssueMembers.length > 0 ? (
              <div className={styles.selectedChips}>
                {selectedIssueMembers.map((member) => (
                  <span className={styles.chip} key={member.memberId}>
                    {member.loginId}
                    <button type="button" aria-label={`${member.loginId} 선택 해제`} onClick={() => toggleIssueMember(member)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <label>
              발급 수량
              <input type="number" min="1" value={issueForm.quantity} onChange={(event) => setIssueForm((current) => ({ ...current, quantity: event.target.value }))} />
            </label>
            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={closeIssueModal} disabled={isSaving}>
                취소
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '발급 중' : '발급 저장'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
