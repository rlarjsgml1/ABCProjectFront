# 로컬 개발 환경 DB 연결 가이드

이 문서는 처음 프로젝트를 받는 팀원이 로컬에서 `회원가입 → 로그인`까지 바로 확인할 수 있도록 만든 실행 순서입니다.

## 0. 사전 준비

| 항목 | 필요 조건 | 확인 방법 |
|---|---|---|
| MySQL | 8.x, port `3306` | MySQL Workbench 접속 또는 `mysql --version` |
| JDK | 백엔드 실행 가능 버전 | `java -version` |
| Node.js / npm | 프론트 실행 가능 버전 | `node -v`, `npm -v` |
| Backend root | `C:\AcornProject` | `gradlew.bat`, `src/`가 보여야 함 |
| Frontend root | `C:\AcornPrjectFrontABC\abc_front` | `package.json`, `src/`가 보여야 함 |

> `AcornPrjectFrontABC`는 실제 폴더명이므로 철자를 그대로 사용합니다.

## 1. MySQL 데이터베이스 생성

1. MySQL 8.x가 실행 중인지 확인합니다.
2. MySQL Workbench에서 접속합니다.
   - Hostname: `127.0.0.1`
   - Port: `3306`
   - Username: `root`
   - Password: 본인 로컬 MySQL root 비밀번호
3. Query 창에서 데이터베이스를 생성합니다.

```sql
CREATE DATABASE IF NOT EXISTS ABC
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;
```

4. 생성 확인:

```sql
SHOW DATABASES LIKE 'ABC';
```

`ABC`가 보이면 다음 단계로 이동합니다.

## 2. 백엔드 `.env` 설정

Backend root: `C:\AcornProject`

1. `C:\AcornProject\.env.example`을 같은 폴더에 `.env`로 복사합니다.
2. `.env` 내용을 로컬 환경에 맞게 설정합니다.

```properties
DB_URL=jdbc:mysql://localhost:3306/ABC?useSSL=false&serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=본인_MySQL_root_비밀번호

# JWT
JWT_SECRET=로컬_개발용_시크릿_키_32자_이상으로_설정하세요
JWT_EXPIRATION=86400

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# 외부 도서 API 키가 없으면 false 유지
INFONARU_KEY=
NAVER_CLIENT_ID_1=
NAVER_CLIENT_SECRET_1=
ALADIN_TTB_KEY_1=
BOOK_API_TIMEOUT_MS=5000
BOOK_API_ENABLED=false
```

주의:
- `.env`는 반드시 `C:\AcornProject` 바로 아래에 둡니다.
- `.env`는 민감정보를 포함하므로 git에 커밋하지 않습니다.
- 외부 도서 API 키가 없어도 로컬 회원가입/로그인 확인은 가능합니다. 이 경우 `BOOK_API_ENABLED=false`로 둡니다.

## 3. 백엔드 실행

### Windows PowerShell

```powershell
cd C:\AcornProject
.\gradlew.bat bootRun --console=plain
```

### WSL

```bash
cd /mnt/c/AcornProject
./gradlew bootRun
```

정상 기준:
- 콘솔에 `Started AbcApplication in ... seconds`가 표시됩니다.
- 큰 에러 없이 프로세스가 계속 실행 중이어야 합니다.
- 백엔드는 기본적으로 `http://localhost:8080`에서 실행됩니다.

DB 초기화 기준:
- 백엔드 실행 시 `src/main/resources/schema.sql`, `src/main/resources/data.sql`이 자동 적용됩니다.
- 설정 근거는 `spring.sql.init.mode=always`, `schema-locations=classpath:schema.sql`, `data-locations=classpath:data.sql`입니다.
- 따라서 `schema.sql`, `data.sql`을 Workbench에서 직접 실행할 필요는 없습니다.

## 4. 기본 seed 확인

회원가입은 기본 회원등급 seed가 있어야 성공합니다.

Workbench에서 아래 SQL을 실행합니다.

```sql
USE ABC;
SELECT * FROM member_grade WHERE grade_id = 1;
```

정상 기준:
- `grade_id = 1` row가 조회됩니다.
- 보통 씨앗/기본 등급 데이터입니다.

조회되지 않으면:
- 백엔드가 정상 기동되었는지 확인합니다.
- `src/main/resources/data.sql` 자동 적용 중 에러가 있었는지 백엔드 콘솔 로그를 확인합니다.

## 5. 프론트엔드 `.env` 설정

Frontend root: `C:\AcornPrjectFrontABC\abc_front`

1. `C:\AcornPrjectFrontABC\abc_front\.env.example`을 같은 폴더에 `.env`로 복사합니다.
2. `.env` 내용을 확인합니다.

```properties
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

백엔드 port를 바꾸지 않았다면 위 값 그대로 사용합니다.

## 6. 프론트엔드 실행

### Windows PowerShell

```powershell
cd C:\AcornPrjectFrontABC\abc_front
npm install
npm run dev
```

### WSL

```bash
cd /mnt/c/AcornPrjectFrontABC/abc_front
npm install
npm run dev
```

정상 기준:
- Vite dev server가 실행됩니다.
- 기본 접속 주소는 `http://localhost:5173`입니다.

## 7. 회원가입/로그인 확인

1. 브라우저에서 `http://localhost:5173/signup` 접속
2. 회원가입 정보 입력 후 제출
3. 성공 시 `/login`으로 이동
4. 가입한 계정으로 로그인
5. 성공 시 `/`로 이동하고 Header가 로그인 상태로 전환되는지 확인

회원가입이 실패하면 먼저 아래를 확인합니다.
- 백엔드가 `localhost:8080`에서 실행 중인지
- 프론트 `.env`의 `VITE_API_BASE_URL`이 `http://localhost:8080/api/v1`인지
- MySQL `ABC` 데이터베이스가 있는지
- `member_grade`의 `grade_id = 1` seed가 있는지

## 8. 자주 나는 오류

### `Access denied ... (using password: NO)`

원인:
- 백엔드가 `DB_PASSWORD`를 읽지 못했습니다.

확인:
- `.env`가 `C:\AcornProject\.env` 위치에 있는지
- `DB_PASSWORD`가 비어 있지 않은지
- PowerShell/터미널을 backend root에서 실행했는지

임시 실행 방법:

```powershell
cd C:\AcornProject
$env:DB_PASSWORD = "본인_MySQL_root_비밀번호"
.\gradlew.bat bootRun --console=plain
```

### `Unknown database 'ABC'`

원인:
- `ABC` 데이터베이스를 만들지 않았습니다.

해결:

```sql
CREATE DATABASE IF NOT EXISTS ABC
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;
```

### 회원가입 시 500 error

확인:
- 백엔드 콘솔 로그 확인
- `member_grade` seed 확인
- `schema.sql`, `data.sql` 자동 적용 로그 확인

```sql
USE ABC;
SELECT * FROM member_grade WHERE grade_id = 1;
```

### 프론트에서 Network Error 또는 CORS error

확인:
- 백엔드가 `http://localhost:8080`에서 실행 중인지
- 프론트 `.env`의 `VITE_API_BASE_URL` 값이 맞는지
- 백엔드 `.env`의 `CORS_ALLOWED_ORIGINS`에 `http://localhost:5173`이 포함되어 있는지

### `npm run dev`는 되지만 API 호출이 실패함

확인:
- 프론트 dev server 주소: `http://localhost:5173`
- 백엔드 API 주소: `http://localhost:8080/api/v1`
- 브라우저 개발자 도구 Network 탭에서 요청 URL이 `localhost:8080/api/v1/...`인지 확인

## 9. 실행 순서 요약

1. MySQL 실행
2. `ABC` 데이터베이스 생성
3. `C:\AcornProject\.env` 작성
4. 백엔드 실행
5. `member_grade` seed 확인
6. `C:\AcornPrjectFrontABC\abc_front\.env` 작성
7. 프론트 실행
8. `/signup`에서 회원가입
9. `/login`에서 로그인
