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

export type SignupRequest = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone?: string;
  birthDate: string;
  gender?: string;
};

export type SignupResponse = {
  memberId: number;
  loginId: string;
  name: string;
  role: string;
};

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type LoginMember = {
  memberId: number;
  loginId: string;
  name: string;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  member: LoginMember;
};

export type AdminMemberStatus = 'JOINED' | 'SANCTIONED' | 'WITHDRAWN' | 'DEACTIVATED';

export type AdminMemberRole = 'USER' | 'ADMIN';

export type AdminSanctionType = 'ACCOUNT_SUSPENSION' | 'SERVICE_LIMIT' | 'WARNING';

export type AdminMemberListQuery = {
  q?: string;
  status?: AdminMemberStatus;
  role?: AdminMemberRole;
  gradeId?: number;
  page?: number;
  size?: number;
};

export type AdminMemberSanctionSummary = {
  sanctionType?: AdminSanctionType | string;
  startedAt?: string;
  endedAt?: string;
  reason?: string;
};

export type AdminMemberSummary = {
  memberId: number;
  loginId: string;
  name: string;
  email: string;
  role: AdminMemberRole;
  gradeId?: number;
  gradeName?: string;
  pointBalance: number;
  status: AdminMemberStatus;
  currentSanction?: AdminMemberSanctionSummary | null;
};

export type AdminMemberStatusChangeRequest = {
  status: AdminMemberStatus;
  reason: string;
  sanctionType?: AdminSanctionType;
  startedAt?: string;
  endedAt?: string;
};

export type AdminMemberStatusChangeResponse = {
  memberId: number;
  status: AdminMemberStatus;
  currentSanction?: AdminMemberSanctionSummary | null;
};

export type AdminMemberUsageSummary = {
  rentalCount: number;
  paymentAmount: number;
  reportCount: number;
  reviewCount: number;
  completedBookCount: number;
  readingBookCount: number;
};

export type AdminMemberRentalHistory = {
  rentalId: number;
  bookTitle: string;
  status: string;
  progressRate?: number;
  rentedAt: string;
};

export type AdminMemberPaymentHistory = {
  paymentId: number;
  bookTitle: string;
  originalAmount: number;
  discountAmount: number;
  paidAmount: number;
  status: string;
  paidAt: string;
};

export type AdminMemberReviewHistory = {
  reviewId: number;
  bookTitle: string;
  rating: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdminMemberReportHistory = {
  reportId: number;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
};

export type AdminMemberPointHistory = {
  pointHistoryId: number;
  pointType: string;
  pointAmount: number;
  description: string;
  createdAt: string;
};

export type AdminMemberSanctionHistory = AdminMemberSanctionSummary & {
  sanctionHistoryId: number;
  status?: string;
};

export type AdminMemberDetail = AdminMemberSummary & {
  phone?: string;
  birthDate?: string;
  gender?: string;
  createdAt?: string;
  usageSummary: AdminMemberUsageSummary;
  rentalHistories: AdminMemberRentalHistory[];
  paymentHistories: AdminMemberPaymentHistory[];
  reviewHistories: AdminMemberReviewHistory[];
  reportHistories: AdminMemberReportHistory[];
  pointHistories: AdminMemberPointHistory[];
  sanctionHistories: AdminMemberSanctionHistory[];
};

export type AdminMemberPointAdjustRequest = {
  pointAmount: number;
  description: string;
};

export type AdminMemberPointAdjustResponse = {
  pointHistoryId: number;
  pointAmount: number;
  pointType: string;
  pointBalance: number;
  createdAt: string;
};


export type PointHistoryQuery = {
  pointType?: string;
  page?: number;
  size?: number;
};

// API-POINT-001 (U-017). 필드명은 PointHistoryResponse.java 기준.
export type PointHistoryItem = {
  pointHistoryId: number;
  pointType: string;
  pointAmount: number;
  description: string;
  createdAt: string;
};

// PointSummaryResponse.java 기준. 포인트 잔액과 페이지네이션된 이력이 함께 내려온다.
export type PointSummary = {
  pointBalance: number;
  history: PageResponse<PointHistoryItem>;
};

export type CouponHistoryQuery = {
  status?: string;
  usableForBookId?: number;
  page?: number;
  size?: number;
};

export type CouponStatus = 'ISSUED' | 'USED' | 'EXPIRED';

// API-COUPON-001 (U-017). 필드명은 MyCouponResponse.java 기준.
export type CouponHistoryItem = {
  memberCouponId: number;
  couponName: string;
  couponType: string;
  benefitValue: number;
  benefitUnit: string;
  couponStatus: CouponStatus;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
  expiringYn: boolean;
};

export type CouponHistoryPage = PageResponse<CouponHistoryItem>;

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

// API-ATTEND-001~002 실제 백엔드 응답 DTO 기준 (AttendanceMonthResponse.java, AttendanceCheckResponse.java).
export type AttendanceMonthApiResponse = {
  attendanceDates: string[];
  todayCheckedYn: boolean;
  consecutiveDays: number;
};

export type IssuedCoupon = {
  memberCouponId: number;
  couponName: string;
};

export type AttendanceCheckApiResponse = {
  attendanceDate: string;
  consecutiveDays: number;
  issuedCoupons: IssuedCoupon[];
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

// API-READING-001 (U-028 최근 읽은 책)
export type RecentBooksQuery = {
  limit?: number;
};

// 필드명은 RecentBookResponse.java 기준.
export type RecentBookItem = {
  rentalId: number;
  bookId: number;
  title: string;
  coverImageUrl: string;
  currentPage: number;
  totalPages: number;
  progressRate: number;
  lastReadAt: string;
};

// API-PAYMENT-003 (U-018 결제 내역)
export type PaymentHistoryQuery = {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
};

// 필드명은 MyPaymentSummaryResponse.java 기준.
export type PaymentHistoryItem = {
  paymentId: number;
  bookId?: number;
  title: string;
  coverImageUrl?: string;
  rentalId?: number;
  originalAmount: number;
  couponDiscountAmount: number;
  pointUsedAmount: number;
  amount: number;
  paymentMethod?: string;
  paymentStatus: string;
  paidAt: string;
};

export type PaymentHistoryPage = PageResponse<PaymentHistoryItem>;

export type RentalPaymentRequest = {
  bookId: number;
  couponId?: number;
  pointAmount: number;
  paymentMethod: 'CARD';
};

export type RentalPaymentResult = {
  paymentId?: number;
  paymentNumber?: string;
  rentalId?: number;
  bookId?: number;
  bookTitle?: string;
  paymentType?: string;
  originalAmount?: number;
  saleAmount?: number;
  couponName?: string;
  usedCouponName?: string;
  couponDiscountAmount?: number;
  pointUsedAmount?: number;
  usedPointAmount?: number;
  finalAmount?: number;
  finalPaymentAmount?: number;
};

export type ChallengeType = 'DAILY' | 'TOTAL';

export type ChallengeRewardStatus = 'AVAILABLE' | 'RECEIVED' | 'NOT_AVAILABLE' | 'EXPIRED';

export type ChallengeItem = {
  challengeId?: number;
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  challengeType?: ChallengeType;
  type?: ChallengeType;
  goalAction?: string;
  currentCount?: number;
  goalCount?: number;
  progressRate?: number;
  progressPercent?: number;
  rewardName?: string;
  rewardType?: string;
  rewardAmount?: number;
  rewardStatus?: ChallengeRewardStatus;
  status?: string;
  startedAt?: string;
  startDate?: string;
  endsAt?: string;
  endDate?: string;
};

export type ChallengeListResponse = PageResponse<ChallengeItem> | ChallengeItem[];

export type ChallengeRewardResult = {
  challengeId?: number;
  rewardName?: string;
  rewardType?: string;
  rewardAmount?: number;
  rewardStatus?: ChallengeRewardStatus;
  message?: string;
};

// API-REPORT-004 (U-021 내 신고 내역)
export type ReportTargetType = 'BOOK' | 'REVIEW';
export type ReportStatus = 'WAITING' | 'PROCESSING' | 'DONE' | 'REJECTED';

export type ReportHistoryQuery = {
  targetType?: ReportTargetType;
  status?: ReportStatus;
  page?: number;
  size?: number;
};

export type ReportHistoryItem = {
  reportId: number;
  targetType: ReportTargetType;
  targetTitle?: string;
  reportType: string;
  status: ReportStatus;
  createdAt: string;
  processedAt?: string;
  content?: string;
  resultMessage?: string;
};

export type ReportHistoryPage = PageResponse<ReportHistoryItem>;

export type AdminReportTargetInfo = {
  targetId: number;
  title?: string;
  authorName?: string;
  reviewContent?: string;
  reviewStatus?: string;
  bookTitle?: string;
};

export type AdminReportReporter = {
  memberId: number;
  loginId: string;
  name: string;
};

export type AdminReportItem = {
  reportId: number;
  targetType: ReportTargetType;
  reporter: AdminReportReporter;
  targetInfo: AdminReportTargetInfo;
  reportType: string;
  content: string;
  status: ReportStatus;
  managerName?: string;
  createdAt: string;
  processedAt?: string;
  processResult?: string;
};

export type AdminReportListQuery = {
  targetType?: ReportTargetType;
  status?: ReportStatus;
  q?: string;
  page?: number;
  size?: number;
};

export type AdminReportSanctionRequest = {
  sanctionType: AdminSanctionType;
  startedAt: string;
  endedAt?: string;
  reason: string;
};

export type AdminReportStatusUpdateRequest = {
  status: ReportStatus;
  processResult?: string;
  hideReviewYn?: boolean;
  sanction?: AdminReportSanctionRequest;
};

export type AdminReportStatusUpdateResponse = {
  reportId: number;
  targetType: ReportTargetType;
  status: ReportStatus;
  processResult?: string;
  hideReviewYn?: boolean;
  processedAt?: string;
};

export type AdminReportPage = PageResponse<AdminReportItem>;

// API-REQUEST-001 (U-022 희망도서 신청)
export type BookRequestCreateRequest = {
  title: string;
  author: string;
  publisher: string;
  reason: string;
};

export type BookRequestCreateResponse = {
  requestId: number;
  requestCandidateId: number;
  requestStatus: string;
  requestCount: number;
};

// API-REQUEST-002 (U-023 희망도서 신청 내역)
export type BookRequestStatus = 'REQUESTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type BookRequestHistoryQuery = {
  status?: BookRequestStatus;
  page?: number;
  size?: number;
};

export type BookRequestHistoryItem = {
  requestId: number;
  title: string;
  author: string;
  publisher: string;
  reason?: string;
  createdAt: string;
  status: BookRequestStatus;
  requestCount: number;
  approvedBookId?: number;
  rejectReason?: string;
};

export type BookRequestHistoryPage = PageResponse<BookRequestHistoryItem>;

// API-RENTAL-003 (U-010 내 대여 현황). 필드명은 MyRentalSummaryResponse.java 기준.
export type RentalStatus = 'READY' | 'READING' | 'OWNED';

export type MyRentalsQuery = {
  status?: RentalStatus;
  page?: number;
  size?: number;
};

export type MyRentalItem = {
  rentalId: number;
  bookId: number;
  title: string;
  coverImageUrl: string;
  rentalStatus: RentalStatus;
  rentalEndAt: string;
  currentPage: number;
  totalPages: number;
  progressRate: number;
};

export type MyRentalsPage = PageResponse<MyRentalItem>;

// API-VIEWER-001~005 (U-011 전자책 뷰어). 필드명은 ViewerPageResponse.java 등 기준.
export type ViewerPageData = {
  title: string;
  pageContent: string;
  totalPages: number;
  progressRate: number;
  bookmarkYn: boolean;
};

export type ProgressUpdateRequest = {
  currentPage: number;
  action?: string;
};

export type ProgressResult = {
  progressId: number;
  currentPage: number;
  progressRate: number;
  completedYn: boolean;
};

export type BookmarkItem = {
  bookmarkId: number;
  pageNo: number;
  createdAt: string;
};

export type BookmarkCreateRequest = {
  pageNo: number;
};

export type BookmarkDeleteResult = {
  deleted: boolean;
};

// API-NOTICE-001 (공지 목록 조회, GET /api/v1/notices). Query: page?, size?.
// 응답: 활성(noticeStatus=ACTIVE) 공지 목록과 내용.
// 상세 페이지의 이전글/다음글 탐색은 문서 스펙에 없는 프론트 자체 UI 요구사항.
export type NoticeListQuery = {
  page?: number;
  size?: number;
};

export type NoticeItem = {
  noticeId: number;
  title: string;
  content: string;
  createdAt: string;
};

export type NoticePage = PageResponse<NoticeItem>;

export type NoticeNeighbor = Pick<NoticeItem, 'noticeId' | 'title'>;

export type NoticeDetail = NoticeItem & {
  prevNotice: NoticeNeighbor | null;
  nextNotice: NoticeNeighbor | null;
};

// API-NOTI-001~002 (U-019 알림 내역). 알림 본문은 저장/반환하지 않고 제목, 유형, 연결 대상, 읽음 여부, 일시만 사용.
export type NotificationType =
  | 'RENTAL'
  | 'PAYMENT'
  | 'NOTICE'
  | 'EVENT'
  | 'REPORT'
  | 'BOOK_REQUEST'
  | 'COUPON'
  | 'CHALLENGE';

export type NotificationListQuery = {
  readYn?: boolean;
  notificationType?: NotificationType;
  page?: number;
  size?: number;
};

export type NotificationItem = {
  notificationId: number;
  notificationType: NotificationType;
  title: string;
  targetType?: string | null;
  targetId?: number | null;
  readYn: boolean;
  createdAt: string;
  readAt?: string | null;
};

export type NotificationPage = PageResponse<NotificationItem>;

export type NotificationReadResult = {
  notificationId: number;
  readYn: boolean;
  readAt: string;
  targetType?: string | null;
  targetId?: number | null;
};
