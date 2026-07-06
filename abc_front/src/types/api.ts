export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

export type ErrorResponse = {
  success: false;
  code: string;
  message: string;
  errors: Array<{
    field?: string;
    message: string;
  }>;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type PointHistoryQuery = {
  pointType?: string;
  page?: number;
  size?: number;
};

export type PointHistoryItem = {
  pointHistoryId?: number;
  pointId?: number;
  id?: number;
  detail?: string;
  description?: string;
  detailContent?: string;
  earnedAt?: string;
  createdAt?: string;
  pointType?: string;
  usageType?: string;
  useType?: string;
  amount?: number;
  pointAmount?: number;
};

export type PointHistoryPage = PageResponse<PointHistoryItem> & {
  currentPoint?: number;
  balance?: number;
  totalPoint?: number;
};

export type CouponHistoryQuery = {
  status?: string;
  usableForBookId?: number;
  page?: number;
  size?: number;
};

export type CouponHistoryItem = {
  couponId?: number;
  id?: number;
  couponName?: string;
  name?: string;
  detail?: string;
  description?: string;
  issuedAt?: string;
  createdAt?: string;
  validFrom?: string;
  validUntil?: string;
  expiredAt?: string;
  status?: string;
  usableBookCount?: number;
};

export type CouponHistoryPage = PageResponse<CouponHistoryItem> & {
  availableCouponCount?: number;
  expiringThisMonthCount?: number;
};

export type ReadingStatisticsPeriodType = 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'TOTAL';

export type ReadingStatisticsQuery = {
  periodType: ReadingStatisticsPeriodType;
  baseDate?: string;
};

export type ReadingStatisticsSummary = {
  rentalCount: number;
  readBookCount: number;
  readPageCount: number;
  reviewCount: number;
  favoriteCount: number;
};

export type ReadingEnvironmentMetrics = {
  carbonSavedKg: number;
  treeSavedCount: number;
  calculationDescription: string;
};

export type ReadingTrendPoint = {
  label: string;
  periodStartDate?: string;
  periodEndDate?: string;
  rentalCount: number;
  readBookCount: number;
  readPageCount: number;
};

export type ReadingStatisticsData = {
  periodType: ReadingStatisticsPeriodType;
  baseDate?: string;
  summary: ReadingStatisticsSummary;
  environmentMetrics: ReadingEnvironmentMetrics;
  trendPoints: ReadingTrendPoint[];
  generatedAt?: string;
};


export type AttendanceMonthlyQuery = {
  year: number;
  month: number;
};

export type AttendanceDayStatus = 'ATTENDED' | 'MISSED' | 'EMPTY';

export type AttendanceDay = {
  date: string;
  day: number;
  status: AttendanceDayStatus;
  isToday: boolean;
};

export type AttendanceMonthlyData = {
  year: number;
  month: number;
  attendedDates: string[];
  days: AttendanceDay[];
  todayCheckedIn: boolean;
  consecutiveDays: number;
  monthlyAttendanceCount: number;
  challengeDays: number;
  rewardGuide: string[];
};

export type AttendanceCheckInResult = {
  checkedIn: boolean;
  message: string;
  checkedInAt: string;
  monthlyAttendance: AttendanceMonthlyData;
  issuedReward?: string;
};

export type BookCard = {
  bookId: number;
  title: string;
  coverImageUrl: string;
  authors: string[];
  publisherName: string;
  rentalType: string;
  rentalPrice: number;
  averageRating: number;
  reviewCount: number;
  favoriteYn: boolean;
};

export type Category = {
  categoryId: number;
  name: string;
};

export type FavoriteSort = 'recent' | 'title';

export type FavoriteBooksQuery = {
  sort?: FavoriteSort;
  page?: number;
  size?: number;
};

export type FavoriteBookItem = BookCard & {
  favoriteId?: number;
  registeredAt?: string;
  createdAt?: string;
};

export type FavoriteBooksPage = PageResponse<FavoriteBookItem>;

// DB 테이블명이 아니라 API-ME-001 응답 DTO 기준으로 front에서 쓰는 회원 정보 필드다.
export type UserProfile = {
  loginId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  role: string;
  status: string;
  gradeName?: string;
  membershipGrade?: string;
  nextGradeName?: string;
  nextGradeRemainingPercent?: number;
  gradeProgressPercent?: number;
  currentPaymentAmount?: number;
  gradeBenefitText?: string;
  remainingGradePeriodDays?: number;
  point?: number;
  couponCount?: number;
  rentalCount?: number;
  completedBookCount?: number;
  favoriteCount?: number;
  unreadNotificationCount?: number;
  reviewCount?: number;
};

// API-ME-002에서 수정 가능한 필드만 포함한다. loginId, birthDate, role, status는 수정하지 않는다.
export type UserProfileUpdateRequest = {
  name: string;
  email: string;
  phone: string;
  gender: string;
};

// API-ME-003 비밀번호 변경 요청 DTO다.
export type UserPasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};
