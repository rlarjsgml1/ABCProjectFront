import type { AttendanceCheckInResult, AttendanceDay, AttendanceMonthlyData, AttendanceMonthlyQuery } from '../types/api';

const attendanceRewardGuide = ['7일 연속 쿠폰 지급', '한달 연속 쿠폰X2 지급'];
const mockCheckedDateSet = new Set<string>();

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDateFromQuery(query: AttendanceMonthlyQuery) {
  return new Date(query.year, query.month - 1, 1);
}

function seedMonth(query: AttendanceMonthlyQuery) {
  const monthStart = getDateFromQuery(query);
  const today = new Date();
  const seedDays = [1, 2, 3, 5, 6, 7, 8, 12, 15, 18, 21, 22, 23, 24];

  const todayKey = formatDateKey(today);

  for (const day of seedDays) {
    const seedDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const seedDateKey = formatDateKey(seedDate);
    if (seedDate.getMonth() === monthStart.getMonth() && seedDate < today && seedDateKey !== todayKey) {
      mockCheckedDateSet.add(seedDateKey);
    }
  }
}

function getDaysInMonth(query: AttendanceMonthlyQuery) {
  return new Date(query.year, query.month, 0).getDate();
}

function getConsecutiveDays(attendedDates: string[], todayKey: string) {
  const attendedDateSet = new Set(attendedDates);
  let cursor = new Date(todayKey);
  let streak = 0;

  while (attendedDateSet.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return streak;
}

function buildMonthlyAttendance(query: AttendanceMonthlyQuery): AttendanceMonthlyData {
  seedMonth(query);

  const today = new Date();
  const todayKey = formatDateKey(today);
  const daysInMonth = getDaysInMonth(query);
  const attendedDates = Array.from(mockCheckedDateSet)
    .filter((dateKey) => dateKey.startsWith(`${query.year}-${String(query.month).padStart(2, '0')}`))
    .sort();
  const attendedDateSet = new Set(attendedDates);
  const days: AttendanceDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(query.year, query.month - 1, day);
    const dateKey = formatDateKey(date);
    const isToday = dateKey === todayKey;

    return {
      date: dateKey,
      day,
      status: attendedDateSet.has(dateKey) ? 'ATTENDED' : 'EMPTY',
      isToday,
    };
  });

  const todayCheckedIn = attendedDateSet.has(todayKey);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const streakBaseKey = todayCheckedIn ? todayKey : formatDateKey(yesterday);
  const consecutiveDays = getConsecutiveDays(attendedDates, streakBaseKey);

  return {
    year: query.year,
    month: query.month,
    attendedDates,
    days,
    todayCheckedIn,
    consecutiveDays,
    monthlyAttendanceCount: attendedDates.length,
    challengeDays: Math.min(7, consecutiveDays),
    rewardGuide: attendanceRewardGuide,
  };
}

export function getCurrentAttendanceQuery(): AttendanceMonthlyQuery {
  const today = new Date();

  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  };
}

// 아직 출석체크 backend controller가 없어 front-only 미리보기 데이터만 반환한다.
export async function getMonthlyAttendance(query: AttendanceMonthlyQuery = getCurrentAttendanceQuery()) {
  return buildMonthlyAttendance(query);
}

// 아직 출석체크 backend controller가 없어 front-only 미리보기 데이터만 반환한다.
export async function checkInToday(): Promise<AttendanceCheckInResult> {
  const today = new Date();
  const todayKey = formatDateKey(today);
  mockCheckedDateSet.add(todayKey);

  const monthlyAttendance = buildMonthlyAttendance({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const issuedReward = monthlyAttendance.consecutiveDays > 0 && monthlyAttendance.consecutiveDays % 7 === 0 ? '7일 연속 출석 쿠폰' : undefined;

  return {
    checkedIn: true,
    message: monthlyAttendance.todayCheckedIn ? '오늘 출석이 완료되었습니다.' : '출석 정보를 확인했습니다.',
    checkedInAt: today.toISOString(),
    monthlyAttendance,
    issuedReward,
  };
}
