# ABC Admin Front 분업표

## 1. 목적

Admin Front 화면 `A-001`~`A-018` 구현을 건희, 해든, 해수 3명에게 나누기 위한 작업 분배 기준이다.

기준 문서:

- `ABC_front_Admin_화면.md`
- backend `api-spec(final).md`
- backend `03-Admin-상세화면설계도.md`

## 2. 분배 원칙

| 원칙 | 내용 |
|---|---|
| 건희 | 조회형/목록형/read-only 화면 위주 배정 |
| 해든 | 회원, 신고, 희망도서, 쿠폰/포인트, 챌린지처럼 운영 처리와 상태 변경이 많은 화면 배정 |
| 해수 | 도서, 카테고리, 도서관, 컬렉션처럼 form과 catalog 구조가 복잡한 화면 배정 |
| 공통 | 모든 화면은 `AdminLayout`, admin guard, `apiClient`, 공통 loading/empty/error 상태를 따른다 |
| 금지 | Front에서 DB 직접 접근 금지. API spec에 없는 endpoint 임의 생성 금지 |

## 3. 담당자별 요약

| 담당자 | 화면 수 | 담당 영역 |
|---|---:|---|
| 건희 | 6 | 대시보드, 조회형 목록, 공지, 통계, 감사 로그 |
| 해든 | 6 | 회원 운영, 신고 처리, 희망도서, 쿠폰/포인트, 챌린지 |
| 해수 | 6 | 도서 catalog, 도서 등록/수정, 카테고리, 도서관, 컬렉션 |

## 4. 전체 화면 분업표

| ID | 화면명 | Route | 담당자 | 주요 API | 작업 범위 |
|---|---|---|---|---|---|
| A-001 | 관리자 대시보드 | `/admin` | 건희 | `GET /api/v1/admin/dashboard` | KPI 카드, 최근 신고/희망도서/결제 목록, 빠른 작업 링크 |
| A-002 | 회원 목록 관리 | `/admin/members` | 해든 | `GET /api/v1/admin/members`, `PATCH /api/v1/admin/members/{memberId}/status` | 회원 검색/필터/목록, 상태 변경 modal |
| A-003 | 회원 상세/상태 관리 | `/admin/members/:memberId` | 해든 | `GET /api/v1/admin/members/{memberId}`, `PATCH /status`, `POST /points` | 상세 정보, 탭, 상태 변경, 포인트 조정 |
| A-004 | 도서 목록 관리 | `/admin/books` | 해수 | `GET /api/v1/admin/books`, `PATCH /api/v1/admin/books/{bookId}/status` | 도서 검색/필터/목록, 상태 변경, 등록/수정 이동 |
| A-005 | 도서 등록 | `/admin/books/new` | 해수 | `POST /api/v1/admin/books`, `PATCH /api/v1/admin/book-request-candidates/{candidateId}/status` | 도서 등록 form, 저자/카테고리/본문 페이지 입력 |
| A-006 | 도서 수정 | `/admin/books/:bookId/edit` | 해수 | `PUT /api/v1/admin/books/{bookId}`, `PATCH /status` | 기존 도서 수정 form, 상태 변경, API gap 확인 |
| A-007 | 카테고리 관리 | `/admin/categories` | 해수 | `GET /api/v1/admin/categories`, `PUT /api/v1/admin/categories/{categoryId}` | 카테고리 트리, 편집 panel, 순서/상태 관리 |
| A-008 | 대여 현황 관리 | `/admin/rentals` | 건희 | `GET /api/v1/admin/rentals` | 조회 전용 목록, 필터, 상세 panel |
| A-009 | 결제 관리 | `/admin/payments` | 건희 | `GET /api/v1/admin/payments` | 완료 결제 목록, 날짜 필터, 상세 modal |
| A-010 | 신고 관리 | `/admin/reports` | 해든 | `GET /api/v1/admin/reports`, `PATCH /api/v1/admin/reports/{targetType}/{reportId}/status` | 신고 목록/상세/처리, 리뷰 숨김, 제재 입력 |
| A-011 | 희망도서 관리 | `/admin/book-requests` | 해든 | `GET /api/v1/admin/book-request-candidates`, `PATCH /status` | 후보 목록, 신청자 상세, 승인/반려, 도서 등록 연결 |
| A-012 | 공지 관리 | `/admin/notices` | 건희 | `GET /api/v1/admin/notices`, `POST /api/v1/admin/notices`, `PUT /api/v1/admin/notices/{noticeId}` | 공지 목록, 등록/수정 form, 숨김 처리 |
| A-013 | 쿠폰/포인트 관리 | `/admin/coupons-points` | 해든 | `GET/POST /api/v1/admin/coupons`, `POST /issue`, `POST /members/{memberId}/points` | 쿠폰 정의/발급, 회원 검색, 포인트 조정 |
| A-014 | 챌린지 관리 | `/admin/challenges` | 해든 | `GET /api/v1/admin/challenges`, `PUT /api/v1/admin/challenges/{challengeId}` | 챌린지 목록/등록/수정, 보상 설정 |
| A-015 | 도서관 위치 관리 | `/admin/libraries` | 해수 | `GET /api/v1/admin/libraries`, `PUT /api/v1/admin/libraries/{libraryId}`, `PUT /books` | 도서관 목록/편집, 보유 도서 매핑 |
| A-016 | 통계 관리 | `/admin/statistics` | 건희 | `GET /api/v1/admin/statistics` | 기간/나이대 필터, KPI, 그래프/요약 표시 |
| A-017 | 관리자 감사 로그 | `/admin/audit-logs` | 건희 | `GET /api/v1/admin/audit-logs` | 조회 전용 목록, 필터, 상세 modal |
| A-018 | 컬렉션 관리 | `/admin/collections` | 해수 | `GET/PUT/PATCH /api/v1/admin/collections` | 컬렉션 목록/편집, 도서 추가/정렬/제외 |

## 5. 건희 작업 상세

건희는 조회형 화면부터 처리한다. API 호출, table, filter, pagination, empty/error state를 먼저 맞추는 영역이다.

| 우선순위 | ID | 화면 | 먼저 구현할 것 | 나중에 보강할 것 |
|---:|---|---|---|---|
| 1 | A-017 | 관리자 감사 로그 | 조회 table, 필터, 상세 modal | 긴 변경 전/후 내용 formatting |
| 2 | A-008 | 대여 현황 관리 | 조회 table, 상태 필터, 상세 panel | 회원/도서 링크 연결 |
| 3 | A-009 | 결제 관리 | 결제 목록, 날짜 필터, 상세 modal | 금액 formatting, 0원 결제 표시 |
| 4 | A-001 | 관리자 대시보드 | KPI 카드, 최근 목록 | 빠른 작업 link, error state |
| 5 | A-016 | 통계 관리 | 기간 필터, KPI 표시 | 그래프, 나이대 필터 |
| 6 | A-012 | 공지 관리 | 공지 목록, 등록 form | 수정/숨김, notifyYn 처리 |

### 건희 주의사항

| 항목 | 기준 |
|---|---|
| 조회형 화면 | 임시 mock 고정값으로 끝내지 말고 admin API wrapper 연결 기준으로 작성 |
| 날짜/금액 | 공통 formatter 사용 |
| table | page, size, totalElements, empty state 처리 |
| 공지 | `notifyYn=true`는 알림 생성 여부만 전달. 알림 본문 입력 UI 만들지 않음 |
| 결제 | 환불/취소 버튼 만들지 않음 |
| 대여 | 반납/연체/상태 변경 버튼 만들지 않음 |

## 6. 해든 작업 상세

해든은 회원과 운영 처리 중심이다. 상태 변경, modal, validation, 사유 입력이 많다.

| 우선순위 | ID | 화면 | 핵심 작업 | 주의사항 |
|---:|---|---|---|---|
| 1 | A-002 | 회원 목록 관리 | 검색/필터/table, 상태 변경 modal | `SANCTIONED`일 때 제재 정보 입력 |
| 2 | A-003 | 회원 상세/상태 관리 | 상세 조회, 탭, 포인트 조정 | 관리자 비밀번호 조회/변경 UI 금지 |
| 3 | A-010 | 신고 관리 | 신고 목록/상세/처리 modal | 리뷰 신고에서만 `hideReviewYn`, 제재 옵션 표시 |
| 4 | A-011 | 희망도서 관리 | 후보 목록/상세, 승인/반려 | `IN_REVIEW` 처리 API 지원 여부 확인 |
| 5 | A-013 | 쿠폰/포인트 관리 | 쿠폰 목록/등록/발급, 포인트 조정 | 포인트 잔액 음수 금지, 회원 검색 API 확인 |
| 6 | A-014 | 챌린지 관리 | 챌린지 목록/편집, 보상 설정 | 보상 쿠폰 목록 API 연결 확인 |

### 해든 주의사항

| 항목 | 기준 |
|---|---|
| 회원 상태 | `JOINED`, `SANCTIONED`, `WITHDRAWN`, `DEACTIVATED`만 사용 |
| 제재 | `sanctionType`, `startedAt`, `endedAt`, `reason` 누락 금지 |
| 신고 상태 | `WAITING`, `PROCESSING`, `DONE`, `REJECTED`만 사용 |
| 포인트 | `ADMIN_ADJUST`는 backend 처리. Front는 금액과 사유 전달 |
| 쿠폰 | 포인트 만료 UI 만들지 않음. 쿠폰 만료만 표시 |
| 희망도서 | 없는 endpoint 임의 생성하지 말고 gap item으로 남김 |

## 7. 해수 작업 상세

해수는 도서 catalog와 복합 form 중심이다. form state, 동적 row, 상태 변경, 관련 API gap 확인이 많다.

| 우선순위 | ID | 화면 | 핵심 작업 | 주의사항 |
|---:|---|---|---|---|
| 1 | A-004 | 도서 목록 관리 | 검색/필터/table, 상태 변경 | User 노출은 `AVAILABLE`만 |
| 2 | A-007 | 카테고리 관리 | 카테고리 tree, 편집 panel | 신규 등록 endpoint 확인 |
| 3 | A-005 | 도서 등록 | 도서 form, 저자/페이지 동적 row | PDF/EPUB 업로드 UI 금지 |
| 4 | A-006 | 도서 수정 | 기존 값 로드, 수정 form | Admin 단건 조회 API gap 확인 |
| 5 | A-015 | 도서관 위치 관리 | 도서관 form, 보유 도서 매핑 | 실물 대여/예약 UI 금지 |
| 6 | A-018 | 컬렉션 관리 | 컬렉션 form, 도서 추가/정렬/제외 | 도서 자체 삭제와 컬렉션 제외 구분 |

### 해수 주의사항

| 항목 | 기준 |
|---|---|
| 도서 상태 | `AVAILABLE`, `HIDDEN`, `INACTIVE`만 사용 |
| 유료 도서 | `rentalType=PAID`이면 `rentalPrice > 0` |
| 무료 도서 | `rentalType=FREE`이면 `rentalPrice = 0` |
| 전자책 본문 | `BOOK_PAGE.page_content` 텍스트 본문 기준. 파일 업로드 금지 |
| 컬렉션 | `SERIES`, `EVENT`; 상태는 `ACTIVE`, `HIDDEN`, `ENDED` |
| 도서관 | 좌표는 null 허용, 입력 시 숫자 validation |

## 8. 공통 선행 작업

| 작업 | 담당 추천 | 내용 | 완료 기준 |
|---|---|---|---|
| Admin route guard | 해든 | `/admin/**` 접근 시 token과 `memberRole=ADMIN` 검사 | USER 접근 차단, 미로그인 login 이동 |
| AdminLayout/sidebar | 해수 | 상단 bar, sidebar, active menu | A-001~A-018 메뉴 모두 노출 |
| Admin API wrapper 규칙 | 해든 | `src/api/admin*.ts` naming/paging/error 기준 정리 | 각 담당자가 같은 방식으로 API 추가 가능 |
| 공통 table/filter pattern | 건희 | 조회형 화면에서 쓸 table, empty, pagination pattern 정리 | A-008/A-009/A-017에 먼저 적용 |
| 공통 modal/toast pattern | 해든 | 상태 변경/상세/처리 modal, success/error toast | A-002/A-010에 먼저 적용 |

## 9. 담당자별 체크리스트

### 공통 체크리스트

| 체크 | 기준 |
|---|---|
| Route 등록 | 각 화면 route가 `/admin/**` 아래 등록됨 |
| Guard 적용 | 일반 회원/비로그인 접근 차단 |
| API wrapper | page component 안에서 URL 문자열을 남발하지 않음 |
| Loading | 첫 조회 시 loading state 표시 |
| Empty | 목록이 비었을 때 안내 문구 표시 |
| Error | 401/403/server error 구분 처리 |
| Validation | client validation + backend field error 표시 |
| Pagination | page/size/query가 URL query와 동기화됨 |
| No DB | SQL, table 직접 접근, repository 개념 없음 |

### 개인별 완료 기준

| 담당자 | 완료 기준 |
|---|---|
| 건희 | A-001/A-008/A-009/A-012/A-016/A-017 route, API 호출, 목록/카드/필터/empty/error 처리 완료 |
| 해든 | A-002/A-003/A-010/A-011/A-013/A-014 route, 상태 변경/처리 modal, validation, API gap 정리 완료 |
| 해수 | A-004/A-005/A-006/A-007/A-015/A-018 route, 복합 form, 동적 row, 상태 변경, API gap 정리 완료 |

## 10. 작업 순서 제안

1. 공통 route guard, `AdminLayout`, sidebar를 먼저 맞춘다.
2. 건희가 A-017, A-008, A-009로 table/filter pattern을 만든다.
3. 해든이 A-002로 상태 변경 modal pattern을 만든다.
4. 해수가 A-004/A-007로 catalog filter와 tree/edit pattern을 만든다.
5. 각자 나머지 담당 화면을 같은 pattern으로 확장한다.
6. 마지막에 A-001 dashboard와 A-016 statistics link를 전체 route 기준으로 연결한다.

## 11. API Gap 담당

| Gap | 담당자 | 확인 내용 |
|---|---|---|
| 회원 등급 필터 옵션 | 해든 | `API-ADMIN-MEMBER-001` 응답으로 처리 가능한지 확인 |
| Admin 도서 단건 조회 | 해수 | A-006 초기값 로딩 endpoint 필요 여부 확인 |
| 카테고리 신규 등록 | 해수 | `PUT /admin/categories/{categoryId}`로 신규 등록 가능한지 확인 |
| 희망도서 `IN_REVIEW` | 해든 | `API-ADMIN-REQUEST-002`가 검토 시작을 지원하는지 확인 |
| 포인트 회원 검색 | 해든 | `API-ADMIN-MEMBER-001` 재사용 여부 확인 |
| 보상 쿠폰 선택 | 해든 | `API-ADMIN-COUPON-001` 재사용 여부 확인 |
| 도서관 보유 도서 검색 | 해수 | `API-ADMIN-BOOK-001` 재사용 여부 확인 |
| 컬렉션 도서 검색 | 해수 | `API-ADMIN-BOOK-001` 재사용 여부 확인 |
| 페이징 0/1 기준 | 공통 | backend 실제 구현 기준 확인 후 adapter에서 통일 |
