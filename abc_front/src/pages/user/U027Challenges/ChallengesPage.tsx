// 챌린지(U027) 화면 — 일일/전체 챌린지 진행 현황을 보여주고 완료된 챌린지의 보상 수령을 처리한다
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { claimChallengeReward, getMyChallenges } from '../../../api/challengesApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import type { ChallengeItem, ChallengeListResponse, ChallengeRewardStatus, ChallengeType } from '../../../types/api';
import styles from '../../../styles/ChallengesPage.module.css';

type ChallengeTab = 'DAILY' | 'ALL';

const tabs: Array<{ label: string; value: ChallengeTab }> = [
  { label: '일일 챌린지', value: 'DAILY' },
  { label: '전체', value: 'ALL' },
];

function normalizeChallenges(data: ChallengeListResponse | null | undefined) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.content ?? [];
}

function getChallengeId(challenge: ChallengeItem) {
  return challenge.challengeId ?? challenge.id;
}

function getChallengeTitle(challenge: ChallengeItem) {
  return challenge.title ?? challenge.name ?? '챌린지';
}

function getChallengeType(challenge: ChallengeItem): ChallengeType {
  return challenge.challengeType ?? challenge.type ?? 'TOTAL';
}

function getCurrentCount(challenge: ChallengeItem) {
  return challenge.currentCount ?? 0;
}

function getGoalCount(challenge: ChallengeItem) {
  return challenge.goalCount ?? 0;
}

function getProgress(challenge: ChallengeItem) {
  const explicitProgress = challenge.progressRate ?? challenge.progressPercent;
  if (typeof explicitProgress === 'number') {
    return Math.min(Math.max(Math.round(explicitProgress), 0), 100);
  }

  const goalCount = getGoalCount(challenge);
  if (!goalCount) {
    return 0;
  }

  return Math.min(Math.round((getCurrentCount(challenge) / goalCount) * 100), 100);
}

function getRewardLabel(challenge: ChallengeItem) {
  if (challenge.rewardName) {
    return challenge.rewardName;
  }

  if (challenge.rewardType === 'POINT') {
    return `${(challenge.rewardAmount ?? 0).toLocaleString('ko-KR')}포인트`;
  }

  if (challenge.rewardType === 'COUPON') {
    return '쿠폰';
  }

  return '보상';
}

function getRewardStatus(challenge: ChallengeItem): ChallengeRewardStatus {
  if (challenge.rewardStatus) {
    return challenge.rewardStatus;
  }

  if (getProgress(challenge) >= 100) {
    return 'AVAILABLE';
  }

  return 'NOT_AVAILABLE';
}

function getRewardButtonLabel(status: ChallengeRewardStatus) {
  if (status === 'AVAILABLE') {
    return '보상 받기';
  }

  if (status === 'RECEIVED') {
    return '보상 완료';
  }

  if (status === 'EXPIRED') {
    return '기간 종료';
  }

  return '진행 중';
}

function getStatusLabel(challenge: ChallengeItem) {
  const status = challenge.status;
  if (status === 'COMPLETED') return '완료';
  if (status === 'EXPIRED') return '기간 종료';
  if (getProgress(challenge) >= 100) return '완료 가능';
  return '진행 중';
}

function formatDate(value: string | undefined) {
  if (!value) {
    return '-';
  }

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function getStartDate(challenge: ChallengeItem) {
  return challenge.startedAt ?? challenge.startDate;
}

function getEndDate(challenge: ChallengeItem) {
  return challenge.endsAt ?? challenge.endDate;
}

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<ChallengeTab>('DAILY');
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedChallengeId, setExpandedChallengeId] = useState<number | null>(null);
  const [rewardMessage, setRewardMessage] = useState('');
  const [claimingChallengeId, setClaimingChallengeId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadChallenges() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getMyChallenges();
        if (!ignore) {
          const nextChallenges = normalizeChallenges(data).filter((challenge) => {
            const type = getChallengeType(challenge);
            return type === 'DAILY' || type === 'TOTAL';
          });
          setChallenges(nextChallenges);
        }
      } catch {
        if (!ignore) {
          setChallenges([]);
          setErrorMessage('현재 챌린지 정보를 불러오지 못했습니다.');
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
  }, []);

  const filteredChallenges = useMemo(() => {
    if (activeTab === 'DAILY') {
      return challenges.filter((challenge) => getChallengeType(challenge) === 'DAILY');
    }

    return challenges;
  }, [activeTab, challenges]);

  async function handleClaimReward(challenge: ChallengeItem) {
    const challengeId = getChallengeId(challenge);
    if (!challengeId || getRewardStatus(challenge) !== 'AVAILABLE') {
      return;
    }

    setClaimingChallengeId(challengeId);
    setRewardMessage('');

    try {
      const result = await claimChallengeReward(challengeId);
      setRewardMessage(result.message ?? '보상이 지급되었습니다.');
      setChallenges((currentChallenges) =>
        currentChallenges.map((item) => (getChallengeId(item) === challengeId ? { ...item, rewardStatus: 'RECEIVED' } : item)),
      );
    } catch (error) {
      setRewardMessage(getApiErrorMessage(error));
    } finally {
      setClaimingChallengeId(null);
    }
  }

  return (
    <MyPageLayout titleId="challenges-title">
      <section className={`page-section ${styles.page}`}>
        <div className={styles.layout}>
          <aside className={styles.aside}>
            <h2 id="challenges-title">나의 챌린지 현황</h2>
            <Link className={`button ${styles.rewardLink}`} to="/me/points-coupons">
              내 포인트/쿠폰 확인
            </Link>
          </aside>

          <div className={styles.content}>
            <div className={styles.tabs} role="tablist" aria-label="챌린지 유형 선택">
              {tabs.map((tab) => (
                <button
                  className={`${styles.tab} ${activeTab === tab.value ? styles.activeTab : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {errorMessage && <p className={styles.notice}>{errorMessage}</p>}
            {rewardMessage && <p className={styles.rewardMessage}>{rewardMessage}</p>}

            <div className={styles.list} aria-live="polite">
              {isLoading ? (
                <p className={styles.empty}>챌린지를 불러오는 중입니다.</p>
              ) : filteredChallenges.length > 0 ? (
                filteredChallenges.map((challenge) => {
                  const challengeId = getChallengeId(challenge);
                  const progress = getProgress(challenge);
                  const rewardStatus = getRewardStatus(challenge);
                  const isExpanded = expandedChallengeId === challengeId;

                  return (
                    <article className={styles.card} key={challengeId ?? getChallengeTitle(challenge)}>
                      <div className={styles.badge} aria-hidden="true">
                        챌린지
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h3>{getChallengeTitle(challenge)}</h3>
                            <p>{challenge.description ?? `${challenge.goalAction ?? '목표 행동'}을 완료해 보세요.`}</p>
                          </div>
                          <span>{getStatusLabel(challenge)}</span>
                        </div>

                        <dl className={styles.metaList}>
                          <div>
                            <dt>챌린지 보상</dt>
                            <dd>{getRewardLabel(challenge)}</dd>
                          </div>
                          <div>
                            <dt>목표 행동</dt>
                            <dd>{challenge.goalAction ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>챌린지 시작일</dt>
                            <dd>{formatDate(getStartDate(challenge))}</dd>
                          </div>
                        </dl>

                        <div className={styles.progressBlock}>
                          <div className={styles.progressHeader}>
                            <span>챌린지 진행률</span>
                            <strong>{progress}%</strong>
                          </div>
                          <div className={styles.progressTrack} aria-label={`챌린지 진행률 ${progress}%`}>
                            <span style={{ width: `${progress}%` }} />
                          </div>
                          <p>
                            {getCurrentCount(challenge).toLocaleString('ko-KR')} / {getGoalCount(challenge).toLocaleString('ko-KR')}
                          </p>
                        </div>

                        {isExpanded && (
                          <div className={styles.detail}>
                            <p>기간: {formatDate(getStartDate(challenge))} - {formatDate(getEndDate(challenge))}</p>
                            <p>유형: {getChallengeType(challenge) === 'DAILY' ? '일일 챌린지' : '전체 챌린지'}</p>
                          </div>
                        )}

                        <div className={styles.cardActions}>
                          <Link className={styles.smallButton} to={getChallengeType(challenge) === 'DAILY' ? '/me/attendance' : '/books'}>
                            이어하기
                          </Link>
                          <button className={styles.smallButton} type="button" onClick={() => setExpandedChallengeId(isExpanded ? null : challengeId ?? null)}>
                            자세히보기
                          </button>
                        </div>
                      </div>

                      <div className={styles.rewardArea}>
                        <button
                          className="button button-secondary"
                          type="button"
                          disabled={rewardStatus !== 'AVAILABLE' || claimingChallengeId === challengeId}
                          onClick={() => handleClaimReward(challenge)}
                        >
                          {claimingChallengeId === challengeId ? '처리 중' : getRewardButtonLabel(rewardStatus)}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className={styles.empty}>진행 중인 챌린지가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </MyPageLayout>
  );
}
