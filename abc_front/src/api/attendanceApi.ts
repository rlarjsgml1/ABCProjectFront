import { apiClient } from './apiClient';
import type {
  ApiResponse,
  AttendanceCheckApiResponse,
  AttendanceCheckInResult,
  AttendanceDay,
  AttendanceMonthApiResponse,
  AttendanceMonthlyData,
  AttendanceMonthlyQuery,
} from '../types/api';

const attendanceRewardGuide = ['7일 연속 쿠폰 5% 지급', '30일 연속 쿠폰 10% 지급'];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatYearMonth(query: AttendanceMonthlyQuery) {
  return `${query.year}-${String(query.month).padStart(2, '0')}`;
}

function getDaysInMonth(query: AttendanceMonthlyQuery) {
  return new Date(query.year, query.month, 0).getDate();
}

function toMonthlyData(query: AttendanceMonthlyQuery, response: AttendanceMonthApiResponse): AttendanceMonthlyData {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const daysInMonth = getDaysInMonth(query);
  const attendedDateSet = new Set(response.attendanceDates);

  const days: AttendanceDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(query.year, query.month - 1, day);
    const dateKey = formatDateKey(date);

    return {
      date: dateKey,
      day,
      status: attendedDateSet.has(dateKey) ? 'ATTENDED' : 'EMPTY',
      isToday: dateKey === todayKey,
    };
  });

  return {
    year: query.year,
    month: query.month,
    attendedDates: response.attendanceDates,
    days,
    todayCheckedIn: response.todayCheckedYn,
    consecutiveDays: response.consecutiveDays,
    monthlyAttendanceCount: response.attendanceDates.length,
    challengeDays: Math.min(7, response.consecutiveDays),
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

export async function getMonthlyAttendance(query: AttendanceMonthlyQuery = getCurrentAttendanceQuery()) {
  const response = await apiClient.get<ApiResponse<AttendanceMonthApiResponse>>('/me/attendance', {
    params: { yearMonth: formatYearMonth(query) },
  });

  return toMonthlyData(query, response.data.data);
}

export async function checkInToday(): Promise<AttendanceCheckInResult> {
  const response = await apiClient.post<ApiResponse<AttendanceCheckApiResponse>>('/me/attendance');
  const checkIn = response.data.data;

  const query = getCurrentAttendanceQuery();
  const monthlyAttendance = await getMonthlyAttendance(query);
  const issuedReward = checkIn.issuedCoupons.length > 0 ? checkIn.issuedCoupons.map((coupon) => coupon.couponName).join(', ') : undefined;

  return {
    checkedIn: true,
    message: '오늘 출석이 완료되었습니다.',
    checkedInAt: checkIn.attendanceDate,
    monthlyAttendance,
    issuedReward,
  };
}
