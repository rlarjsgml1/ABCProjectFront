// 출석 체크(U016) 화면 — 월간 출석 달력과 7일 챌린지 진행률을 보여주고 오늘 출석 체크 처리를 담당한다
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { checkInToday, getCurrentAttendanceQuery, getMonthlyAttendance } from '../../../api/attendanceApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { AttendanceMonthlyData } from '../../../types/api';

type AttendanceProgressStyle = CSSProperties & {
  '--attendance-progress': string;
};

const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토'];
const challengeSlots = Array.from({ length: 7 }, (_, index) => index + 1);

function getCalendarLeadDays(data: AttendanceMonthlyData) {
  return new Date(data.year, data.month - 1, 1).getDay();
}

function formatMonthLabel(data: AttendanceMonthlyData) {
  return `${data.year}.${String(data.month).padStart(2, '0')}`;
}

function getProgressStyle(data: AttendanceMonthlyData): AttendanceProgressStyle {
  const progress = Math.round((data.challengeDays / 7) * 100);

  return { '--attendance-progress': `${progress}%` };
}

export function AttendancePage() {
  const attendanceQuery = useMemo(() => getCurrentAttendanceQuery(), []);
  const [attendanceData, setAttendanceData] = useState<AttendanceMonthlyData | null>(null);
  const [attendanceError, setAttendanceError] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadAttendance() {
      try {
        const data = await getMonthlyAttendance(attendanceQuery);
        if (!ignore) {
          setAttendanceData(data);
          setAttendanceError('');
        }
      } catch (error) {
        if (!ignore) {
          setAttendanceError(getApiErrorMessage(error));
        }
      }
    }

    void loadAttendance();

    return () => {
      ignore = true;
    };
  }, [attendanceQuery]);

  async function handleCheckIn() {
    setIsCheckingIn(true);
    setAttendanceError('');
    setCheckInMessage('');

    try {
      const result = await checkInToday();
      setAttendanceData(result.monthlyAttendance);
      setCheckInMessage(result.issuedReward ? `${result.message} ${result.issuedReward}이 지급되었습니다.` : result.message);
    } catch (error) {
      setAttendanceError(getApiErrorMessage(error));
    } finally {
      setIsCheckingIn(false);
    }
  }

  const leadDays = attendanceData ? getCalendarLeadDays(attendanceData) : 0;
  const isTodayCheckedIn = attendanceData?.todayCheckedIn ?? false;

  return (
      <section className="page-section attendance-page" aria-labelledby="attendance-title">
        <div className="section-heading-row attendance-heading-row">
          <div>
            <h2 id="attendance-title">출석체크</h2>
          </div>
          <span>매일 쌓는 독서 루틴</span>
        </div>

        {attendanceError ? <div className="status-banner status-banner-error">{attendanceError}</div> : null}
        {checkInMessage ? <div className="status-banner status-banner-success">{checkInMessage}</div> : null}

        {attendanceData ? (
          <div className="attendance-dashboard">
            <section className="attendance-calendar-panel" aria-labelledby="attendance-calendar-title">
              <div className="attendance-calendar-header">
                <div>
                  <p className="attendance-calendar-kicker">MONTHLY CHECK</p>
                  <h3 id="attendance-calendar-title">{formatMonthLabel(attendanceData)}</h3>
                </div>
                <div className="attendance-legend" aria-label="출석 달력 범례">
                  <span className="attendance-legend-item"><span className="attendance-dot is-today" aria-hidden="true" />오늘</span>
                  <span className="attendance-legend-item"><span className="attendance-dot is-attended" aria-hidden="true" />출석</span>
                </div>
              </div>

              <div className="attendance-weekdays" aria-hidden="true">
                {weekDayLabels.map((label) => <span key={label}>{label}</span>)}
              </div>

              <div className="attendance-calendar-grid" role="grid" aria-label={`${formatMonthLabel(attendanceData)} 출석 달력`}>
                {Array.from({ length: leadDays }, (_, index) => (
                  <span className="attendance-day-cell is-empty" key={`empty-${index + 1}`} aria-hidden="true" />
                ))}
                {attendanceData.days.map((day) => (
                  <span
                    className={`attendance-day-cell${day.status === 'ATTENDED' ? ' is-attended' : ''}${day.isToday ? ' is-today' : ''}`}
                    key={day.date}
                    role="gridcell"
                    aria-label={`${day.day}일${day.isToday ? ' 오늘' : ''}${day.status === 'ATTENDED' ? ' 출석 완료' : ''}`}
                  >
                    {day.day}
                  </span>
                ))}
              </div>
            </section>

            <aside className="attendance-side-panel" aria-label="출석 현황과 보상 안내">
              <div className="attendance-status-card">
                <span>현재 연속 출석</span>
                <strong>{attendanceData.consecutiveDays}일</strong>
                <p>이번 달 총 {attendanceData.monthlyAttendanceCount}회 출석했습니다.</p>
                <Button className="attendance-check-button" type="button" onClick={handleCheckIn} disabled={isTodayCheckedIn || isCheckingIn}>
                  {isTodayCheckedIn ? '출석 완료' : '오늘 출석하기'}
                </Button>
              </div>

              <div className="attendance-challenge-card">
                <div className="section-heading-row">
                  <h3>7-day challenge</h3>
                  <span>{attendanceData.challengeDays}/7</span>
                </div>
                <div className="attendance-acorn-row" aria-label={`7일 챌린지 ${attendanceData.challengeDays}일 달성`}>
                  {challengeSlots.map((slot) => (
                    <span className={`attendance-acorn${slot <= attendanceData.challengeDays ? ' is-active' : ''}`} key={slot} aria-hidden="true">
                      {slot <= attendanceData.challengeDays ? '●' : '○'}
                    </span>
                  ))}
                </div>
                <div className="attendance-progress-track" aria-hidden="true">
                  <span className="attendance-progress-fill" style={getProgressStyle(attendanceData)} />
                </div>
                <span className="attendance-progress-badge">{attendanceData.challengeDays === 7 ? '쿠폰 지급 대상' : `${7 - attendanceData.challengeDays}일 남음`}</span>
              </div>

              <div className="attendance-reward-card">
                <h3>Reward guide</h3>
                <ul>
                  {attendanceData.rewardGuide.map((reward) => <li key={reward}>{reward}</li>)}
                </ul>
              </div>
            </aside>
          </div>
        ) : (
          <div className="status-banner">출석 정보를 불러오는 중입니다.</div>
        )}

        <section className="attendance-notice-panel" aria-labelledby="attendance-notice-title">
          <h3 id="attendance-notice-title">안내사항</h3>
          <ul>
            <li>출석체크는 계정당 하루 한 번만 참여할 수 있습니다.</li>
            <li>연속 출석 보상 쿠폰은 조건 달성 시 쿠폰함에서 확인할 수 있습니다.</li>
          </ul>
        </section>
      </section>
  );
}
