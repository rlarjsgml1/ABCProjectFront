# 로컬 개발 환경 DB 연결 가이드

## 1. MySQL 준비
1. MySQL 8.x 실행 확인 (포트 3306)
2. MySQL Workbench로 접속
   - Hostname: `127.0.0.1`
   - Port: `3306`
   - Username: `root`
   - Password: 로컬에 설정한 MySQL root 비밀번호
3. Query 창에서 데이터베이스 생성
   ```sql
   CREATE DATABASE ABC;
   ```
   (schema.sql / data.sql은 직접 실행할 필요 없음 — 백엔드 기동 시 자동 적용됨)

## 2. 백엔드 설정 및 실행
Backend root: `C:\AcornProject`

`.env` 파일 생성 (`.env.example` 참고):
```properties
DB_URL=jdbc:mysql://localhost:3306/ABC?useSSL=false&serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=본인_MySQL_root_비밀번호
JWT_SECRET=로컬_개발용_32자_이상_랜덤_문자열
JWT_EXPIRATION=86400
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

실행:
```
cd C:\AcornProject
.\gradlew.bat bootRun --console=plain
```
(WSL: `cd /mnt/c/AcornProject && ./gradlew bootRun`)

`Started AbcApplication in X seconds` 로그가 에러 없이 뜨면 정상.

## 3. 프론트엔드 설정 및 실행
Front root: `C:\AcornPrjectFrontABC\abc_front`

`.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

실행:
```
cd C:\AcornPrjectFrontABC\abc_front
npm install
npm run dev
```

## 4. 회원가입/로그인 테스트 흐름
1. `http://localhost:5173/signup` 접속 → 회원가입
2. 성공 시 `/login`으로 이동
3. 로그인 성공 시 `/`로 이동, Header가 로그인 상태로 전환

## 참고
- `member_grade`의 기본 `grade_id=1`(씨앗 등급) seed가 있어야 회원가입 성공
- `.env` 파일은 git에 커밋되지 않음 (민감정보 포함)
