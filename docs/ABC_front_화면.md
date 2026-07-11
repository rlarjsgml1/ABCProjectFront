# ABC Front 화면 정의서

> 대상: ABC User Front 화면 구현  
> 세팅 문서: `/mnt/c/Acorn폴더자료/화면설계/ABC_front_세팅.md`  
> 목적: Front 구현자가 화면, route, API 연결, Validation, 보강 필요사항만 빠르게 확인하기 위한 문서

---

## 1. 이 문서의 범위

이 문서는 Front 화면 구현 기준만 다룬다.

| 포함 | 제외 |
|---|---|
| User 화면 목록 | Node/Vite 설치 상세 |
| route 기준 | 프로젝트 생성 명령어 |
| 화면 이동 흐름 | 서버 설정 |
| 화면별 API 연결 | 서버/인프라 설정 |
| Front validation | Admin 상세 구현 |
| 구현 제외 기능 | 내부 리뷰/메타 평가 |
| 보강 필요사항 | API 상세 DTO 전체 복사 |

세팅은 `ABC_front_세팅.md`를 먼저 본다. API 상세 request/response는 팀에서 공유한 API 명세를 기준으로 확인한다.

---

## 2. 구현 결론

Front는 User 화면을 먼저 완성한다.

```text
React + Vite + TypeScript + React Router + Axios + CSS Modules
```

현재 구현 우선순위:

1. 공통 Layout/Header/Footer/Button/BookCard
2. U-001 메인
3. U-006 도서 목록
4. U-008 도서 상세
5. U-003 로그인 / U-002 회원가입 / U-004 아이디 찾기
6. U-009 대여/결제
7. U-010 내 대여 현황
8. U-011 전자책 뷰어
9. U-014 마이페이지
10. 나머지 회원 활동 화면
11. Admin은 `/admin` placeholder와 폴더 구조만 먼저 둔다

---

## 3. 참고 문서

Front 구현자가 화면 구현 중 직접 볼 문서만 남긴다.

| 문서 | 언제 보는가 |
|---|---|
| `/mnt/c/Acorn폴더자료/화면설계도/01-공통-화면설계기준.md` | Header/Footer, 공통 상태, UI 기준 확인 |
| `/mnt/c/Acorn폴더자료/화면설계도/02-User-상세화면설계도.md` | User 화면별 구성/버튼/상태 확인 |
| `/mnt/c/Acorn폴더자료/화면설계도/04-전체-화면이동흐름.md` | 화면 이동 흐름 확인 |
| API 명세 | API URL, Method, request/response 확인 |

---

## 4. 공통 Front 규칙

### 4.1 API 호출

- API 호출은 `src/api/*Api.ts` 안에서만 한다.
- 컴포넌트에서 직접 `fetch` 또는 `axios` 호출 금지.
- API base URL은 `.env`의 `VITE_API_BASE_URL`을 사용한다.
- 회원 API는 `Authorization: Bearer {accessToken}`를 붙인다.
- API 실패 시 `message`를 먼저 보여준다.
- validation 오류는 `errors[].field` 기준으로 input 하단에 보여준다.

### 4.2 공통 응답 타입

```ts
export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
```

### 4.3 공통 UI 상태

| 상태 | 표시 |
|---|---|
| Loading | `데이터를 불러오는 중입니다.` 또는 skeleton |
| Empty | 빈 상태 문구와 다음 행동 버튼 |
| Error | API `message` 표시 |
| 로그인 필요 | 로그인 안내 모달 후 `/login` 이동 |
| 권한 없음 | `접근 권한이 없습니다.` 표시 후 홈/이전 화면 |
| 입력 오류 | field 하단 오류 문구 |

---

## 5. 공통 Layout

### 5.1 User Header

비회원:

| 요소 | 이동/동작 |
|---|---|
| `ABC` | `/` |
| 도서 | `/books` |
| 카테고리 | `/books?categoryId={id}` |
| 무료 도서 | `/books?rentalType=FREE` |
| 유료 도서 | `/books?rentalType=PAID` |
| 추천 도서 | `/books?section=recommend` |
| 검색창 | `/search?q={keyword}` |
| 로그인 | `/login` |
| 회원가입 | `/signup` |

회원 추가 메뉴:

| 요소 | 이동/동작 |
|---|---|
| 내 서재 | `/me/rentals` |
| 출석체크 | `/me/attendance` |
| 챌린지 | `/me/challenges` |
| 알림 아이콘 | `/me/notifications` |
| 마이페이지 | `/me` |
| 로그아웃 | token 제거 후 `/` |

### 5.2 먼저 만들 공통 컴포넌트

```text
UserLayout
ProtectedRoute
Header
Footer
Button
Modal
Badge
Pagination
BookCard
LoadingState
EmptyState
ErrorState
```

---

## 6. Route 기준

`U-005`와 `U-020`은 만들지 않는다.

| ID | 화면 | Route | 권한 | 파일 |
|---|---|---|---|---|
| U-001 | 메인/홈 | `/` | 비회원/회원 | `HomePage.tsx` |
| U-002 | 회원가입 | `/signup` | 비회원 | `SignupPage.tsx` |
| U-003 | 로그인 | `/login` | 비회원 | `LoginPage.tsx` |
| U-004 | 아이디 찾기 | `/find-id` | 비회원 | `FindIdPage.tsx` |
| U-006 | 도서 목록 | `/books` | 비회원/회원 | `BooksPage.tsx` |
| U-007 | 도서 검색 결과 | `/search` | 비회원/회원 | `SearchResultsPage.tsx` |
| U-008 | 도서 상세 | `/books/:bookId` | 비회원/회원 | `BookDetailPage.tsx` |
| U-009 | 대여/결제 확인 | `/books/:bookId/rent` | 회원 | `RentPaymentPage.tsx` |
| U-010 | 내 대여 현황 | `/me/rentals` | 회원 | `MyRentalsPage.tsx` |
| U-011 | 전자책 뷰어 | `/viewer/:rentalId` | 회원 | `EbookViewerPage.tsx` |
| U-012 | 즐겨찾기 | `/me/favorites` | 회원 | `FavoritesPage.tsx` |
| U-014 | 마이페이지 | `/me` | 회원 | `MyPage.tsx` |
| U-015 | 회원정보 수정 | `/me/profile` | 회원 | `ProfileEditPage.tsx` |
| U-016 | 출석체크 | `/me/attendance` | 회원 | `AttendancePage.tsx` |
| U-017 | 포인트/쿠폰 | `/me/points-coupons` | 회원 | `PointsCouponsPage.tsx` |
| U-018 | 결제 내역 | `/me/payments` | 회원 | `PaymentsPage.tsx` |
| U-019 | 알림 내역 | `/me/notifications` | 회원 | `NotificationsPage.tsx` |
| U-021 | 내 신고 내역 | `/me/reports` | 회원 | `ReportsPage.tsx` |
| U-022 | 희망도서 신청 | `/me/book-requests/new` | 회원 | `BookRequestPage.tsx` |
| U-023 | 희망도서 신청 내역 | `/me/book-requests` | 회원 | `BookRequestHistoryPage.tsx` |
| U-024 | 책 보유 도서관 위치 | `/books/:bookId/libraries` | 비회원/회원 | `LibraryLocationPage.tsx` |
| U-025 | 추천 도서 | `/books/:bookId/recommendations` | 비회원/회원 | `RecommendationsPage.tsx` |
| U-026 | 독서 통계 | `/me/statistics` | 회원 | `ReadingStatsPage.tsx` |
| U-027 | 챌린지 | `/me/challenges` | 회원 | `ChallengesPage.tsx` |
| U-028 | 최근 읽은 책 | `/me/recent-books` | 회원 | `RecentBooksPage.tsx` |
| A-001 | 관리자 대시보드 | `/admin` | 관리자 | `pages/admin/AdminDashboardPage.tsx` |

로그인 성공 분기:

- `USER` → `/` 또는 로그인 전 목적 화면
- `ADMIN` → 관리자 대시보드. User Front에서는 redirect만 처리
- 현재 Front 세팅에서는 `/admin` placeholder만 먼저 확인한다. 실제 관리자 권한 보호는 인증 구현 시 적용한다.
- `SANCTIONED`, `WITHDRAWN`, `DEACTIVATED` → 계정 상태 안내

---

## 7. 전체 화면 흐름

```text
비회원
└── U-001 메인
    ├── U-006 도서 목록 → U-008 도서 상세 → U-024 보유 도서관
    ├── U-007 검색 결과 → U-008 도서 상세
    ├── U-002 회원가입 → U-003 로그인
    └── U-003 로그인 → U-004 아이디 찾기

회원 대여/뷰어
U-008 도서 상세
└── U-009 대여/결제 확인
    ├── 무료 대여 → U-011 뷰어
    └── 유료 결제 → U-011 뷰어
        └── U-010 내 대여 현황

마이페이지
U-014 마이페이지
├── U-015 회원정보 수정
├── U-010 내 대여 현황
├── U-012 즐겨찾기
├── U-017 포인트/쿠폰
├── U-018 결제 내역
├── U-019 알림 내역
├── U-021 내 신고 내역
├── U-022 희망도서 신청
├── U-023 희망도서 신청 내역
├── U-026 독서 통계
├── U-027 챌린지
└── U-028 최근 읽은 책
```

---

## 8. 화면별 API 연결

상세 request/response field는 `api-spec(final).md`에서 확인한다. 이 표는 Front에서 어느 API module을 만들지 확인하는 용도다.

| 화면 | Method | Endpoint | 설명 |
|---|---|---|---|
| U-002 | POST | `/api/v1/auth/signup` | 회원가입 |
| U-003 | POST | `/api/v1/auth/login` | 로그인 |
| U-004 | POST | `/api/v1/auth/find-id` | 아이디 찾기 |
| U-014/U-015 | GET | `/api/v1/me` | 내 정보 조회 |
| U-015 | PATCH | `/api/v1/me` | 회원정보 수정 |
| U-015 | PATCH | `/api/v1/me/password` | 비밀번호 변경 |
| U-015 | DELETE | `/api/v1/me` | 회원 탈퇴 |
| U-001/U-006 | GET | `/api/v1/books` | 도서 목록 |
| U-007 | GET | `/api/v1/books/search` | 도서 검색 |
| U-008 | GET | `/api/v1/books/{bookId}` | 도서 상세 |
| U-001/U-008/U-025 | GET | `/api/v1/books/recommendations` | 추천 도서 |
| U-001/U-006 | GET | `/api/v1/categories` | 카테고리 |
| U-001/U-006 | GET | `/api/v1/collections` | 컬렉션 목록 |
| U-006 | GET | `/api/v1/collections/{collectionId}` | 컬렉션 상세 |
| U-024 | GET | `/api/v1/books/{bookId}/libraries` | 보유 도서관 |
| U-009 | POST | `/api/v1/rentals/free` | 무료 대여 |
| U-009 | POST | `/api/v1/rentals/paid` | 유료 대여 결제 |
| U-010/U-014 | GET | `/api/v1/me/rentals` | 내 대여 현황 |
| U-028 | GET | `/api/v1/me/recent-books` | 최근 읽은 책 |
| U-018 | GET | `/api/v1/me/payments` | 결제 내역 |
| U-011 | GET | `/api/v1/rentals/{rentalId}/pages/{pageNo}` | 뷰어 페이지 |
| U-011 | PUT | `/api/v1/rentals/{rentalId}/progress` | 읽기 진행 저장 |
| U-011 | POST | `/api/v1/rentals/{rentalId}/bookmarks` | 북마크 추가 |
| U-011 | DELETE | `/api/v1/rentals/{rentalId}/bookmarks/{bookmarkId}` | 북마크 삭제 |
| U-011 | GET | `/api/v1/rentals/{rentalId}/bookmarks` | 북마크 목록 |
| U-008 | GET | `/api/v1/books/{bookId}/reviews` | 리뷰 목록 |
| U-013 | POST | `/api/v1/reviews` | 리뷰/별점 작성 |
| U-013 | PATCH | `/api/v1/reviews/{reviewId}` | 리뷰 수정 |
| U-013 | DELETE | `/api/v1/reviews/{reviewId}` | 리뷰 삭제 |
| U-001/U-006/U-008 | POST | `/api/v1/me/favorites` | 즐겨찾기 등록 |
| U-001/U-006/U-008/U-012 | DELETE | `/api/v1/me/favorites/{bookId}` | 즐겨찾기 삭제 |
| U-012/U-014 | GET | `/api/v1/me/favorites` | 즐겨찾기 목록 |
| U-008 | POST | `/api/v1/reports/books` | 책 신고 |
| U-008 | POST | `/api/v1/reports/reviews` | 리뷰 신고 |
| U-021 | GET | `/api/v1/me/reports` | 내 신고 내역 |
| U-016 | POST | `/api/v1/me/attendance` | 출석 체크 |
| U-016 | GET | `/api/v1/me/attendance` | 출석 현황 |
| U-017 | GET | `/api/v1/me/points` | 포인트 이력 |
| U-009/U-017 | GET | `/api/v1/me/coupons` | 쿠폰 목록 |
| U-001/U-019 | GET | `/api/v1/notices` | 공지 목록 |
| U-019 | GET | `/api/v1/me/notifications` | 알림 목록 |
| U-019 | PATCH | `/api/v1/me/notifications/{notificationId}/read` | 알림 읽음 처리 |
| U-026 | GET | `/api/v1/me/statistics` | 독서 통계 |
| U-027 | GET | `/api/v1/challenges` | 챌린지 목록 |
| U-027 | POST | `/api/v1/challenges/{challengeId}/reward` | 챌린지 보상 |
| U-022 | POST | `/api/v1/book-requests` | 희망도서 신청 |
| U-023 | GET | `/api/v1/me/book-requests` | 희망도서 내역 |

---

## 9. 화면별 구현 메모

| 화면 | 구현 메모 |
|---|---|
| U-001 | 도서 섹션, 추천, 카테고리, 공지 요약을 보여준다. |
| U-002 | `birthDate` 필수. 약관 동의 저장 UI는 만들지 않는다. |
| U-003 | 로그인 성공 시 role에 따라 분기한다. |
| U-004 | 비밀번호 재설정 링크를 넣지 않는다. |
| U-006 | `AVAILABLE` 도서만 표시한다. 무료/유료/카테고리 필터를 둔다. |
| U-007 | 검색어가 비면 API 호출하지 않는다. 결과 없음이면 희망도서 신청 안내. |
| U-008 | 상세, 리뷰, 즐겨찾기, 신고 모달, 추천, 보유 도서관 연결을 조합한다. |
| U-009 | 무료/유료를 분기한다. 결제수단은 `CARD`만 표시한다. |
| U-010 | `READY`, `READING`, `OWNED`만 표시한다. 반납/연체 없음. |
| U-011 | 첫 진입 시 읽기 시작 처리. 북마크, 진행 저장, 나가기 제공. |
| U-012 | 즐겨찾기 목록. 빈 목록이면 도서 둘러보기 안내. |
| U-013 | U-008 안의 패널/모달로 구현한다. 독립 page로 만들지 않는다. |
| U-014 | 요약 카드와 개인 메뉴. 내 리뷰 탭은 API 보완 전 임시 구현 금지. |
| U-015 | 로그인 회원 정보 수정/비밀번호 변경/탈퇴. |
| U-016 | 출석 자체 포인트 없음. 쿠폰 보상 중심. |
| U-017 | 포인트/쿠폰 목록. 상세보기 화면과 포인트 소멸 UI 없음. |
| U-018 | `PAID` 결제만 표시. 환불/취소 없음. |
| U-019 | 알림 본문 없음. 행 클릭 시 읽음 처리 후 target 이동. 모두 읽기 보류. |
| U-021 | 책/리뷰 신고 내역만 표시. 회원 신고 없음. |
| U-022 | 제목, 저자, 출판사, 사유만 입력. ISBN 입력 없음. |
| U-023 | 회원별 신청 상태와 후보 신청자 수 표시. `IN_REVIEW`는 후보 상태 표시용. |
| U-024 | 지도 또는 주소 목록. 실물 대여/예약 버튼 없음. |
| U-025 | 추천 도서 목록. 도서 카드 클릭 시 U-008. |
| U-026 | 독서 통계. 탄소/나무 계산값은 API 결과 기준 표시. |
| U-027 | `DAILY`, `TOTAL` 챌린지만 표시. |
| U-028 | 최근 읽은 책에서 이어보기 제공. |

---

## 10. Validation

Front validation은 submit 전 기본 확인만 한다. API 오류가 오면 화면에 표시한다.

| 화면 | 필드 | Front 검증 |
|---|---|---|
| U-002 | `loginId` | 필수 |
| U-002 | `password`, `passwordConfirm` | 필수, 서로 일치 |
| U-002 | `name` | 필수 |
| U-002 | `email` | 필수, 이메일 형식 |
| U-002 | `birthDate` | 필수, 미래 날짜 불가 |
| U-003 | `loginId`, `password` | 필수 |
| U-004 | `name`, `email` | 필수, 이메일 형식 |
| U-007 | `q` | trim 후 빈 값이면 검색 금지 |
| U-009 | `pointAmount` | 0 이상, 보유 포인트 이하 |
| U-011 | `pageNo`, `currentPage` | 1 이상, 전체 페이지 이하 |
| U-013 | `ratingScore` | 1~5, 최초 작성 시 필수 |
| U-013 | `content` | 필수 |
| U-015 | 수정 field | `loginId`, `birthDate`, `role`, `status` 수정 금지 |
| U-015 | 비밀번호 변경 | 현재 비밀번호, 새 비밀번호, 확인 필수/일치 |
| U-018 | `from`, `to` | `from <= to` |
| U-022 | `title`, `author`, `publisher`, `reason` | 모두 필수 |

공통:

- text input은 submit 전에 trim한다.
- enum 값은 API 명세의 문자열 그대로 쓴다.
- API `errors[].field`가 있으면 해당 field 하단에 표시한다.

---

## 11. 구현 제외 기능

아래는 Front에서 만들지 않는다.

| 제외 | 이유 |
|---|---|
| U-005 비회원 비밀번호 재설정 | final API 범위 제외 |
| U-020 독립 신고 화면 | 신고는 U-008 모달로 처리 |
| 도서 미리보기 | final API 범위 제외 |
| 반납/연체/연체료 | 대여 상태는 `READY`, `READING`, `OWNED`만 사용 |
| 결제 취소/환불/복구 | 완료 결제만 저장/표시 |
| 사용자 신고 | 책/리뷰 신고만 제공 |
| 포인트 소멸예정 | 포인트 만료 정책 없음 |
| 포인트/쿠폰 상세 화면 | 목록 표시만 제공 |
| 채팅 | 프로젝트 범위 제외 |
| TTS | 보류 기능 |

---

## 12. 보강 필요사항

아래는 화면 구현 전에 API 또는 팀 결정이 필요하다.

| 항목 | 현재 상태 | Front 처리 |
|---|---|---|
| U-019 모두 읽기 | `API-NOTI-003` 없음 | 버튼 비활성 또는 제외 |
| U-014 내 리뷰 목록 | 전용 `내 리뷰 목록 조회` API 없음 | 임시 조합 구현 금지. API 보완 필요 |
| U-014 리뷰 수 | `API-ME-001` 기준 불명확, `API-STAT-001`에는 있음 | 마이페이지에서 통계 API 조합 여부 결정 |
| token 저장 방식 | Bearer token 기준이나 저장 위치 미정 | 빠른 구현은 localStorage, 최종 방식은 팀 결정 |
| 지도 API | U-024 지도 제공 방식 미정 | 우선 주소 목록으로 구현 가능 |
| Admin 화면 | User 우선 | Admin은 별도 문서로 분리 |
| API DTO field | 이 문서에는 전체 field를 복사하지 않음 | API 명세를 보고 `types/*.ts` 작성 |

### 12.1 DB/ERD/API 대조 후 추가 보강 필요사항

`AcornProject/docs/데이터베이스/erd/ebook-rental-erd.md`, `docs/데이터베이스/ddl/schema.sql`, `docs/API 명세/api-spec(final).md`, `docs/화면흐름도/*`와 대조했을 때 Front 구현자가 놓치기 쉬운 항목이다.

| 항목 | DB/API/화면설계 근거 | Front 처리 |
|---|---|---|
| Admin 상세 화면 | API 명세에 `API-ADMIN-*`, 화면설계에 A-002~A-018 존재 | 이 문서는 User Front 기준이다. Admin은 `ABC_admin_화면.md` 같은 별도 문서로 분리한다. |
| U-001 홈 섹션 | 상세화면설계도 기준 추천, 컬렉션/이벤트, 신간, 베스트, 무료/유료, 공지 섹션 존재 | 홈 구현 시 `API-BOOK-001`, `API-BOOK-005`, `API-CATEGORY-001`, `API-COLLECTION-001~002`, `API-NOTICE-001` 조합을 확인한다. |
| U-006 목록 조건 | 카테고리, 대여 유형, 컬렉션/이벤트, 정렬, pagination 조건 존재 | query string을 API params로 변환한다. `collectionId`, `section=event`, `rentalType`, `sort`, `page`, `size`를 누락하지 않는다. |
| U-008 상세 구성 | ISBN, 카테고리, 키워드, 전체 페이지, 리뷰/평점, 추천, 보유 도서관 연결 존재 | 도서 상세 타입 작성 시 `BookDetail`, `ReviewSummary`, `RentalInfo`, `LibrarySummary` 등을 화면 단위로 분리한다. |
| U-014 내 리뷰 | 상세화면설계도에는 내 리뷰 탭이 있으나 final API에 전용 내 리뷰 목록 API 없음 | 임시 조합 구현 금지. 전용 API가 생기기 전에는 숨김/비활성 처리한다. |
| U-014 등급 달성률 | ERD 정책상 등급은 결제 금액 기준, 달성률은 `PAYMENT` 실시간 계산 | `API-ME-001` 응답에 달성률/유지 종료일이 없으면 Front에서 임의 계산하지 않는다. |
| U-019 모두 읽기 | 상세화면설계도에는 버튼이 있으나 final API에는 `API-NOTI-003` 없음 | 버튼은 숨김 또는 비활성. 단건 읽음 처리만 `API-NOTI-002`로 구현한다. |
| U-024 지도 | DB는 도서관 위도/경도 저장, 지도 API는 Front 외부 연동 | 지도 SDK 선택 전에는 주소 목록 중심으로 구현한다. |
| U-005 비밀번호 재설정 | DB에는 `password_reset_code`가 있지만 final User 화면/API에서는 제외 | 이 문서에서는 만들지 않는다. 로그인 회원 비밀번호 변경만 U-015에서 처리한다. |
| 외부 도서 수집 임시 테이블 | DB에 `book_isbn_temp` 존재 | User Front 범위 아님. Admin 도서 등록/외부 API 연동 문서에서만 다룬다. |
| 관리자 감사 로그 | DB/API에 `admin_audit_log`, A-017 존재 | User Front 범위 아님. Admin 문서에서 조회 전용 화면으로 다룬다. |

### 12.2 Enum/API field 정합성 주의

Front enum 문자열은 DB table column명이 아니라 API response/request DTO 기준으로 사용한다. DB DDL에는 일부 대소문자 혼재가 있으므로 화면에서 임의로 정규화하지 않는다.

| 영역 | 확인 필요 값 | Front 기준 |
|---|---|---|
| 포인트 유형 | `CHALLENGE_REWARD`, `REVIEW_REWARD`, `PAYBACK`, `EVENT_REWARD`, `PAYMENT_USE`, `ADMIN_ADJUST` | API 명세 문자열을 그대로 사용한다. |
| 알림 유형 | `RENTAL`, `PAYMENT`, `NOTICE`, `EVENT`, `REPORT`, `BOOK_REQUEST`, `COUPON`, `CHALLENGE` | 알림 target 이동 매핑은 API 응답값 기준으로 작성한다. |
| 챌린지 보상 유형 | `POINT`, `COUPON` | DB DDL의 대소문자와 다르면 backend DTO 확정값을 따른다. |
| 상태 라벨 | `READY`, `READING`, `OWNED`, `JOINED`, `SANCTIONED`, `WITHDRAWN`, `DEACTIVATED` 등 | 화면 라벨은 한글, API payload는 enum 원문 유지. |

### 12.3 다시 비교할 때 체크리스트

- User 화면은 `02-User-상세화면설계도.md`의 U-001~U-028과 비교한다.
- Admin 화면은 이 문서에 합치지 말고 `03-Admin-상세화면설계도.md`와 별도 Front 문서로 비교한다.
- API 누락은 `api-spec(final).md`의 User API 목록 기준으로 먼저 확인한다.
- DB table 누락은 화면/API에서 직접 쓰는 것만 확인한다. `book_isbn_temp`, `admin_audit_log`처럼 User Front가 직접 쓰지 않는 table은 이 문서에 상세 반영하지 않는다.
- enum은 DB DDL보다 backend API DTO와 실제 응답을 우선한다.

---

## 13. 담당자 분업안

| 담당 | 화면/기능 |
|---|---|
| 해수 | U-001, U-006, U-007, U-008, U-024, U-025 |
| 건희 | U-009, U-010, U-011, U-018, U-028 |
| 해든 | U-014, U-015, U-017, U-026, U-027 |
| 진희 | U-002, U-003, U-004, U-012, U-016, U-019, U-021, U-022, U-023 |

공통 컴포넌트는 분업 전에 먼저 맞춘다.

```text
Button
Badge
Modal
Pagination
BookCard
Header
Footer
ProtectedRoute
```

---

## 14. 이 문서에서 뺀 내용

아래 내용은 Front 화면 정의서에 넣지 않는다.

| 뺀 내용 | 확인 위치 |
|---|---|
| 서버 설정 | Front 담당 범위 아님 |
| API 상세 request/response 전체 | 화면 구현 시 필요한 field만 별도 확인 |
| 설치/프로젝트 생성 상세 | `ABC_front_세팅.md` |
| 내부 리뷰 문구 | 문서 유지에 불필요하므로 삭제 |
| Admin 상세 화면 | User Front 우선이므로 별도 문서로 분리 |

---

## 15. 이 문서만 보고 가능한 것

가능:

- User route 구성
- 공통 Layout/Header/Footer 구성
- 화면별 API module 분리
- 핵심 User 화면 구현 순서 결정
- 제외 기능 판단
- 보강 필요사항 확인

추가 확인 필요:

- API별 정확한 response DTO field
- token 저장 방식 최종 결정
- U-014 내 리뷰 목록 API
- U-019 모두 읽기 API
- U-024 지도 API 선택

---

## 16. Front 화면 만드는 방법

React에서는 화면마다 `.html` 파일을 따로 만들지 않는다. 화면은 `.tsx` 파일로 만들고, CSS는 `.css` 또는 `.module.css`로 분리한다.

```text
HTML 역할  → .tsx 파일의 JSX
CSS 역할   → .css 또는 .module.css
화면 이동  → src/app/router.tsx
API 호출  → src/api/*.ts
API 타입  → src/types/*.ts
```

기본 순서:

```text
1. 화면 ID 확인: 예) U-006 도서 목록
2. Page 파일 생성 또는 수정: src/pages/user/BooksPage.tsx
3. 필요한 API 함수 생성: src/api/bookApi.ts
4. 필요한 타입 생성: src/types/book.ts
5. 반복 UI는 components로 분리: BookCard.tsx
6. CSS 작성
7. router.tsx에 route 연결
8. npm run dev로 확인
```

---

## 17. User 화면 만드는 방법

User 화면은 `src/pages/user`에 만든다.

예시: `U-006 도서 목록`

```tsx
export function BooksPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">U-006</p>
      <h1>도서 목록</h1>
      <div className="book-list">
        {/* BookCard 목록 연결 */}
      </div>
    </section>
  );
}
```

route 연결:

```tsx
{ path: '/books', element: <BooksPage /> }
```

User 화면 추가 위치:

```text
src/pages/user/NewUserPage.tsx
```

User 화면 route는 `UserLayout` 아래 children에 추가한다.

---

## 18. Admin 화면 만드는 방법

Admin 화면은 `src/pages/admin`에 만든다.

예시: `A-001 관리자 대시보드`

```tsx
export function AdminDashboardPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">A-001</p>
      <h1>관리자 대시보드</h1>
      <p>관리자 화면 내용을 배치합니다.</p>
    </section>
  );
}
```

route 연결:

```tsx
{
  path: '/admin',
  element: <AdminLayout />,
  children: [{ index: true, element: <AdminDashboardPage /> }],
}
```

Admin 화면 추가 위치:

```text
src/pages/admin/NewAdminPage.tsx
```

Admin 메뉴는 `src/components/layout/AdminLayout.tsx`에 Link를 추가한다.

---

## 19. CSS 작성 방법

공통 CSS는 `src/styles`에 둔다.

```text
src/styles/variables.css  색상/간격/테두리 변수
src/styles/base.css       body, input, button 기본값
src/styles/layout.css     layout, page-section, form-card 등 공통 class
```

화면 전용 CSS가 많아지면 CSS Module을 쓴다.

```text
src/pages/user/BooksPage.module.css
```

예시:

```css
.bookGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
```

사용:

```tsx
import styles from './BooksPage.module.css';

export function BooksPage() {
  return <div className={styles.bookGrid}>...</div>;
}
```

규칙:

- 여러 화면에서 쓰는 스타일은 `src/styles/layout.css`에 둔다.
- 한 화면에서만 쓰는 스타일은 `*.module.css`를 쓴다.
- 버튼/배지/모달처럼 반복되는 UI는 CSS보다 먼저 component로 분리한다.

---

## 20. API 연결 방법

Front는 DB에 직접 연결하지 않는다. API만 호출한다.

```text
React 화면 → src/api 함수 → API 응답 JSON → 화면 표시
```

API 함수 예시:

```ts
import { apiClient } from './apiClient';

export function getBooks() {
  return apiClient.get('/books');
}
```

화면에서 사용:

```tsx
import { useEffect, useState } from 'react';
import { getBooks } from '../../api/bookApi';

export function BooksPage() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    getBooks().then((response) => {
      setBooks(response.data.data.content);
    });
  }, []);

  return <section className="page-section">도서 목록</section>;
}
```

규칙:

- API URL을 화면 파일에 직접 쓰지 않는다.
- `src/api/*Api.ts`에서 API 함수를 만든다.
- 화면은 API 함수를 import해서 사용한다.
- 응답 타입은 `src/types`에 만든다.

---

## 21. 화면 만들 때 체크리스트

새 화면마다 확인한다.

- [ ] `pages/user` 또는 `pages/admin` 중 위치가 맞는가
- [ ] 화면 ID를 표시했는가: `U-006`, `A-001` 등
- [ ] `router.tsx`에 route를 연결했는가
- [ ] API 호출은 `src/api`로 분리했는가
- [ ] 반복 UI는 `components`로 뺐는가
- [ ] Loading/Empty/Error 상태를 생각했는가
- [ ] 화면 전용 CSS가 많으면 `*.module.css`로 분리했는가
- [ ] `npm run dev`로 화면을 직접 확인했는가
