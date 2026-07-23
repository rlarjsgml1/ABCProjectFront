// 백엔드 API 요청/응답 관련 공통 타입 정의 모음 (회원, 도서, 대여, 결제, 알림 등)
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

export type CheckLoginIdResponse = {
  loginId: string;
  available: boolean;
};

// API-AUTH-003 (U-004 아이디 찾기). 필드명은 FindIdRequest/FindIdResponse.java 기준.
export type FindIdRequest = {
  name: string;
  email: string;
};

export type FindIdResponse = {
  found: boolean;
  loginId: string | null;
  joinedAt: string | null;
};

// 백엔드 미구현. ERD 문서 "13.12 비밀번호 재설정 정책" 기준으로 요청해둔 상태 (password_reset_code 테이블은 schema.sql에 이미 존재).
export type PasswordResetRequestPayload = {
  loginId: string;
  name: string;
  email: string;
};

// 회원 존재 여부를 노출하지 않기 위해 항상 200 OK로 동일한 message를 반환하는 정책.
export type PasswordResetRequestResponse = {
  message: string;
};

export type PasswordResetVerifyPayload = {
  loginId: string;
  code: string;
};

export type PasswordResetVerifyResponse = {
  resetToken: string;
};

export type PasswordResetConfirmPayload = {
  resetToken: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordResetConfirmResponse = {
  changedAt: string;
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

export type AdminSanctionType = 'ACCOUNT_SUSPENSION' | 'RENTAL_BAN' | 'REVIEW_BAN';

export type AdminMemberListQuery = {
  q?: string;
  status?: AdminMemberStatus;
  role?: AdminMemberRole;
  gradeId?: number;
  page?: number;
  size?: number;
};

// 목록·상세 공통 — 만료된 제재나 상세 사유는 포함하지 않는 현재 유효 제재 최소 요약이다.
export type AdminMemberSanctionSummary = {
  sanctionType?: AdminSanctionType | string;
  endedAt?: string;
};

export type AdminMemberSummary = {
  memberId: number;
  loginId: string;
  name: string;
  maskedEmail: string;
  maskedPhone: string;
  role: AdminMemberRole;
  status: AdminMemberStatus;
  gradeName?: string;
  activeSanctions: AdminMemberSanctionSummary[];
  createdAt?: string;
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

// 상세 DEFAULT 탭 프로필 — 목록과 달리 마스킹 없이 email/phone/birthDate/gender 원문을 포함한다.
export type AdminMemberProfile = {
  memberId: number;
  loginId: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  role: AdminMemberRole;
  status: AdminMemberStatus;
  gradeName?: string;
  createdAt?: string;
};

export type AdminMemberUsageSummary = {
  pointBalance: number;
  rentalCount: number;
  paymentCount: number;
  reportCount: number;
  activeSanctions: AdminMemberSanctionSummary[];
};

// GET /admin/members/{id}?tab=DEFAULT(생략 시 기본값) 응답. 이력 배열은 이 응답에 없다 — 각 탭 API로 별도 조회한다.
export type AdminMemberDetail = {
  memberId: number;
  profile: AdminMemberProfile;
  usageSummary: AdminMemberUsageSummary;
};

export type AdminMemberDetailTab = 'DEFAULT' | 'RENTALS' | 'PAYMENTS' | 'REPORTS' | 'POINTS' | 'SANCTIONS';

// tab=RENTALS/PAYMENTS/REPORTS/POINTS/SANCTIONS 공통 응답 봉투. profile 필드는 구조 자체에 없다.
export type AdminMemberTabResponse<T> = {
  memberId: number;
  tab: PageResponse<T>;
};

export type AdminMemberRentalHistory = {
  rentalId: number;
  bookId: number;
  bookTitle: string;
  rentalStatus: string;
  rentalStartAt?: string;
  rentalEndAt?: string;
  createdAt?: string;
};

export type AdminMemberPaymentHistory = {
  paymentId: number;
  rentalId?: number;
  bookId: number;
  bookTitle: string;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string;
};

// reportSourceType: BOOK_REPORT / REVIEW_REPORT — 도서/리뷰 신고를 하나의 탭으로 합쳐 제공한다.
export type AdminMemberReportHistory = {
  reportId: number;
  reportSourceType: string;
  reportType: string;
  status: string;
  processedAt?: string;
  createdAt?: string;
};

export type AdminMemberPointHistory = {
  pointHistoryId: number;
  pointType: string;
  pointAmount: number;
  description: string;
  createdAt?: string;
};

export type AdminMemberSanctionHistory = {
  sanctionHistoryId: number;
  sanctionType: string;
  reason?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
};

// requestId는 회원별 멱등 키(UUID) — 같은 memberId+requestId 재요청은 최초 성공 응답을 그대로 반환한다.
export type AdminPointAdjustRequest = {
  pointAmount: number;
  description: string;
  requestId: string;
};

export type AdminPointAdjustResponse = {
  pointHistoryId: number;
  pointAmount: number;
  pointType: string;
  pointBalance: number;
  createdAt?: string;
};

export type AdminCouponType = 'PERCENT_DISCOUNT' | 'AMOUNT_DISCOUNT';

export type AdminCouponBenefitUnit = 'PERCENT' | 'AMOUNT';

export type AdminCouponStatus = 'ACTIVE' | 'INACTIVE';

export type AdminCouponListQuery = {
  status?: AdminCouponStatus;
  couponType?: AdminCouponType;
  page?: number;
  size?: number;
};

export type AdminCouponSummary = {
  couponId: number;
  couponName: string;
  couponType: AdminCouponType;
  benefitValue: number;
  benefitUnit: AdminCouponBenefitUnit;
  validDays: number;
  status: AdminCouponStatus;
  issuedCount?: number;
  usedCount?: number;
  createdAt?: string;
};

export type AdminCouponCreateRequest = {
  couponName: string;
  couponType: AdminCouponType;
  benefitValue: number;
  benefitUnit: AdminCouponBenefitUnit;
  validDays: number;
  status: AdminCouponStatus;
};

export type AdminCouponCreateResponse = {
  couponId: number;
};

export type AdminCouponIssueRequest = {
  memberIds: number[];
  quantity: number;
};

export type AdminCouponIssueResponse = {
  issuedCount: number;
};

export type AdminChallengeType = 'DAILY' | 'TOTAL';

export type AdminChallengeStatus = 'ACTIVE' | 'INACTIVE';

export type AdminChallengeRewardType = 'POINT' | 'coupon';

export type AdminChallengeListQuery = {
  challengeType?: AdminChallengeType;
  status?: AdminChallengeStatus;
  page?: number;
  size?: number;
};

export type AdminChallengeRewardItem = {
  rewardId?: number;
  rewardType: AdminChallengeRewardType;
  pointAmount?: number;
  couponId?: number;
  couponName?: string;
  rewardQuantity: number;
};

export type AdminChallengeSummary = {
  challengeId: number;
  challengeName: string;
  challengeType: AdminChallengeType;
  targetAction: string;
  targetCount: number;
  status: AdminChallengeStatus;
  participantCount: number;
  completedCount: number;
  rewardPoint?: number;
  rewards: AdminChallengeRewardItem[];
  startedAt?: string;
  endedAt?: string;
};

export type AdminChallengeUpdateRequest = {
  challengeName: string;
  challengeType: AdminChallengeType;
  targetAction: string;
  targetCount: number;
  status: AdminChallengeStatus;
  rewards: AdminChallengeRewardItem[];
};

export type AdminChallengeUpdateResponse = {
  challengeId: number;
};

// A-015 도서관 위치 관리. 백엔드 미구현 (AdminLibraryController 없음, API-ADMIN-LIBRARY-001~003 스펙으로 요청해둔 상태).
export type AdminLibraryStatus = 'ACTIVE' | 'INACTIVE';

export type AdminLibraryHoldingStatus = 'AVAILABLE' | 'UNAVAILABLE';

export type AdminLibraryListQuery = {
  q?: string;
  status?: AdminLibraryStatus;
  page?: number;
  size?: number;
};

export type AdminLibrarySummary = {
  libraryId: number;
  libraryName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: AdminLibraryStatus;
  bookCount: number;
};

export type AdminLibraryUpdateRequest = {
  libraryName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: AdminLibraryStatus;
};

export type AdminLibraryUpdateResponse = {
  libraryId: number;
};

export type AdminLibraryBookMapping = {
  bookId: number;
  holdingStatus: AdminLibraryHoldingStatus;
};

export type AdminLibraryBooksUpdateRequest = {
  books: AdminLibraryBookMapping[];
};

export type AdminLibraryBooksUpdateResponse = {
  libraryId: number;
  mappedCount: number;
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
};

export type ReadingStatisticsData = {
  periodType: ReadingStatisticsPeriodType;
  baseDate?: string;
  summary: ReadingStatisticsSummary;
  environmentMetrics: ReadingEnvironmentMetrics;
  trendPoints: ReadingTrendPoint[];
  generatedAt?: string;
};

// 실제 백엔드 응답(UserReadingStatisticResponse.java) 원본 모양. summary/environmentMetrics 껍데기 없이 필드가 최상위에 있고,
// readingTrend 각 항목은 완독 수(count) 하나만 준다 — 프론트 표시용 ReadingStatisticsData와 모양이 다르다.
export type RawReadingStatisticsResponse = {
  periodType: ReadingStatisticsPeriodType;
  periodStartDate?: string;
  periodEndDate?: string;
  rentalCount: number;
  readBookCount: number;
  reviewCount: number;
  favoriteCount: number;
  carbonSavedKg: number;
  treeSavedCount: number;
  readingTrend: Array<{ label: string; periodStartDate?: string; periodEndDate?: string; count: number }>;
  updatedAt?: string;
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

export type AdminBookStatus = 'AVAILABLE' | 'HIDDEN' | 'INACTIVE';

export type AdminBookRentalType = 'FREE' | 'PAID';

export type AdminBookListQuery = {
  q?: string;
  categoryId?: number;
  rentalType?: AdminBookRentalType;
  status?: AdminBookStatus;
  page?: number;
  size?: number;
};

export type AdminBookCategoryItem = {
  categoryId: number;
  categoryName: string;
};

export type AdminBookSummary = {
  bookId: number;
  title: string;
  isbn?: string;
  publisherName?: string;
  authorNames: string[];
  categories: AdminBookCategoryItem[];
  rentalType: AdminBookRentalType;
  rentalPrice: number;
  defaultRentalDays: number;
  coverImageUrl?: string;
  status: AdminBookStatus;
  createdAt?: string;
};

export type AdminBookDetailAuthor = {
  authorId: number;
  authorName: string;
  status: string;
};

export type AdminBookDetailCategory = {
  categoryId: number;
  categoryName: string;
  status: string;
};

export type AdminBookDetail = {
  bookId: number;
  title: string;
  isbn?: string;
  publisherName?: string;
  authors: AdminBookDetailAuthor[];
  categories: AdminBookDetailCategory[];
  rentalType: AdminBookRentalType;
  rentalPrice: number;
  defaultRentalDays: number;
  coverImageUrl?: string;
  detail?: {
    description?: string;
    tableOfContents?: string;
    publisherReview?: string;
  };
  status: AdminBookStatus;
  createdAt?: string;
  updatedAt?: string;
};

// no-op(동일 상태 재저장)일 때는 reason 없이도 200 처리된다 — 실제 변경일 때만 Service가 조건부로 필수 검증한다.
export type AdminBookStatusChangeRequest = {
  status: AdminBookStatus;
  reason?: string;
};

export type AdminBookStatusChangeResponse = {
  bookId: number;
  status: AdminBookStatus;
};

// 등록(002)·수정(003)이 동일한 요청 계약을 쓴다. status/keywords는 백엔드에 필드 자체가 없다.
export type AdminBookSaveRequest = {
  title: string;
  isbn?: string;
  publisherName: string;
  authors: string[];
  categoryIds: number[];
  rentalType: AdminBookRentalType;
  rentalPrice: number;
  defaultRentalDays: number;
  coverImageUrl?: string;
  description?: string;
  tableOfContents?: string;
  publisherReview?: string;
};

export type AdminBookSaveResponse = {
  bookId: number;
  status: AdminBookStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminBookCreateRequest = AdminBookSaveRequest;
export type AdminBookCreateResponse = AdminBookSaveResponse;
export type AdminBookUpdateRequest = AdminBookSaveRequest;
export type AdminBookUpdateResponse = AdminBookSaveResponse;

export type AdminBookEpubUploadResponse = {
  bookId: number;
  fileName: string;
  fileSize: number;
  sha256: string;
  epubVersion: number;
};

// GET /api/v1/books/search 실제 응답 봉투. BookSearchResponse.java 기준 (content는 page 안에 들어있다).
export type BookSearchResponse = {
  keyword: string;
  totalCount: number;
  page: PageResponse<BookCard>;
};

// API-BOOK-006 (U-025 추천 도서). 필드명은 BookRecommendationResponse.java 기준.
export type BookRecommendationType = 'AUTHOR' | 'CATEGORY' | 'KEYWORD';

export type BookRecommendationQuery = {
  baseBookId?: number;
  type?: BookRecommendationType;
  limit?: number;
};

export type BookRecommendationResponse = {
  recommendationType: string;
  books: BookCard[];
};

// API-LIBRARY-001 (U-024 책 보유 도서관 위치). GET /books/{bookId}/libraries.
// region은 필수(2자리 지역코드). 필드명은 LibrarySearchResponse.java 기준 — 정보나루 종이책 소장 도서관 검색 결과다.
export type LibrarySearchQuery = {
  region: string;
  dtlRegion?: string;
  page?: number;
  size?: number;
  latitude?: number;
  longitude?: number;
};

export type LibraryResultItem = {
  libraryCode: string;
  libraryName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  homepageUrl?: string;
  closedDays?: string;
  operationTime?: string;
  holding: boolean;
  loanAvailable?: boolean;
};

export type LibrarySearchResponse = {
  bookId: number;
  title: string;
  coverImageUrl?: string;
  region: string;
  source: string;
  stale: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  libraries: LibraryResultItem[];
  warnings: string[];
};

export type Category = {
  categoryId: number;
  parentCategoryId?: number | null;
  name: string;
  categoryName?: string;
  displayOrder?: number;
  children?: Category[];
};

export type AdminCollectionType = 'SERIES' | 'EVENT';

export type AdminCollectionStatus = 'ACTIVE' | 'HIDDEN' | 'ENDED';

// 목록(001) 항목. 도서 매핑 상세는 이 응답에 없다 — 상세는 getAdminCollectionDetail로 조회한다.
export type AdminCollectionItem = {
  collectionId: number;
  name: string;
  collectionType: AdminCollectionType;
  discountRate?: number;
  startDate?: string;
  endDate?: string;
  status: AdminCollectionStatus;
  mappedCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCollectionBookItem = {
  collectionBookId: number;
  bookId: number;
  title: string;
  status: string;
  displayOrder?: number;
};

// 상세 조회(GET /admin/collections/{id}) 응답. 명세 표에는 번호가 없지만 실제 존재하는 엔드포인트다.
export type AdminCollectionDetail = {
  collectionId: number;
  name: string;
  collectionType: AdminCollectionType;
  discountRate?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: AdminCollectionStatus;
  createdByMemberId?: number;
  createdAt?: string;
  updatedAt?: string;
  books: AdminCollectionBookItem[];
};

export type AdminCollectionListQuery = {
  collectionType?: AdminCollectionType;
  status?: AdminCollectionStatus;
  page?: number;
  size?: number;
};

// 생성(POST)·수정(PUT)이 동일한 요청 계약을 쓴다. displayOrder는 이 요청에 없다(컬렉션 자체가 아니라
// 도서 매핑 단위 필드).
export type AdminCollectionSaveRequest = {
  name: string;
  collectionType: AdminCollectionType;
  discountRate?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: AdminCollectionStatus;
};

export type AdminCollectionSaveResponse = {
  collectionId: number;
  status: AdminCollectionStatus;
  createdAt?: string;
  updatedAt?: string;
};

// SERIES는 displayOrder가 필수(양수), EVENT는 null이어야 한다 — Service에서 검증한다.
export type AdminCollectionBooksSaveRequest = {
  books: Array<{
    bookId: number;
    displayOrder?: number;
  }>;
};

export type AdminCollectionBooksSaveResponse = {
  collectionId: number;
  mappedCount: number;
};

// status와 removeBookIds 중 하나 이상 필수 — 둘 다 optional이라 Service가 검증한다. reason 필드는 없다.
export type AdminCollectionPatchRequest = {
  status?: AdminCollectionStatus;
  removeBookIds?: number[];
};

export type AdminCollectionPatchResponse = {
  collectionId: number;
  status: AdminCollectionStatus;
  mappedCount: number;
};

export type CollectionType = 'SERIES' | 'EVENT';

export type CollectionStatus = 'ACTIVE' | 'HIDDEN' | 'ENDED';

export type CollectionSummary = {
  collectionId: number;
  collectionName: string;
  collectionType: CollectionType;
  discountRate?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  previewBooks: BookCard[];
};

export type CollectionDetail = {
  collectionId: number;
  collectionName: string;
  collectionType: CollectionType;
  discountRate?: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  books: BookCard[];
};

export type CollectionListQuery = {
  collectionType?: CollectionType;
  status?: CollectionStatus;
  page?: number;
  size?: number;
  previewSize?: number;
};

// 백엔드가 정렬 파라미터를 받지 않고 항상 등록 최신순으로 고정 정렬한다 (FavoriteBookRepository.findMyFavorites 참고).
export type FavoriteSort = 'recent';

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
// 백엔드 MemberGradeSummaryResponse와 동일한 중첩 구조. 최고 등급(도토리)에서는 nextGradeId/nextGradeName이 null이다.
export type MembershipGradeSummary = {
  gradeId: number;
  gradeName: string;
  gradeLevel: number;
  nextGradeId?: number;
  nextGradeName?: string;
  currentPaymentAmount: number;
  targetPaymentAmount?: number;
  progressRate: number;
};

export type UserProfile = {
  loginId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  role: string;
  status: string;
  grade?: MembershipGradeSummary;
  gradeBenefitText?: string;
  remainingGradePeriodDays?: number;
  pointBalance?: number;
  couponCount?: number;
  rentalCount?: number;
  completedBookCount?: number;
  favoriteCount?: number;
  unreadNotificationCount?: number;
  reviewCount?: number;
};

// API-ME-002에서 수정 가능한 필드만 포함한다. loginId, birthDate, role, status, gender는 수정하지 않는다(백엔드가 gender를 null만 허용).
export type UserProfileUpdateRequest = {
  name: string;
  email: string;
  phone: string;
};

// API-ME-003 비밀번호 변경 요청 DTO다.
export type UserPasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

// API-ME-004 회원 탈퇴. 진행 중 대여가 있으면 백엔드가 거부한다.
export type UserWithdrawalRequest = {
  currentPassword: string;
  withdrawalReason?: string;
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
  progressRate: number;
  completedYn?: boolean;
  contentReady?: boolean;
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
  memberCouponId?: number;
  pointAmount: number;
  cardApprovalToken: string;
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
  amount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
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

export type AdminBookRequestCandidateQuery = {
  status?: BookRequestStatus;
  q?: string;
  page?: number;
  size?: number;
};

export type AdminBookRequestApplicantSummary = {
  memberId: number;
  loginId: string;
  name: string;
  reason?: string;
  requestedAt: string;
};

export type AdminBookRequestCandidate = {
  candidateId: number;
  title: string;
  author: string;
  publisher: string;
  status: BookRequestStatus;
  requestCount: number;
  firstRequestedAt: string;
  latestRequestedAt?: string;
  applicants: AdminBookRequestApplicantSummary[];
  rejectReason?: string;
  approvedBookId?: number;
};

export type AdminBookRequestCandidatePage = PageResponse<AdminBookRequestCandidate>;

export type AdminBookRequestStatusUpdateRequest = {
  status: BookRequestStatus;
  approvedBookId?: number;
  rejectReason?: string;
};

export type AdminBookRequestStatusUpdateResponse = {
  candidateId: number;
  status: BookRequestStatus;
  affectedRequestCount: number;
  approvedBookId?: number;
  rejectReason?: string;
};

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
  progressRate: number;
  completedYn?: boolean;
  contentReady?: boolean;
};

export type MyRentalsPage = PageResponse<MyRentalItem>;

export type EpubLocator = {
  epubVersion: number;
  cfi: string;
  chapterHref?: string | null;
  spineIndex?: number | null;
  progression: number;
};

export type ViewerProgress = Omit<EpubLocator, 'epubVersion'> & {
  revision: number;
  completedYn: boolean;
};

export type ViewerSessionData = {
  title: string;
  epubVersion: number;
  contentReady: boolean;
  progress: ViewerProgress | null;
};

export type ProgressUpdateRequest = EpubLocator & {
  spineIndex: number;
  atEnd: boolean;
  expectedRevision: number;
};

export type ProgressResult = EpubLocator & {
  progressId: number;
  completedYn: boolean;
  revision: number;
};

export type BookmarkItem = EpubLocator & {
  bookmarkId: number;
  createdAt: string;
};

export type BookmarkCreateRequest = EpubLocator & {
  spineIndex: number;
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

// API-REVIEW-001~004 (U-013 리뷰/별점, U-008 안의 패널/모달로 구현)
export type ReviewStatus = 'ACTIVE' | 'DELETED';

export type ReviewItem = {
  reviewId: number;
  ratingId: number | null;
  bookId: number;
  memberId: number;
  memberName: string;
  ratingScore: number;
  content: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export type ReviewListQuery = {
  page?: number;
  size?: number;
  sort?: string;
};

export type ReviewListResponse = {
  summary: ReviewSummary;
  reviews: PageResponse<ReviewItem>;
};

export type ReviewCreateRequest = {
  bookId: number;
  ratingScore: number;
  content: string;
};

export type ReviewUpdateRequest = {
  content: string;
};

export type ReviewDeleteResult = {
  reviewId: number;
  status: ReviewStatus;
};

// API-ADMIN-DASHBOARD-001 (A-001 관리자 대시보드). AdminDashboardResponse.java 기준.
export type AdminDashboardStatistics = {
  totalMemberCount: number;
  sanctionedMemberCount: number;
  activeBookCount: number;
  totalRentalCount: number;
  freeRentalCount: number;
  paidRentalCount: number;
  totalReadBookCount: number;
  totalPaymentAmount: number;
  reviewCount: number;
  reportCount: number;
  carbonSavedKg: number;
  treeSavedCount: number;
};

export type AdminRecentPayment = {
  paymentId: number;
  memberName: string;
  amount: number;
  paymentStatus: string;
  paidAt: string;
};

export type AdminRecentReport = {
  reportId: number;
  targetType: 'BOOK' | 'REVIEW';
  targetId: number;
  targetTitle: string;
  reportType: string;
  reportStatus: string;
  reporterName: string;
  createdAt: string;
};

export type AdminRecentBookRequest = {
  candidateId: number;
  title: string;
  author: string;
  publisher: string;
  requestCount: number;
  candidateStatus: string;
  firstRequestedAt: string;
};

export type AdminDashboardResponse = {
  statistics: AdminDashboardStatistics;
  recentPayments: AdminRecentPayment[];
  recentReports: AdminRecentReport[];
  recentBookRequests: AdminRecentBookRequest[];
};

// API-ADMIN-RENTAL-001 (A-008 대여 현황 관리). controller 미구현 — mock/fallback 사용. 조회 전용.
export type AdminRentalStatus = 'READY' | 'READING' | 'OWNED';

export type AdminRentalListQuery = {
  q?: string;
  memberId?: number;
  status?: AdminRentalStatus;
  page?: number;
  size?: number;
};

export type AdminRentalItem = {
  rentalId: number;
  memberId: number;
  memberName: string;
  bookId: number;
  bookTitle: string;
  status: AdminRentalStatus;
  createdAt: string;
  firstReadAt?: string;
  endedAt?: string;
  progressPercent: number;
  paymentSummary?: string;
};

export type AdminRentalPage = PageResponse<AdminRentalItem>;

// API-ADMIN-PAYMENT-001 (A-009 결제 관리). controller 미구현 — mock/fallback 사용. 조회 전용.
export type AdminPaymentListQuery = {
  q?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
};

export type AdminPaymentItem = {
  paymentId: number;
  memberName: string;
  bookTitle: string;
  rentalId: number;
  paymentMethod: string;
  grossAmount: number;
  couponDiscount: number;
  couponName?: string;
  pointDiscount: number;
  amount: number;
  paymentStatus: 'PAID';
  paidAt: string;
};

export type AdminPaymentPage = PageResponse<AdminPaymentItem>;

// API-ADMIN-NOTICE-001~003 (A-012 공지 관리).
export type AdminNoticeStatus = 'ACTIVE' | 'HIDDEN';

export type AdminNoticeListQuery = {
  status?: AdminNoticeStatus;
  page?: number;
  size?: number;
};

export type AdminNoticeItem = {
  noticeId: number;
  title: string;
  content: string;
  status: AdminNoticeStatus;
  createdAt: string;
  updatedAt?: string;
};

export type AdminNoticePage = PageResponse<AdminNoticeItem>;

export type AdminNoticeSaveRequest = {
  title: string;
  content: string;
  status: AdminNoticeStatus;
  notifyYn: boolean;
};

// POST 등록 전용 응답. notifyYn=true인 신규 등록에서 실제 알림을 받은 회원 수(notifyCreatedCount)가 추가된다.
// PUT(수정) 응답은 알림을 재발송하지 않으므로 이 필드가 없는 AdminNoticeItem을 그대로 사용한다.
export type AdminNoticeCreateResponse = AdminNoticeItem & {
  notifyCreatedCount: number;
};

// API-ADMIN-STAT-001 (A-016 통계 관리). 실제 backend 연동됨(AdminStatisticController). 현재 periodType=TOTAL(+ageBand 미지정/ALL)만 지원, 그 외 조합은 404.
export type AdminStatisticsAgeBand = 'ALL' | '10S' | '20S' | '30S' | '40S' | '50_PLUS';

export type AdminStatisticsQuery = {
  periodType: ReadingStatisticsPeriodType;
  baseDate?: string;
  ageBand?: AdminStatisticsAgeBand;
};

export type AdminStatisticsData = {
  periodType: ReadingStatisticsPeriodType;
  ageBand?: AdminStatisticsAgeBand;
  statistics: AdminDashboardStatistics;
  trendPoints: ReadingTrendPoint[];
};

// API-ADMIN-AUDIT-001 (A-017 관리자 감사 로그). 실제 backend 연동됨(AdminAuditLogController). 조회 전용.
export type AdminAuditLogQuery = {
  actionType?: string;
  targetType?: string;
  targetId?: number;
  page?: number;
  size?: number;
};

export type AdminAuditLogItem = {
  auditLogId: number;
  adminName: string;
  actionType: string;
  targetType: string;
  targetId: number;
  targetLabel?: string;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  createdAt: string;
};

export type AdminAuditLogPage = PageResponse<AdminAuditLogItem>;
