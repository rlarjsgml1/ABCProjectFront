# ABC Admin Front 화면 설계서

> 최종 대조일: 2026-07-12 (32~36번 Backend 실제 구현 대조를 Dashboard/Statistics/AuditLog controller 추가 확인 기준으로 갱신)

## 1. 문서 목적

이 문서는 ABC 전자책 대여 서비스의 Admin Front 구현 기준을 정의한다. 대상은 `A-001`부터 `A-018`까지의 관리자 화면이며, 각 화면의 route, API mapping, validation, user flow, 권한/메뉴/레이아웃 구현 기준을 포함한다.

## 2. 적용 원칙

| 항목 | 기준 |
|---|---|
| 기준 화면 | PC Web 1920px |
| Admin 콘텐츠 폭 | 1540px |
| 공통 레이아웃 | `AdminLayout` 기반 상단 바 + 좌측 sidebar |
| API 호출 | `apiClient`와 admin API wrapper만 사용 |
| DB 접근 | Front에서 직접 DB 접근 금지 |
| 스타일 | page-local CSS 최소화, shared component/style 우선 |
| 권한 | `Authorization: Bearer {accessToken}` + `MEMBER.role = ADMIN` |
| 페이징 | API spec final은 `page=1` 시작, 백엔드 공통 규칙은 `page=0` 예시가 있어 충돌. Front는 paging adapter에서 변환/정규화하고 실제 backend 구현 기준을 확인한다. |

## 3. Admin 인증/Guard 규칙

| 상황 | 처리 |
|---|---|
| accessToken 없음 | `/login` 또는 User 로그인 화면으로 redirect |
| accessToken 있음 + `MEMBER.role = ADMIN` | Admin route 접근 허용 |
| accessToken 있음 + `MEMBER.role = USER` | `접근 권한이 없습니다.` 표시 후 `/` 홈으로 redirect |
| token 만료/401 | token 제거 후 로그인 화면으로 redirect |
| 403 | 권한 없음 toast 또는 access denied page 표시 후 인증 상태에 따라 `/` 또는 `/login` 이동 |
| `SANCTIONED`, `WITHDRAWN`, `DEACTIVATED` | 관리자 접근 불가. 로그인/주요 활동 제한 정책을 따른다. |

## 4. Admin 공통 UI 상태

| 상태 | 표시/동작 |
|---|---|
| Loading | skeleton 또는 `데이터를 불러오는 중입니다.` |
| Empty | 화면별 빈 상태 문구와 필요한 CTA 표시 |
| Validation Error | 필드 하단 한글 오류 문구, 화면 유지 |
| 401 | `로그인이 필요합니다.` 표시 후 로그인 이동 |
| 403 | `접근 권한이 없습니다.` 표시 후 홈 또는 로그인 이동 |
| Server Error | `처리 중 오류가 발생했습니다.` + `다시 시도` |
| Success | 성공 toast 표시 후 목록 갱신 또는 상세 이동 |
| Conflict/409 | 중복, 이미 처리됨, 상태 충돌 메시지 표시 |
| Business Error/422 | API error message 우선 표시 |

## 5. Admin 상단 바

| 요소 | 기능 | 이동/결과 |
|---|---|---|
| `ABC Admin` 로고 | 관리자 홈 이동 | `/admin` |
| 현재 페이지명 | 현재 메뉴 위치 표시 | 이동 없음 |
| `사용자 화면 보기` | User 메인 새 탭 | `/` |
| 관리자 이름 | 로그인 관리자 표시 | 이동 없음 |
| `로그아웃` | token 제거 | `/login` |

## 6. Admin Sidebar/Menu

| 메뉴 | 하위 메뉴 | 화면 | Route |
|---|---|---|---|
| 대시보드 | 운영 요약 | A-001 | `/admin` |
| 회원 관리 | 회원 목록 | A-002 | `/admin/members` |
| 회원 관리 | 회원 상세 | A-003 | `/admin/members/:memberId` |
| 도서 관리 | 도서 목록 | A-004 | `/admin/books` |
| 도서 관리 | 도서 등록 | A-005 | `/admin/books/new` |
| 도서 관리 | 도서 수정 | A-006 | `/admin/books/:bookId/edit` |
| 도서 관리 | 카테고리 | A-007 | `/admin/categories` |
| 대여 관리 | 전체 대여 현황 | A-008 | `/admin/rentals` |
| 결제 관리 | 완료 결제 조회 | A-009 | `/admin/payments` |
| 신고 관리 | 도서/리뷰 신고 | A-010 | `/admin/reports` |
| 희망도서 관리 | 신청 검토 | A-011 | `/admin/book-requests` |
| 공지 관리 | 공지 목록/등록 | A-012 | `/admin/notices` |
| 쿠폰·포인트 | 쿠폰/포인트 | A-013 | `/admin/coupons-points` |
| 챌린지 관리 | 챌린지/보상 | A-014 | `/admin/challenges` |
| 도서관 관리 | 위치/보유 도서 | A-015 | `/admin/libraries` |
| 통계 | 운영 통계 | A-016 | `/admin/statistics` |
| 감사 로그 | 관리자 작업 이력 | A-017 | `/admin/audit-logs` |
| 컬렉션 관리 | 시리즈/이벤트 | A-018 | `/admin/collections` |

## 7. 전체 Route Table

| ID | 화면명 | Route | 주요 API |
|---|---|---|---|
| A-001 | 관리자 대시보드 | `/admin` | `API-ADMIN-DASHBOARD-001` |
| A-002 | 회원 목록 관리 | `/admin/members` | `API-ADMIN-MEMBER-001`, `API-ADMIN-MEMBER-003` |
| A-003 | 회원 상세/상태 관리 | `/admin/members/:memberId` | `API-ADMIN-MEMBER-002`, `API-ADMIN-MEMBER-003`, `API-ADMIN-MEMBER-004` |
| A-004 | 도서 목록 관리 | `/admin/books` | `API-ADMIN-BOOK-001`, `API-ADMIN-BOOK-004` |
| A-005 | 도서 등록 | `/admin/books/new` | `API-ADMIN-BOOK-002`, `API-ADMIN-REQUEST-002` |
| A-006 | 도서 수정 | `/admin/books/:bookId/edit` | `API-ADMIN-BOOK-003`, `API-ADMIN-BOOK-004` |
| A-007 | 카테고리 관리 | `/admin/categories` | `API-ADMIN-CATEGORY-001`, `API-ADMIN-CATEGORY-002` |
| A-008 | 대여 현황 관리 | `/admin/rentals` | `API-ADMIN-RENTAL-001` |
| A-009 | 결제 관리 | `/admin/payments` | `API-ADMIN-PAYMENT-001` |
| A-010 | 신고 관리 | `/admin/reports` | `API-ADMIN-REPORT-001`, `API-ADMIN-REPORT-002` |
| A-011 | 희망도서 관리 | `/admin/book-requests` | `API-ADMIN-REQUEST-001`, `API-ADMIN-REQUEST-002` |
| A-012 | 공지 관리 | `/admin/notices` | `API-ADMIN-NOTICE-001`, `API-ADMIN-NOTICE-002`, `API-ADMIN-NOTICE-003` |
| A-013 | 쿠폰/포인트 관리 | `/admin/coupons-points` | `API-ADMIN-COUPON-001~003`, `API-ADMIN-MEMBER-004` |
| A-014 | 챌린지 관리 | `/admin/challenges` | `API-ADMIN-CHALLENGE-001`, `API-ADMIN-CHALLENGE-002` |
| A-015 | 도서관 위치 관리 | `/admin/libraries` | `API-ADMIN-LIBRARY-001~003` |
| A-016 | 통계 관리 | `/admin/statistics` | `API-ADMIN-STAT-001` |
| A-017 | 관리자 감사 로그 | `/admin/audit-logs` | `API-ADMIN-AUDIT-001` |
| A-018 | 컬렉션 관리 | `/admin/collections` | `API-ADMIN-COLLECTION-001~004` |

## 8. Admin API Connection Table

| API ID | Method | URL | 화면 | 용도 |
|---|---|---|---|---|
| `API-ADMIN-DASHBOARD-001` | GET | `/api/v1/admin/dashboard` | A-001 | 대시보드 KPI/최근 목록 |
| `API-ADMIN-BOOK-001` | GET | `/api/v1/admin/books` | A-004 | 관리자 도서 목록 |
| `API-ADMIN-BOOK-002` | POST | `/api/v1/admin/books` | A-005 | 도서 등록 |
| `API-ADMIN-BOOK-003` | PUT | `/api/v1/admin/books/{bookId}` | A-006 | 도서 수정 |
| `API-ADMIN-BOOK-004` | PATCH | `/api/v1/admin/books/{bookId}/status` | A-004, A-006 | 도서 상태 변경 |
| `API-ADMIN-CATEGORY-001` | GET | `/api/v1/admin/categories` | A-007 | 카테고리 트리 조회 |
| `API-ADMIN-CATEGORY-002` | PUT | `/api/v1/admin/categories/{categoryId}` | A-007 | 카테고리 등록/수정 |
| `API-ADMIN-MEMBER-001` | GET | `/api/v1/admin/members` | A-002 | 회원 목록 |
| `API-ADMIN-MEMBER-002` | GET | `/api/v1/admin/members/{memberId}` | A-003 | 회원 상세 |
| `API-ADMIN-MEMBER-003` | PATCH | `/api/v1/admin/members/{memberId}/status` | A-002, A-003 | 회원 상태 변경 |
| `API-ADMIN-MEMBER-004` | POST | `/api/v1/admin/members/{memberId}/points` | A-003, A-013 | 회원 포인트 조정 |
| `API-ADMIN-RENTAL-001` | GET | `/api/v1/admin/rentals` | A-008 | 대여 현황 |
| `API-ADMIN-PAYMENT-001` | GET | `/api/v1/admin/payments` | A-009 | 완료 결제 목록 |
| `API-ADMIN-REPORT-001` | GET | `/api/v1/admin/reports` | A-010 | 신고 목록 |
| `API-ADMIN-REPORT-002` | PATCH | `/api/v1/admin/reports/{targetType}/{reportId}/status` | A-010 | 신고 처리 |
| `API-ADMIN-REQUEST-001` | GET | `/api/v1/admin/book-request-candidates` | A-011 | 희망도서 후보 목록 |
| `API-ADMIN-REQUEST-002` | PATCH | `/api/v1/admin/book-request-candidates/{candidateId}/status` | A-011, A-005 | 희망도서 승인/반려 |
| `API-ADMIN-NOTICE-001` | GET | `/api/v1/admin/notices` | A-012 | 공지 목록 |
| `API-ADMIN-NOTICE-002` | POST | `/api/v1/admin/notices` | A-012 | 공지 등록 |
| `API-ADMIN-NOTICE-003` | PUT | `/api/v1/admin/notices/{noticeId}` | A-012 | 공지 수정/숨김 |
| `API-ADMIN-COUPON-001` | GET | `/api/v1/admin/coupons` | A-013 | 쿠폰 목록 |
| `API-ADMIN-COUPON-002` | POST | `/api/v1/admin/coupons` | A-013 | 쿠폰 등록 |
| `API-ADMIN-COUPON-003` | POST | `/api/v1/admin/coupons/{couponId}/issue` | A-013 | 회원 쿠폰 발급 |
| `API-ADMIN-CHALLENGE-001` | GET | `/api/v1/admin/challenges` | A-014 | 챌린지 목록 |
| `API-ADMIN-CHALLENGE-002` | PUT | `/api/v1/admin/challenges/{challengeId}` | A-014 | 챌린지 등록/수정 |
| `API-ADMIN-LIBRARY-001` | GET | `/api/v1/admin/libraries` | A-015 | 도서관 목록 |
| `API-ADMIN-LIBRARY-002` | PUT | `/api/v1/admin/libraries/{libraryId}` | A-015 | 도서관 등록/수정 |
| `API-ADMIN-LIBRARY-003` | PUT | `/api/v1/admin/libraries/{libraryId}/books` | A-015 | 보유 도서 변경 |
| `API-ADMIN-COLLECTION-001` | GET | `/api/v1/admin/collections` | A-018 | 컬렉션 목록 |
| `API-ADMIN-COLLECTION-002` | PUT | `/api/v1/admin/collections/{collectionId}` | A-018 | 컬렉션 등록/수정 |
| `API-ADMIN-COLLECTION-003` | PUT | `/api/v1/admin/collections/{collectionId}/books` | A-018 | 컬렉션 도서 추가/정렬 |
| `API-ADMIN-COLLECTION-004` | PATCH | `/api/v1/admin/collections/{collectionId}` | A-018 | 컬렉션 도서 제외/상태 변경 |
| `API-ADMIN-STAT-001` | GET | `/api/v1/admin/statistics` | A-016 | 관리자 통계 |
| `API-ADMIN-AUDIT-001` | GET | `/api/v1/admin/audit-logs` | A-017 | 감사 로그 |

## 9. 공통 Front 구현 기준

| 영역 | 구현 기준 |
|---|---|
| API client | 모든 요청은 `apiClient`를 통해 호출하고 Bearer token을 자동 첨부 |
| Admin API wrapper | `adminDashboardApi`, `adminBookApi`, `adminMemberApi` 등 도메인별 wrapper 작성 |
| Error handling | 공통 interceptor에서 401/403/500 처리, 화면별 validation error는 form에 표시 |
| Layout | 모든 Admin page는 `AdminLayout` 하위에서 렌더링 |
| Form | client validation 후 API 호출, backend validation message는 필드별 매핑 |
| Pagination | 화면 page와 API page를 adapter에서 중앙 변환 |
| Query state | 검색/필터/page/size는 URL query와 동기화 |
| Modal | 상태 변경, 신고 처리, 포인트 조정, 결제 상세 등은 공통 modal component 사용 |
| Toast | 생성/수정/상태 변경 성공 시 success toast |
| Audit | 감사 로그 기록은 backend 책임. Front는 사유/변경값을 API body에 전달 |

## 10. A-001 관리자 대시보드

| 항목 | 내용 |
|---|---|
| Route | `/admin` |
| Primary API | `API-ADMIN-DASHBOARD-001` |
| Purpose | 운영 KPI와 최근 운영 이슈를 한 화면에서 확인하고 주요 관리 화면으로 이동 |

### UI 구성

| 영역 | 내용 |
|---|---|
| KPI 카드 | 전체 회원, 제재 회원, 이용 가능 도서, 전체 대여, 완독, 결제 합계, 리뷰, 신고 |
| 최근 신고 | 최근 책/리뷰 신고 목록 |
| 최근 희망도서 | 최근 후보 신청 목록 |
| 최근 결제 | 최근 완료 결제 목록 |
| 빠른 작업 | 도서 등록, 컬렉션 등록, 공지 등록, 쿠폰 발급 |
| 전체 통계 링크 | A-016 이동 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| KPI 카드 클릭 | 관련 관리 화면으로 이동 |
| 최근 목록 empty | `최근 데이터가 없습니다.` 표시 |
| 빠른 작업 | 해당 등록/관리 화면으로 이동 |
| API 실패 | dashboard 영역별 fallback이 아니라 화면 전체 error state 표시 |

### Flow

1. Admin guard 통과
2. `GET /api/v1/admin/dashboard`
3. KPI/최근 목록 렌더링
4. 카드 또는 빠른 작업 클릭 시 대상 화면 이동

## 11. A-002 회원 목록 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/members` |
| Primary API | `API-ADMIN-MEMBER-001`, `API-ADMIN-MEMBER-003` |
| Purpose | 회원 검색, 상태/역할/등급 필터링, 회원 상세 진입, 회원 상태 변경 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 검색어 `q`, 상태 `status`, 역할 `role`, 등급 `gradeId` |
| 테이블 | 회원번호, 아이디/이름, 이메일, 역할/등급, 포인트, 상태, 현재 유효 제재, 관리 |
| 액션 | 상세, 상태 변경 |
| 페이지네이션 | page, size |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 검색어 | 이름, 아이디, 이메일 검색 |
| 상태 | `JOINED`, `SANCTIONED`, `WITHDRAWN`, `DEACTIVATED` |
| 역할 | `USER`, `ADMIN` |
| 상태 변경 | 상태와 사유 필수 |
| `SANCTIONED` 선택 | `sanctionType`, `startedAt`, `endedAt`, `reason` 입력 |
| 관리자 비밀번호 | 조회/변경 UI 제공 금지 |
| API gap/confirm | 회원 등급 목록을 위한 별도 Admin grade API가 final spec에 없으므로 `API-ADMIN-MEMBER-001` 응답 또는 정적 옵션 사용 여부 확인 필요 |

### Flow

1. 필터 query 기준으로 회원 목록 조회
2. 행 클릭 또는 `상세` 클릭 시 `/admin/members/:memberId`
3. `상태 변경` 클릭 시 modal 표시
4. 저장 시 `PATCH /api/v1/admin/members/{memberId}/status`
5. 성공 toast 후 목록 재조회

## 12. A-003 회원 상세/상태 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/members/:memberId` |
| Primary API | `API-ADMIN-MEMBER-002`, `API-ADMIN-MEMBER-003`, `API-ADMIN-MEMBER-004` |
| Purpose | 회원 기본 정보, 이용 요약, 이력 탭 확인 및 상태/포인트 관리 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 기본 정보 | 아이디, 이름, 이메일, 전화번호, 생년월일, 성별 |
| 계정 정보 | 역할, 상태, 등급, 포인트, 현재 유효 제재 |
| 이용 요약 | 대여, 결제, 리뷰, 신고, 독서 통계 |
| 탭 | 대여 내역, 결제 내역, 리뷰 내역, 신고 내역, 포인트 이력, 제재 이력 |
| 액션 | 상태 변경, 포인트 지급/차감, 목록으로 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 상태 변경 | A-002와 동일 |
| 포인트 조정 | `pointAmount` 0 불가, 차감 후 잔액 음수 불가 |
| 포인트 사유 | `description` 필수 |
| 포인트 유형 | backend에서 `ADMIN_ADJUST` 처리 |
| 비밀번호 | 관리자 화면에서 확인/변경 금지 |

### Flow

1. `memberId`로 상세 조회
2. 탭별 데이터는 `API-ADMIN-MEMBER-002` 응답 기준 표시
3. 상태 변경 저장 시 상세 재조회
4. 포인트 조정 저장 시 상세 재조회 및 success toast
5. 대여/결제 전체보기는 A-008/A-009에 `memberId` query로 이동

## 13. A-004 도서 목록 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/books` |
| Primary API | `API-ADMIN-BOOK-001`, `API-ADMIN-BOOK-004` |
| Purpose | 관리자 도서 검색, 필터링, 상태 변경, 등록/수정 진입 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 검색어, 카테고리, 대여 유형, 상태 |
| 테이블 | 도서번호, 표지/제목, 저자/출판사, ISBN, 카테고리, 유형/가격, 상태, 관리 |
| 액션 | 신규 도서 등록, 수정, 상태 변경 |
| 페이지네이션 | page, size |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 검색어 | 제목, 저자, 출판사, ISBN |
| 대여 유형 | `FREE`, `PAID` |
| 상태 | `AVAILABLE`, `HIDDEN`, `INACTIVE` |
| 상태 변경 | 상태 필수, 사유 선택/입력 |
| User 노출 | `HIDDEN`, `INACTIVE`는 User 목록에서 제외 |
| API gap/confirm | 도서 목록에서 카테고리 필터 옵션은 `API-ADMIN-CATEGORY-001` 병행 호출 필요 |

### Flow

1. query 기준 도서 목록 조회
2. `신규 도서 등록` 클릭 시 `/admin/books/new`
3. 행 또는 `수정` 클릭 시 `/admin/books/:bookId/edit`
4. 상태 변경 저장 시 `PATCH /api/v1/admin/books/{bookId}/status`
5. 성공 후 목록 재조회

## 14. A-005 도서 등록

| 항목 | 내용 |
|---|---|
| Route | `/admin/books/new` |
| Primary API | `API-ADMIN-BOOK-002`, `API-ADMIN-REQUEST-002` |
| Purpose | 신규 도서와 전자책 본문 페이지 등록, 희망도서 승인 도서 연결 |

### UI 구성

| 영역 | 입력 항목 |
|---|---|
| 기본 정보 | 제목, ISBN, 출판사명, 저자 목록/표시 순서 |
| 분류 | 카테고리, 키워드/해시태그 |
| 대여 | `rentalType`, `rentalPrice`, `defaultRentalDays` |
| 표시 | 표지 이미지 URL, `status` |
| 상세 | 책 소개, 목차, 출판사 리뷰, 상세 내용 |
| 전자책 본문 | 전체 페이지, 페이지 번호, 페이지 텍스트 본문 |
| 액션 | 저자 추가, 페이지 추가, 등록, 취소 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 제목 | 필수 |
| 출판사명 | 필수 |
| 저자 | 1명 이상 필수, 표시 순서 중복 금지 |
| 카테고리 | 1개 이상 권장 |
| `rentalType=PAID` | `rentalPrice > 0` |
| `rentalType=FREE` | `rentalPrice = 0` |
| `defaultRentalDays` | 양수 |
| ISBN | 입력 시 13자리, 중복은 API error 표시 |
| 페이지 | 페이지 번호 중복 금지, 본문 텍스트 필수 |
| 본문 파일 | PDF/EPUB/IMAGE 파일 업로드 UI 제공 금지 |
| 희망도서 승인 연결 | `candidateId`로 진입한 경우 도서 등록 성공 후 `API-ADMIN-REQUEST-002`로 `approvedBookId` 전달 |
| API gap/confirm | 도서 등록 화면 초기 카테고리 목록은 `API-ADMIN-CATEGORY-001` 병행 호출 필요 |

### Flow

1. 신규 등록 폼 진입
2. `candidateId` query가 있으면 희망도서 후보 정보로 기본값 prefill
3. 등록 클릭 시 client validation
4. `POST /api/v1/admin/books`
5. 희망도서 승인 연결이 필요한 경우 `PATCH /api/v1/admin/book-request-candidates/{candidateId}/status`
6. 성공 toast 후 `/admin/books`

## 15. A-006 도서 수정

| 항목 | 내용 |
|---|---|
| Route | `/admin/books/:bookId/edit` |
| Primary API | `API-ADMIN-BOOK-003`, `API-ADMIN-BOOK-004` |
| Purpose | 기존 도서 정보, 상세, 페이지, 카테고리, 상태 수정 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 기본/분류/대여/표시/상세/본문 | A-005와 동일 구조, 기존 값 채움 |
| 액션 | 저장, 상태 변경, 취소 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 검증 | A-005와 동일 |
| 상태 변경 | `AVAILABLE`, `HIDDEN`, `INACTIVE`와 사유 |
| 수정 이력 | backend가 `ADMIN_AUDIT_LOG` 기록 |
| API gap/confirm | final spec에 도서 상세 조회용 Admin 단건 조회 API가 별도 없음. 수정 화면 초기 데이터는 `API-ADMIN-BOOK-001` 목록 응답 확장, User `API-BOOK-003` 사용 가능 여부, 또는 Admin 단건 조회 API 추가 필요 확인 |

### Flow

1. `bookId` 기준 기존 값 로드
2. 수정 후 저장 클릭
3. client validation
4. `PUT /api/v1/admin/books/{bookId}`
5. 성공 toast 후 `/admin/books`
6. 상태 변경만 하는 경우 `PATCH /api/v1/admin/books/{bookId}/status`

## 16. A-007 카테고리 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/categories` |
| Primary API | `API-ADMIN-CATEGORY-001`, `API-ADMIN-CATEGORY-002` |
| Purpose | User/Admin 도서 탐색에 사용하는 카테고리 트리와 표시 순서 관리 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 카테고리 트리 | 상위/하위 카테고리, 활성/비활성 |
| 편집 패널 | 상위 카테고리, 이름, 표시 순서, 상태 |
| 액션 | 새 카테고리, 저장, 비활성화, 순서 변경 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 카테고리명 | 필수 |
| 표시 순서 | 0 이상 정수 |
| 상태 | `ACTIVE`, `INACTIVE` |
| 비활성 | User 카테고리 메뉴에서 제외 |
| 신규 등록 | final spec은 `PUT /admin/categories/{categoryId}` 형태. 신규 등록 시 `categoryId` placeholder 규칙 또는 별도 POST 필요 여부 확인 |
| API gap/confirm | 카테고리 신규 등록 endpoint가 명확하지 않으므로 backend 구현 확인 필요 |

### Flow

1. 카테고리 트리 조회
2. 트리 node 선택 시 편집 패널 채움
3. 새 카테고리 클릭 시 빈 폼
4. 저장 시 `PUT /api/v1/admin/categories/{categoryId}`
5. 성공 toast 후 트리 재조회

## 17. A-008 대여 현황 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/rentals` |
| Primary API | `API-ADMIN-RENTAL-001` |
| Purpose | 전체 대여 상태와 읽기 진행률 조회 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 검색어, 회원 ID, 상태 |
| 테이블 | 대여번호, 회원, 도서, 상태, 생성일/첫 읽기 시작일/종료일, 진행률, 관리 |
| 상세 패널 | 대여 상세와 읽기 진행 |
| 액션 | 검색, 초기화, 상세보기 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 상태 | `READY`, `READING`, `OWNED` |
| 대여 상태 변경 | 제공하지 않음 |
| 회원명 클릭 | A-003 이동 |
| 도서명 클릭 | A-006 이동 |
| 결제 정보 | 결제 연결이 있으면 읽기 전용 표시 |
| 제거 기능 | 반납, 연체, 연체료, 상태 변경 UI 금지 |

### Flow

1. query 기준 대여 현황 조회
2. 상세보기 클릭 시 row 상세 패널 표시
3. 회원/도서 링크 클릭 시 관련 관리 화면 이동

## 18. A-009 결제 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/payments` |
| Primary API | `API-ADMIN-PAYMENT-001` |
| Purpose | 완료된 유료 대여 결제와 할인/차감 내역 조회 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 검색어, 시작일, 종료일 |
| 테이블 | 결제번호, 회원/도서, 대여번호, 유형/수단, 금액, 상태, 결제일, 관리 |
| 상세 modal | 할인 전 금액, 쿠폰 할인, 포인트 차감, 최종 카드 결제 금액 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 결제 유형 | `RENTAL`만 표시 |
| 결제 수단 | `CARD`만 표시 |
| 결제 상태 | `PAID`만 표시 |
| 날짜 범위 | 시작일이 종료일보다 늦으면 validation error |
| 환불/취소 | 버튼 제공 금지 |
| 0원 결제 | `PAID` 결제 row로 정상 표시 |

### Flow

1. 결제 목록 조회
2. 상세보기 클릭 시 상세 modal 표시
3. modal 닫기 후 목록 유지

## 19. A-010 신고 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/reports` |
| Primary API | `API-ADMIN-REPORT-001`, `API-ADMIN-REPORT-002` |
| Purpose | 책/리뷰 신고 조회 및 처리, 리뷰 숨김, 회원 제재 연결 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 대상 유형, 상태 |
| 테이블 | 신고번호, 대상 유형/대상, 신고자, 신고 유형, 상태, 접수일, 관리 |
| 상세 패널 | 신고 내용, 원본 책/리뷰 정보 |
| 처리 modal | 상태, 처리 결과, 리뷰 숨김 여부, 제재 정보 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 대상 유형 | `BOOK`, `REVIEW` |
| 상태 | `WAITING`, `PROCESSING`, `DONE`, `REJECTED` |
| 상태 라벨 | 접수/대기, 처리 중, 완료, 반려 |
| 처리 결과 | `DONE`, `REJECTED` 처리 시 입력 권장/필수 |
| 리뷰 숨김 | 리뷰 신고에서만 `hideReviewYn` 표시 |
| 제재 | 필요 시 `sanctionType`, `startedAt`, `endedAt`, `reason` 입력 |
| 회원 대상 신고 | 제공하지 않음 |

### Flow

1. 신고 목록 조회
2. 상세보기로 원본 확인
3. 처리 modal에서 상태/결과 입력
4. `PATCH /api/v1/admin/reports/{targetType}/{reportId}/status`
5. 성공 toast 후 목록 재조회
6. 처리 결과 알림은 backend에서 생성

## 20. A-011 희망도서 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/book-requests` |
| Primary API | `API-ADMIN-REQUEST-001`, `API-ADMIN-REQUEST-002` |
| Purpose | 희망도서 후보 단위 검토, 승인/반려, 도서 등록 연결 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 상태, 검색어 |
| 목록 | 후보 제목, 후보 저자, 후보 출판사, 신청자 수, 최초 신청일, 후보 상태 |
| 상세 | 신청자 목록, 개별 신청 정보, 신청 사유, 신청 상태 |
| 액션 | 검토 시작, 신청자 보기, 승인 및 도서 등록, 승인 완료, 반려 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 후보 상태 | 후보는 `REQUESTED`, `IN_REVIEW`, `APPROVED`, `REJECTED` 기준 표시 |
| 회원별 신청 상태 | `REQUESTED`, `APPROVED`, `REJECTED`만 사용 |
| 검토 중 | 후보 상태로만 표시, 회원별 row에는 저장하지 않음 |
| 반려 | 반려 사유 필수 |
| 승인 완료 | `approvedBookId` 필요 |
| 승인 및 도서 등록 | `/admin/books/new?candidateId={candidateId}` 이동 |
| API gap/confirm | `API-ADMIN-REQUEST-002` request body는 `APPROVED/REJECTED`만 명시되어 있어 `IN_REVIEW` 처리 지원 여부 확인 필요 |

### Flow

1. 후보 목록 조회
2. 후보 선택 시 신청자 상세 표시
3. 승인 및 도서 등록 클릭 시 A-005로 이동
4. 도서 등록 완료 후 `approvedBookId`로 승인 처리
5. 반려 클릭 시 사유 입력 후 반려 처리
6. 성공 후 목록 재조회

## 21. A-012 공지 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/notices` |
| Primary API | `API-ADMIN-NOTICE-001`, `API-ADMIN-NOTICE-002`, `API-ADMIN-NOTICE-003` |
| Purpose | 공지 목록 조회, 등록, 수정, 숨김, 회원 알림 생성 여부 관리 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 상태, page, size |
| 목록 | 공지번호, 제목, 상태, 작성일, 수정일 |
| 작성/수정 폼 | 제목, 내용, 상태, 회원 알림 여부 |
| 액션 | 공지 등록, 저장, 숨김 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 제목 | 필수 |
| 내용 | 필수 |
| 상태 | `ACTIVE`, `HIDDEN` 기준 |
| 회원 알림 | `notifyYn=true`이면 회원별 NOTICE 알림 생성 |
| 알림 본문 | 별도 입력 필드 제공 금지 |
| 공지 수정 | 기존 회원 알림 재생성하지 않음 |
| 숨김 | User 공지 목록에서 제외 |

### Flow

1. 공지 목록 조회
2. 공지 등록 클릭 시 빈 폼
3. 저장 시 등록 또는 수정 API 호출
4. 성공 toast 후 목록 재조회
5. 숨김은 수정 API로 `noticeStatus=HIDDEN` 전달

## 22. A-013 쿠폰/포인트 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/coupons-points` |
| Primary API | `API-ADMIN-COUPON-001`, `API-ADMIN-COUPON-002`, `API-ADMIN-COUPON-003`, `API-ADMIN-MEMBER-004` |
| Purpose | 쿠폰 정의/발급 현황 관리와 회원 포인트 지급/차감 |

### UI 구성

| 탭 | 내용 |
|---|---|
| 쿠폰 탭 | 쿠폰 정의 목록, 쿠폰 등록 form, 회원 발급 modal |
| 포인트 탭 | 회원 검색, 포인트 조정 form, 조정 결과/이력 표시 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 쿠폰명 | 필수 |
| 쿠폰 유형 | `PERCENT_DISCOUNT`, `AMOUNT_DISCOUNT` |
| 혜택 단위 | `PERCENT`, `AMOUNT` |
| `PERCENT` | 1~100 범위 |
| `AMOUNT` | 0보다 큰 정수 |
| 유효일 | 기본 14일, 양수 |
| 쿠폰 상태 | `ACTIVE`, `INACTIVE` |
| 회원 발급 | `memberIds[]` 1명 이상, `quantity > 0` |
| 포인트 조정 | `pointAmount` 0 불가, 사유 필수 |
| 포인트 차감 | 잔액 음수 불가 |
| 포인트 만료 | 소멸예정 포인트 UI 제공 금지 |
| API gap/confirm | 포인트 탭의 회원 검색 전용 API가 없음. `API-ADMIN-MEMBER-001`을 검색 용도로 사용할지 확인 필요 |

### Flow

1. 쿠폰 탭 진입 시 쿠폰 목록 조회
2. 쿠폰 등록 저장 시 `POST /api/v1/admin/coupons`
3. 회원에게 발급 시 `POST /api/v1/admin/coupons/{couponId}/issue`
4. 포인트 조정은 회원 검색 후 `POST /api/v1/admin/members/{memberId}/points`
5. 성공 toast 후 관련 목록 재조회

## 23. A-014 챌린지 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/challenges` |
| Primary API | `API-ADMIN-CHALLENGE-001`, `API-ADMIN-CHALLENGE-002` |
| Purpose | 일일/전체 챌린지와 보상 정의 관리 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 챌린지 유형, 상태 |
| 목록 | 이름, 유형, 목표 행동, 목표 수, 상태 |
| 편집 | 이름, 유형, 목표 행동, 목표 수, 상태 |
| 보상 | 포인트 또는 쿠폰, 지급 수량 |
| 액션 | 새 챌린지, 보상 추가, 저장, 비활성화 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 챌린지명 | 필수 |
| 유형 | `DAILY`, `TOTAL`만 허용 |
| 목표 행동 | 필수 |
| 목표 수 | 양수 |
| 보상 | `POINT` 또는 `COUPON` |
| 포인트 보상 | 지급 포인트 양수 |
| 쿠폰 보상 | `couponId`, `rewardQuantity` 필수 |
| 비활성화 | 신규 노출 제외 |
| API gap/confirm | 챌린지 보상용 쿠폰 선택 목록은 `API-ADMIN-COUPON-001` 병행 호출 필요 |

### Flow

1. 챌린지 목록 조회
2. 새 챌린지 또는 기존 row 선택
3. 편집 후 저장
4. `PUT /api/v1/admin/challenges/{challengeId}`
5. 성공 toast 후 목록 재조회

## 24. A-015 도서관 위치 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/libraries` |
| Primary API | `API-ADMIN-LIBRARY-001`, `API-ADMIN-LIBRARY-002`, `API-ADMIN-LIBRARY-003` |
| Purpose | 도서관 위치 정보와 보유 도서 매핑 관리 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 검색어, 상태 |
| 목록 | 도서관명, 주소, 좌표, 상태, 보유 도서 수 |
| 편집 | 도서관명, 주소, 위도, 경도, 상태 |
| 보유 도서 | 도서 검색, 보유 상태, 추가/해제 |
| 액션 | 도서관 등록, 수정, 보유 도서 저장, 비활성화 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 도서관명 | 필수 |
| 주소 | 필수 |
| 좌표 | null 허용, 입력 시 숫자 |
| 상태 | `ACTIVE`, `INACTIVE` |
| 보유 도서 | 등록된 도서만 매핑 가능 |
| 실물 대여/예약 | UI 제공 금지 |
| 저장 순서 | 기본 정보 변경은 002, 보유 도서 변경은 003 분리 호출 |
| API gap/confirm | 보유 도서 추가 검색은 `API-ADMIN-BOOK-001` 사용 여부 확인 필요 |

### Flow

1. 도서관 목록 조회
2. 도서관 선택 또는 신규 등록
3. 기본 정보 저장 시 `PUT /api/v1/admin/libraries/{libraryId}`
4. 보유 도서 변경이 있으면 `PUT /api/v1/admin/libraries/{libraryId}/books`
5. 성공 toast 후 목록 재조회

## 25. A-016 통계 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/statistics` |
| Primary API | `API-ADMIN-STAT-001` |
| Purpose | 기간별 운영 KPI, 추이, 나이대별 통계, 환경 지표 조회 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 기간 필터 | 주간, 월간, 연간, 전체, 기준일 |
| 나이대 필터 | `10S`, `20S`, `30S`, `40S`, `50_PLUS` |
| KPI | 회원, 제재 회원, 이용 가능 도서, 대여, 완독, 결제 합계, 리뷰, 신고 |
| 환경 지표 | 탄소 절약량, 나무 보호량 |
| 그래프 | 대여 추이, 결제 추이, 완독 추이 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 기간 유형 | API가 허용하는 `periodType`만 전달 |
| 기준일 | 날짜 형식 `YYYY-MM-DD` |
| 나이대 | 선택값 없으면 전체 |
| 계산값 | 탄소 절약량=완독 수×2kg, 나무 보호량=완독 수×0.04그루 기준 표시 |
| KPI 클릭 | 관련 관리 화면 이동 |

### Flow

1. 기본 기간으로 통계 조회
2. 필터 변경 시 `GET /api/v1/admin/statistics`
3. KPI/그래프 렌더링
4. KPI 카드 클릭 시 관련 화면 이동

## 26. A-017 관리자 감사 로그

| 항목 | 내용 |
|---|---|
| Route | `/admin/audit-logs` |
| Primary API | `API-ADMIN-AUDIT-001` |
| Purpose | 관리자 주요 작업 이력을 조회 전용으로 확인 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 작업 유형, 대상 유형, 대상 ID |
| 테이블 | 로그번호, 관리자, 작업 유형, 대상, 변경 전/후, 기록일 |
| 상세 modal | 변경 전/후 전체 요약 |
| 액션 | 검색, 초기화, 상세보기 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 대상 ID | 입력 시 숫자 |
| 조회 전용 | 수정/삭제 버튼 제공 금지 |
| 변경 전/후 | 긴 텍스트는 요약 표시 후 modal에서 전체 표시 |
| 빈 목록 | `감사 로그가 없습니다.` |

### Flow

1. query 기준 감사 로그 조회
2. 상세보기 클릭 시 modal 표시
3. 필터 변경 시 목록 재조회

## 27. A-018 컬렉션 관리

| 항목 | 내용 |
|---|---|
| Route | `/admin/collections` |
| Primary API | `API-ADMIN-COLLECTION-001`, `API-ADMIN-COLLECTION-002`, `API-ADMIN-COLLECTION-003`, `API-ADMIN-COLLECTION-004` |
| Purpose | 시리즈/이벤트 컬렉션과 등록 도서 묶음 관리 |

### UI 구성

| 영역 | 내용 |
|---|---|
| 필터 | 컬렉션 유형, 상태 |
| 목록 | 컬렉션명, 구분, 기간, 상태, 등록 도서 수 |
| 편집 | 컬렉션명, 구분, 할인율, 설명, 시작일, 종료일, 상태 |
| 도서 묶음 | 등록 도서 검색, 표시 순서, 제외 |
| 액션 | 컬렉션 등록, 저장, 도서 추가, 도서 제외, 숨김/종료 |

### Validation/Interaction

| 항목 | 규칙 |
|---|---|
| 컬렉션명 | 필수 |
| 유형 | `SERIES`, `EVENT` |
| 상태 | `ACTIVE`, `HIDDEN`, `ENDED` |
| 할인율 | 입력 시 0~100 |
| 기간 | 시작일이 종료일보다 늦으면 오류 |
| 도서 추가 | 서비스에 등록된 `BOOK`만 추가 |
| 도서 제외 | 도서 자체 삭제가 아니라 컬렉션 묶음에서만 제거 |
| `SERIES` | `displayOrder` 사용 |
| User 노출 | `HIDDEN`, `ENDED`는 User 활성 컬렉션에서 제외 |
| API gap/confirm | 컬렉션 도서 추가용 도서 검색은 `API-ADMIN-BOOK-001` 사용 여부 확인 필요 |

### Flow

1. 컬렉션 목록 조회
2. 컬렉션 등록 또는 기존 컬렉션 선택
3. 기본 정보 저장 시 `PUT /api/v1/admin/collections/{collectionId}`
4. 도서 추가/정렬 시 `PUT /api/v1/admin/collections/{collectionId}/books`
5. 도서 제외/상태 변경 시 `PATCH /api/v1/admin/collections/{collectionId}`
6. 성공 toast 후 목록 재조회

## 28. 화면 간 주요 이동 Flow

| 시작 | 액션 | 도착 |
|---|---|---|
| A-001 | 회원 KPI 클릭 | A-002 |
| A-001 | 도서 KPI/도서 등록 클릭 | A-004/A-005 |
| A-001 | 신고 목록 클릭 | A-010 |
| A-001 | 희망도서 목록 클릭 | A-011 |
| A-002 | 회원 상세 | A-003 |
| A-003 | 대여 전체보기 | A-008 `?memberId={memberId}` |
| A-003 | 결제 전체보기 | A-009 `?memberId={memberId}` |
| A-004 | 신규 도서 등록 | A-005 |
| A-004 | 도서 수정 | A-006 |
| A-011 | 승인 및 도서 등록 | A-005 `?candidateId={candidateId}` |
| A-015 | 보유 도서 선택 | A-004/A-006 연계 가능 |
| A-016 | KPI 카드 클릭 | 관련 관리 화면 |
| A-018 | 없는 도서 추가 필요 | A-005 |

## 29. 권한/메뉴/화면 구현 완료 기준

| 구분 | 완료 기준 |
|---|---|
| Auth guard | 모든 `/admin/**` route가 Bearer token과 `role=ADMIN`을 검사한다 |
| Access denied | 일반 회원 접근 시 권한 없음 표시 후 홈 이동 |
| Login redirect | 비인증 접근 시 로그인으로 이동 |
| Sidebar | A-001~A-018 전체 메뉴가 표시되고 active state가 route와 일치한다 |
| Layout | 모든 Admin 화면이 `AdminLayout` 내부에서 동일한 상단 바/사이드바를 사용한다 |
| API wrapper | 모든 `API-ADMIN-*` endpoint가 admin API wrapper로 분리되어 있다 |
| Error state | loading, empty, validation error, 401, 403, server error, success toast가 공통 처리된다 |
| Pagination | page 시작 번호 충돌은 paging adapter에서 중앙 관리한다 |
| No direct DB | Front 코드에 DB table 직접 접근, SQL 호출, repository 개념이 없다 |
| No invented endpoint | final API spec에 없는 동작은 API gap/confirm으로 표시하고 임의 endpoint를 만들지 않는다 |
| Audit reason | 상태 변경/처리/조정 화면은 필요한 사유 필드를 API body로 전달한다 |

## 30. API Gap/Confirm Items

| 화면 | 항목 | 확인 필요 내용 |
|---|---|---|
| A-002 | 등급 필터 | 회원 등급 옵션 제공 방식 |
| A-005 | 카테고리 옵션 | `API-ADMIN-CATEGORY-001` 병행 호출 확정 |
| A-006 | 도서 수정 초기 데이터 | Admin 도서 단건 조회 endpoint 부재 확인 |
| A-007 | 카테고리 신규 등록 | `PUT /admin/categories/{categoryId}`로 신규 등록 가능한지 확인 |
| A-011 | 검토 시작 | `IN_REVIEW` 상태 변경을 `API-ADMIN-REQUEST-002`가 지원하는지 확인 |
| A-013 | 포인트 회원 검색 | `API-ADMIN-MEMBER-001` 재사용 여부 |
| A-014 | 보상 쿠폰 선택 | `API-ADMIN-COUPON-001` 병행 호출 여부 |
| A-015 | 보유 도서 검색 | `API-ADMIN-BOOK-001` 재사용 여부 |
| A-018 | 컬렉션 도서 검색 | `API-ADMIN-BOOK-001` 재사용 여부 |
| 공통 | 페이징 | final spec `page=1`과 backend common `page=0` 중 실제 구현 기준 확인 |

## 31. Source References

| 문서 | 사용 내용 |
|---|---|
| `/mnt/c/AcornProject/docs/화면흐름도/01-공통-화면설계기준.md` | Admin 공통 레이아웃, sidebar, 공통 UI 상태, 정책 기준 |
| `/mnt/c/AcornProject/docs/화면흐름도/03-Admin-상세화면설계도.md` | A-001~A-018 화면 구성, 버튼, 연동 API, 업무 규칙 |
| `/mnt/c/AcornProject/docs/화면흐름도/04-전체-화면이동흐름.md` | 로그인 권한 분기, 관리자 전체 흐름, 화면 이동 예외 |
| `/mnt/c/AcornProject/docs/API 명세/api-spec(final).md` | `API-ADMIN-*` endpoint, 인증 방식, 공통 응답, 상태 코드, validation 정책 |
| `/mnt/c/AcornProject/docs/공통문서/백엔드_공통_개발_규칙.md` | 공통 응답, 에러 응답, validation, HTTP status, page=0 예시 |
| `/mnt/c/AcornProject/docs/데이터베이스/erd/ebook-rental-erd.md` | Entity/테이블 기준, 상태값, 비즈니스 규칙, 감사 로그/통계/신고/컬렉션 정책 |

## 32. Backend 실제 구현 대조

> 기준일: 2026-07-12 (최초 작성 2026-07-11 대비 재대조 — Dashboard/Statistic/AuditLog controller 추가 확인)  
> 기준 폴더: `/mnt/c/AcornProject/src/main/java/com/acorn/abc`  
> 목적: Front만 구현할 때 실제로 호출 가능한 Admin API와 아직 spec-only인 API를 구분한다.

### 32.1 결론

| 구분 | 상태 |
|---|---|
| Admin 권한 처리 | 실제 구현 있음. `SecurityConfig`에서 `/api/v1/admin/**`는 `hasRole("ADMIN")` 적용 |
| Admin API 전체 | `api-spec(final).md`에는 A-001~A-018 전체 API가 있으나 backend controller는 일부만 구현됨 |
| 실제 구현된 Admin API | 대시보드(1차), 통계(TOTAL만), 감사 로그, 포인트 조정, 쿠폰, 챌린지, 외부 도서 ISBN temp/lookup |
| 아직 controller 없는 API | 회원 목록/상세/상태, 도서 일반 CRUD, 카테고리, 대여, 결제, 신고, 희망도서, 공지, 도서관, 컬렉션 |
| Front 처리 기준 | 화면/route/API wrapper는 API 문서 기준으로 전부 만든다. controller 없는 API도 endpoint/params/body 타입을 먼저 적용하고, 실행 시에는 dev mock/fallback/error state로 처리한다 |

## 33. 실제 구현된 Admin API

아래 API는 backend controller에서 실제 mapping을 확인했다.

| 화면 | 기능 | Method | Endpoint | Request | Response data | Backend source | Front 처리 |
|---|---|---|---|---|---|---|---|
| A-001 | 관리자 대시보드 조회 | GET | `/api/v1/admin/dashboard` | 없음 | KPI 통계, 최근 결제 목록 | `AdminDashboardController` | 실제 연결 가능하나 1차 구현. 최근 신고·최근 희망도서 위젯은 review/request 도메인 Repository 추가 후 후속 작업 |
| A-016 | 관리자 통계 조회 | GET | `/api/v1/admin/statistics` | query: `periodType`(필수, `WEEKLY\|MONTHLY\|YEARLY\|TOTAL`), `baseDate?`, `ageBand?` | KPI 통계 | `AdminStatisticController` | 현재 `periodType=TOTAL` + `ageBand=ALL`(또는 미지정) 조합만 지원. 그 외 조합은 404(`COMMON_NOT_FOUND`) 반환하므로 화면은 우선 TOTAL 탭만 활성화 |
| A-017 | 감사 로그 목록 조회 | GET | `/api/v1/admin/audit-logs` | query: `actionType?`, `targetType?`, `targetId?`, `page=0`, `size=10` | `PageResponse<AdminAuditLogSummaryResponse>` | `AdminAuditLogController` | 실제 연결 가능. 조회 전용 |
| A-003/A-013 | 회원 포인트 조정 | POST | `/api/v1/admin/members/{memberId}/points` | `pointAmount`, `description` | `pointHistoryId`, `pointAmount`, `pointType`, `pointBalance`, `createdAt` | `AdminMemberPointController` | 실제 연결 가능 |
| A-013 | 쿠폰 목록 | GET | `/api/v1/admin/coupons` | query: `status?`, `couponType?`, `page=0`, `size=10` | `PageResponse<AdminCouponSummaryResponse>` | `AdminCouponController` | 실제 연결 가능 |
| A-013 | 쿠폰 등록 | POST | `/api/v1/admin/coupons` | `couponName`, `couponType`, `benefitValue`, `benefitUnit`, `validDays`, `status` | `couponId` | `AdminCouponController` | 실제 연결 가능 |
| A-013 | 회원 쿠폰 발급 | POST | `/api/v1/admin/coupons/{couponId}/issue` | `memberIds[]`, `quantity` | `issuedCount` | `AdminCouponController` | 실제 연결 가능 |
| A-014 | 챌린지 목록 | GET | `/api/v1/admin/challenges` | query: `challengeType?`, `status?`, `page=0`, `size=10` | `PageResponse<AdminChallengeSummaryResponse>` | `AdminChallengeController` | 실제 연결 가능 |
| A-014 | 챌린지 수정 | PUT | `/api/v1/admin/challenges/{challengeId}` | `challengeName`, `challengeType`, `targetAction`, `targetCount`, `status`, `rewards[]` | `challengeId` | `AdminChallengeController` | 실제 연결 가능. 신규 생성은 controller 설명상 범위 밖 |
| A-005 보조 | 외부 도서 preview 조회 | GET | `/api/v1/admin/books/external/lookup` | query: `isbn13` | 외부 도서 메타데이터, provider 상태, 중복 정보, warning | `AdminBookMetadataController` | 도서 등록 보조 기능으로 사용 가능 |
| A-005 보조 | ISBN temp 저장/upsert | POST | `/api/v1/admin/book-isbn-temps/fetch` | `isbn13` | `tempId`, `isbn13`, `statusCd`, category, duplicate | `AdminBookIsbnTempController` | 도서 후보 수집 UI에 사용 가능 |
| A-005 보조 | ISBN temp 후보 목록 | GET | `/api/v1/admin/book-isbn-temps` | query: `status=READY`, `page=0`, `size=20` | `PageResponse<BookIsbnTempSummaryResponse>` | `AdminBookIsbnTempController` | 도서 후보 목록 UI에 사용 가능 |
| A-005 보조 | ISBN temp 승인 이관 | POST | `/api/v1/admin/book-isbn-temps/{tempId}/approve` | 도서 등록 필드 + 상세 + pages | `bookId`, `tempId`, `status` | `AdminBookIsbnTempController` | temp 기반 도서 등록에 사용 가능 |

## 34. API 문서 기준 적용 대상: 현재 controller 미확인 API

아래 API는 `api-spec(final).md`와 화면설계에는 있으나, 현재 backend source search 기준 controller mapping을 찾지 못했다. 그래도 Front는 이 endpoint를 기준으로 route, API wrapper, params/body 타입을 먼저 만든다. 단, backend 준비 전에는 실제 호출 시 404/501 가능성이 있으므로 dev mock/fallback/error state를 함께 둔다.

| 화면 | API ID | Method | Endpoint | Front 처리 |
|---|---|---|---|---|
| A-002 | `API-ADMIN-MEMBER-001` | GET | `/api/v1/admin/members` | API 문서 기준 `getAdminMembers()` wrapper와 query 적용. backend 준비 전 dev mock/fallback 사용 |
| A-002/A-003 | `API-ADMIN-MEMBER-003` | PATCH | `/api/v1/admin/members/{memberId}/status` | API 문서 기준 `changeMemberStatus()` wrapper와 body 적용. backend 준비 전 error/dev mock 처리 |
| A-003 | `API-ADMIN-MEMBER-002` | GET | `/api/v1/admin/members/{memberId}` | API 문서 기준 `getAdminMember()` wrapper 적용. 포인트 조정 API는 실제 연결 가능 |
| A-004 | `API-ADMIN-BOOK-001` | GET | `/api/v1/admin/books` | API 문서 기준 `getAdminBooks()` wrapper 적용. 보조 외부 도서 API와 혼동 금지 |
| A-004/A-006 | `API-ADMIN-BOOK-004` | PATCH | `/api/v1/admin/books/{bookId}/status` | API 문서 기준 `changeBookStatus()` wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-005 | `API-ADMIN-BOOK-002` | POST | `/api/v1/admin/books` | API 문서 기준 `createAdminBook()` wrapper/body 적용. 현재 실제 가능 경로는 ISBN temp approve |
| A-006 | `API-ADMIN-BOOK-003` | PUT | `/api/v1/admin/books/{bookId}` | API 문서 기준 `updateAdminBook()` wrapper/body 적용. 수정 화면 초기 데이터는 별도 확인 필요 |
| A-007 | `API-ADMIN-CATEGORY-001` | GET | `/api/v1/admin/categories` | API 문서 기준 `getAdminCategories()` wrapper 적용. User public `/api/v1/categories`와 구분 |
| A-007 | `API-ADMIN-CATEGORY-002` | PUT | `/api/v1/admin/categories/{categoryId}` | API 문서 기준 저장 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-008 | `API-ADMIN-RENTAL-001` | GET | `/api/v1/admin/rentals` | API 문서 기준 조회 wrapper/query 적용. backend 준비 전 dev mock/fallback 사용 |
| A-009 | `API-ADMIN-PAYMENT-001` | GET | `/api/v1/admin/payments` | API 문서 기준 조회 wrapper/query 적용. backend 준비 전 dev mock/fallback 사용 |
| A-010 | `API-ADMIN-REPORT-001` | GET | `/api/v1/admin/reports` | API 문서 기준 `getAdminReports()` wrapper/query 적용. backend 준비 전 dev mock/fallback 사용 |
| A-010 | `API-ADMIN-REPORT-002` | PATCH | `/api/v1/admin/reports/{targetType}/{reportId}/status` | API 문서 기준 `updateAdminReportStatus()` wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-011 | `API-ADMIN-REQUEST-001` | GET | `/api/v1/admin/book-request-candidates` | API 문서 기준 `getAdminBookRequestCandidates()` wrapper/query 적용. backend 준비 전 dev mock/fallback 사용 |
| A-011 | `API-ADMIN-REQUEST-002` | PATCH | `/api/v1/admin/book-request-candidates/{candidateId}/status` | API 문서 기준 승인/반려 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-012 | `API-ADMIN-NOTICE-001` | GET | `/api/v1/admin/notices` | API 문서 기준 `getAdminNotices()` wrapper/query 적용. public notice API와 구분 |
| A-012 | `API-ADMIN-NOTICE-002` | POST | `/api/v1/admin/notices` | API 문서 기준 등록 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-012 | `API-ADMIN-NOTICE-003` | PUT | `/api/v1/admin/notices/{noticeId}` | API 문서 기준 수정/숨김 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-015 | `API-ADMIN-LIBRARY-001` | GET | `/api/v1/admin/libraries` | API 문서 기준 `getAdminLibraries()` wrapper/query 적용. public `/books/{bookId}/libraries`와 구분 |
| A-015 | `API-ADMIN-LIBRARY-002` | PUT | `/api/v1/admin/libraries/{libraryId}` | API 문서 기준 기본정보 저장 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-015 | `API-ADMIN-LIBRARY-003` | PUT | `/api/v1/admin/libraries/{libraryId}/books` | API 문서 기준 보유 도서 저장 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-018 | `API-ADMIN-COLLECTION-001` | GET | `/api/v1/admin/collections` | API 문서 기준 `getAdminCollections()` wrapper/query 적용. public collection API와 구분 |
| A-018 | `API-ADMIN-COLLECTION-002` | PUT | `/api/v1/admin/collections/{collectionId}` | API 문서 기준 등록/수정 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-018 | `API-ADMIN-COLLECTION-003` | PUT | `/api/v1/admin/collections/{collectionId}/books` | API 문서 기준 도서 추가/정렬 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |
| A-018 | `API-ADMIN-COLLECTION-004` | PATCH | `/api/v1/admin/collections/{collectionId}` | API 문서 기준 도서 제외/상태 변경 wrapper/body 적용. backend 준비 전 error/dev mock 처리 |

## 35. Front 공통 응답 타입

backend 실제 `ApiResponse`, `PageResponse` 기준으로 Front 타입은 아래처럼 둔다.

```ts
export type ApiResponse<T> = {
  success: boolean;
  code: 'OK' | 'CREATED' | string;
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

주의:

- backend 실제 paging은 `page=0` 기반이다.
- 기존 `api-spec(final).md`에는 `page=1` 예시가 있으나 실제 controller와 `PageResponse`는 `page=0` 기준으로 확인된다.
- Front는 내부 UI page를 1부터 보여주더라도 API params 변환은 `apiPage = uiPage - 1`로 중앙 처리한다.

## 36. Admin API Wrapper 파일 계획

Front에서 API URL을 page component에 직접 쓰지 않는다. 아래 파일 단위로 분리한다.

| 파일 | 담당 화면 | Backend 상태 | 포함 함수 예시 |
|---|---|---|---|
| `src/api/adminDashboardApi.ts` | A-001 | 구현 있음(1차, 최근신고/희망도서 위젯 없음) | `getAdminDashboard()` |
| `src/api/adminMemberApi.ts` | A-002, A-003, A-013 | 일부 구현 | `getAdminMembers()`, `getAdminMember()`, `changeMemberStatus()`, `adjustMemberPoint()` |
| `src/api/adminBookApi.ts` | A-004, A-005, A-006 | 일부 보조 구현 | `getAdminBooks()`, `createAdminBook()`, `updateAdminBook()`, `changeBookStatus()`, `lookupExternalBook()`, `fetchBookIsbnTemp()`, `getBookIsbnTemps()`, `approveBookIsbnTemp()` |
| `src/api/adminCategoryApi.ts` | A-007 | 문서 기준 적용(controller 미확인) | `getAdminCategories()`, `saveAdminCategory()` |
| `src/api/adminRentalApi.ts` | A-008 | 문서 기준 적용(controller 미확인) | `getAdminRentals()` |
| `src/api/adminPaymentApi.ts` | A-009 | 문서 기준 적용(controller 미확인) | `getAdminPayments()` |
| `src/api/adminReportApi.ts` | A-010 | 문서 기준 적용(controller 미확인) | `getAdminReports()`, `updateAdminReportStatus()` |
| `src/api/adminBookRequestApi.ts` | A-011 | 문서 기준 적용(controller 미확인) | `getAdminBookRequestCandidates()`, `updateBookRequestCandidateStatus()` |
| `src/api/adminNoticeApi.ts` | A-012 | 문서 기준 적용(controller 미확인) | `getAdminNotices()`, `createAdminNotice()`, `updateAdminNotice()` |
| `src/api/adminCouponApi.ts` | A-013 | 구현 있음 | `getAdminCoupons()`, `createAdminCoupon()`, `issueAdminCoupon()` |
| `src/api/adminChallengeApi.ts` | A-014 | 구현 있음 | `getAdminChallenges()`, `updateAdminChallenge()` |
| `src/api/adminLibraryApi.ts` | A-015 | 문서 기준 적용(controller 미확인) | `getAdminLibraries()`, `saveAdminLibrary()`, `saveAdminLibraryBooks()` |
| `src/api/adminStatisticApi.ts` | A-016 | 구현 있음(`periodType=TOTAL`만 지원) | `getAdminStatistics()` |
| `src/api/adminAuditApi.ts` | A-017 | 구현 있음 | `getAdminAuditLogs()` |
| `src/api/adminCollectionApi.ts` | A-018 | 문서 기준 적용(controller 미확인) | `getAdminCollections()`, `saveAdminCollection()`, `saveAdminCollectionBooks()`, `patchAdminCollection()` |

## 37. Admin Route 파일 계획

| ID | Route | Page 파일 | API wrapper |
|---|---|---|---|
| A-001 | `/admin` | `src/pages/admin/A001Dashboard/AdminDashboardPage.tsx` | `adminDashboardApi.ts` |
| A-002 | `/admin/members` | `src/pages/admin/A002Members/AdminMembersPage.tsx` | `adminMemberApi.ts` |
| A-003 | `/admin/members/:memberId` | `src/pages/admin/A003MemberDetail/AdminMemberDetailPage.tsx` | `adminMemberApi.ts` |
| A-004 | `/admin/books` | `src/pages/admin/A004Books/AdminBooksPage.tsx` | `adminBookApi.ts` |
| A-005 | `/admin/books/new` | `src/pages/admin/A005BookCreate/AdminBookCreatePage.tsx` | `adminBookApi.ts` |
| A-006 | `/admin/books/:bookId/edit` | `src/pages/admin/A006BookEdit/AdminBookEditPage.tsx` | `adminBookApi.ts` |
| A-007 | `/admin/categories` | `src/pages/admin/A007Categories/AdminCategoriesPage.tsx` | `adminCategoryApi.ts` |
| A-008 | `/admin/rentals` | `src/pages/admin/A008Rentals/AdminRentalsPage.tsx` | `adminRentalApi.ts` |
| A-009 | `/admin/payments` | `src/pages/admin/A009Payments/AdminPaymentsPage.tsx` | `adminPaymentApi.ts` |
| A-010 | `/admin/reports` | `src/pages/admin/A010Reports/AdminReportsPage.tsx` | `adminReportApi.ts` |
| A-011 | `/admin/book-requests` | `src/pages/admin/A011BookRequests/AdminBookRequestsPage.tsx` | `adminBookRequestApi.ts` |
| A-012 | `/admin/notices` | `src/pages/admin/A012Notices/AdminNoticesPage.tsx` | `adminNoticeApi.ts` |
| A-013 | `/admin/coupons-points` | `src/pages/admin/A013CouponsPoints/AdminCouponsPointsPage.tsx` | `adminCouponApi.ts`, `adminMemberApi.ts` |
| A-014 | `/admin/challenges` | `src/pages/admin/A014Challenges/AdminChallengesPage.tsx` | `adminChallengeApi.ts` |
| A-015 | `/admin/libraries` | `src/pages/admin/A015Libraries/AdminLibrariesPage.tsx` | `adminLibraryApi.ts` |
| A-016 | `/admin/statistics` | `src/pages/admin/A016Statistics/AdminStatisticsPage.tsx` | `adminStatisticApi.ts` |
| A-017 | `/admin/audit-logs` | `src/pages/admin/A017AuditLogs/AdminAuditLogsPage.tsx` | `adminAuditApi.ts` |
| A-018 | `/admin/collections` | `src/pages/admin/A018Collections/AdminCollectionsPage.tsx` | `adminCollectionApi.ts` |

## 38. API 문서 기준 적용 및 미구현 처리 기준

Front만 먼저 만들 때도 API 문서에 있는 endpoint는 wrapper에 먼저 적용한다. 다만 backend controller가 없을 수 있으므로 실행 처리는 아래처럼 분리한다.

| 상황 | 처리 |
|---|---|
| 조회 API 문서만 있음 | wrapper는 문서 endpoint로 만들고, 화면은 filter/table/empty/error state까지 구현한다. backend 준비 전에는 dev mock/fallback을 사용한다 |
| API 문서 기준 저장 wrapper/body 적용. backend 준비 전 error/dev mock 처리 | form/modal은 구현하되 저장 버튼은 `API 준비 중` disabled 처리하거나 dev mock handler로만 처리 |
| 실제 구현 API | 문서 endpoint와 controller endpoint가 일치하면 바로 연결한다 |
| spec과 controller가 다른 경우 | controller 실제 구현을 우선하고 문서에는 차이를 남긴다 |
| mock 위치 | `src/mocks/admin/*.ts` 또는 page-local constant. API wrapper 안에 mock을 섞지 않는다 |
| mock 제거 기준 | wrapper는 그대로 두고 mock/fallback만 제거한다 |

## 39. Admin 구현 제외/비활성 기능

| 제외/비활성 | 이유 |
|---|---|
| 대여 상태 변경 | final API에서 `API-ADMIN-RENTAL-002` 제거. 대여 관리는 조회 전용 |
| 결제 취소/환불/복구 | final API에서 `API-ADMIN-PAYMENT-002` 제거. 완료 결제만 조회 |
| 회원 비밀번호 확인/변경 | Admin 회원 상세 정책상 금지 |
| 회원 대상 신고 | 책/리뷰 신고만 존재 |
| 공지 알림 본문 입력 | 알림 본문 저장 정책 없음. `notifyYn`만 전달 |
| 도서 PDF/EPUB/IMAGE 본문 업로드 | 현재 도서 본문은 `book_page.page_content` 텍스트 기준 |
| 실물 도서 대여/예약/픽업 | 도서관 위치는 위치/보유 상태 표시만 제공 |
| 포인트 소멸예정 UI | 포인트 만료 정책 없음 |
| 챌린지 신규 생성 | 현재 실제 controller는 `PUT /admin/challenges/{challengeId}` 수정만 제공. 신규 생성은 gap |

## 40. Admin Enum/Label 기준

| 영역 | API 값 | 화면 라벨 예시 |
|---|---|---|
| 회원 상태 | `JOINED`, `SANCTIONED`, `WITHDRAWN`, `DEACTIVATED` | 가입, 제재, 탈퇴, 비활성 |
| 회원 권한 | `USER`, `ADMIN` | 회원, 관리자 |
| 도서 상태 | `AVAILABLE`, `HIDDEN`, `INACTIVE` | 이용 가능, 숨김, 비활성 |
| 기준정보 상태 | `ACTIVE`, `INACTIVE` | 활성, 비활성 |
| 대여 상태 | `READY`, `READING`, `OWNED` | 읽기 전, 읽는 중, 소장 |
| 결제 상태 | `PAID` | 결제 완료 |
| 신고 상태 | `WAITING`, `PROCESSING`, `DONE`, `REJECTED` | 접수/대기, 처리 중, 완료, 반려 |
| 후보 상태 | `REQUESTED`, `IN_REVIEW`, `APPROVED`, `REJECTED` | 신청, 검토 중, 승인, 반려 |
| 쿠폰 유형 | `PERCENT_DISCOUNT`, `AMOUNT_DISCOUNT` | 비율 할인, 금액 할인 |
| 혜택 단위 | `PERCENT`, `AMOUNT` | 퍼센트, 금액 |
| 챌린지 유형 | `DAILY`, `TOTAL` | 일일, 누적 |
| 챌린지 보상 | `POINT`, `coupon` | 포인트, 쿠폰 |
| 컬렉션 유형 | `SERIES`, `EVENT` | 시리즈, 이벤트 |
| 컬렉션 상태 | `ACTIVE`, `HIDDEN`, `ENDED` | 활성, 숨김, 종료 |
| ISBN temp 상태 | `PENDING`, `READY`, `MERGED` | 수집 중, 승인 대기, 이관 완료 |

주의:

- `AdminChallengeRewardItemRequest`의 `rewardType` validation은 현재 `POINT|coupon`으로 되어 있다. 화면에서는 쿠폰 보상을 보낼 때 backend 실제 허용값인 `coupon`을 사용해야 한다.
- API spec의 보상 유형 표기와 실제 controller validation이 다를 수 있으므로 A-014는 실제 DTO 기준을 우선한다.

## 41. Admin 화면 구현 체크리스트

새 Admin 화면을 만들 때 아래를 확인한다.

- [ ] `src/pages/admin/Axxx...` 경로에 page 파일을 만들었다.
- [ ] `router.tsx`에서 `/admin/**` route를 연결했다.
- [ ] `AdminLayout` sidebar에 메뉴와 active state를 연결했다.
- [ ] `ProtectedRoute` 또는 Admin 전용 guard에서 `memberRole === 'ADMIN'`을 확인한다.
- [ ] API 호출은 `src/api/admin*.ts` wrapper로 분리했다.
- [ ] backend 미구현 API도 문서 endpoint 기준 wrapper를 만들고, dev mock/fallback/error state를 분리했다.
- [ ] Loading/Empty/Error/401/403 state가 있다.
- [ ] page/size/search/filter가 URL query와 동기화된다.
- [ ] table 화면은 `PageResponse<T>` 구조를 기준으로 처리한다.
- [ ] form 화면은 client validation 후 submit한다.
- [ ] backend `VALIDATION_ERROR`의 field message를 input 하단에 표시한다.
- [ ] 저장 성공 시 success toast와 목록/상세 재조회가 있다.
- [ ] 삭제/비활성/상태변경은 확인 modal을 거친다.
- [ ] Front 코드에 SQL, DB table 직접 접근, repository 개념이 없다.
- [ ] API spec에 없는 endpoint를 임의로 만들지 않았다.

## 42. Backend Source Reference

| 확인 대상 | 파일 |
|---|---|
| Admin 권한 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/common/config/SecurityConfig.java` |
| 공통 응답 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/common/response/ApiResponse.java` |
| 공통 페이징 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/common/response/PageResponse.java` |
| 포인트 조정 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/admin/member/controller/AdminMemberPointController.java` |
| 쿠폰 관리 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/admin/coupon/controller/AdminCouponController.java` |
| 챌린지 관리 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/admin/challenge/controller/AdminChallengeController.java` |
| 외부 도서 lookup | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/admin/book/controller/AdminBookMetadataController.java` |
| ISBN temp 관리 | `/mnt/c/AcornProject/src/main/java/com/acorn/abc/admin/book/controller/AdminBookIsbnTempController.java` |
| Admin API 설계 | `/mnt/c/AcornProject/docs/API 명세/api-spec(final).md` |
| Admin 화면 설계 | `/mnt/c/AcornProject/docs/화면흐름도/03-Admin-상세화면설계도.md` |

## 43. Route/API 적용 예시

### 43.1 router 적용 예시

```tsx
{
  path: '/admin',
  element: (
    <ProtectedRoute requireAdmin>
      <AdminLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <AdminDashboardPage /> },
    { path: 'members', element: <AdminMembersPage /> },
    { path: 'members/:memberId', element: <AdminMemberDetailPage /> },
    { path: 'books', element: <AdminBooksPage /> },
    { path: 'books/new', element: <AdminBookCreatePage /> },
    { path: 'books/:bookId/edit', element: <AdminBookEditPage /> },
    { path: 'categories', element: <AdminCategoriesPage /> },
    { path: 'rentals', element: <AdminRentalsPage /> },
    { path: 'payments', element: <AdminPaymentsPage /> },
    { path: 'reports', element: <AdminReportsPage /> },
    { path: 'book-requests', element: <AdminBookRequestsPage /> },
    { path: 'notices', element: <AdminNoticesPage /> },
    { path: 'coupons-points', element: <AdminCouponsPointsPage /> },
    { path: 'challenges', element: <AdminChallengesPage /> },
    { path: 'libraries', element: <AdminLibrariesPage /> },
    { path: 'statistics', element: <AdminStatisticsPage /> },
    { path: 'audit-logs', element: <AdminAuditLogsPage /> },
    { path: 'collections', element: <AdminCollectionsPage /> },
  ],
}
```

### 43.2 API wrapper 적용 예시

API 문서에 endpoint가 있으면 backend controller가 아직 없어도 wrapper 함수는 만든다.

```ts
import { apiClient } from './apiClient';
import type { ApiResponse, PageResponse } from '../types/api';

export type AdminMemberListParams = {
  q?: string;
  status?: 'JOINED' | 'SANCTIONED' | 'WITHDRAWN' | 'DEACTIVATED';
  role?: 'USER' | 'ADMIN';
  gradeId?: number;
  page?: number;
  size?: number;
};

export function getAdminMembers(params: AdminMemberListParams) {
  return apiClient.get<ApiResponse<PageResponse<AdminMemberSummary>>>(
    '/admin/members',
    { params }
  );
}

export function changeMemberStatus(memberId: number, body: AdminMemberStatusChangeRequest) {
  return apiClient.patch<ApiResponse<AdminMemberStatusChangeResponse>>(
    `/admin/members/${memberId}/status`,
    body
  );
}
```

실제 controller가 있는 API도 같은 방식으로 작성한다.

```ts
export function getAdminCoupons(params: AdminCouponListParams) {
  return apiClient.get<ApiResponse<PageResponse<AdminCouponSummary>>>(
    '/admin/coupons',
    { params }
  );
}

export function createAdminCoupon(body: AdminCouponCreateRequest) {
  return apiClient.post<ApiResponse<AdminCouponCreateResponse>>('/admin/coupons', body);
}

export function issueAdminCoupon(couponId: number, body: AdminCouponIssueRequest) {
  return apiClient.post<ApiResponse<AdminCouponIssueResponse>>(
    `/admin/coupons/${couponId}/issue`,
    body
  );
}
```

### 43.3 backend 미구현 API 화면 처리

| 경우 | 화면 처리 |
|---|---|
| 목록 API 미구현 | wrapper는 문서 endpoint로 만들고, 개발 중에는 `src/mocks/admin` 데이터를 page에서 주입한다 |
| 저장 API 미구현 | form validation과 request body 구성까지 구현한다. submit 시 dev mock 또는 API error state를 표시한다 |
| backend 연결 완료 | mock/fallback만 제거하고 wrapper endpoint는 유지한다 |
| API 문서에도 없음 | endpoint를 임의 생성하지 않고 `API Gap/Confirm Items`에 남긴다 |
```
