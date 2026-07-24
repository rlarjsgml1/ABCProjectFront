# Frontend CI/CD 개발자 사용 가이드

## 1. 목적

이 문서는 `rlarjsgml1/ABCProjectFront`에서 개발, review, production 배포,
rollback을 수행하는 개발자를 위한 운영 가이드다.

상세 운영 정보는 같은 디렉터리의 `CI-CD_운영.md`를 참고한다.

현재 production 기준:

- Git SHA: `72b6c898905e7b012c692d56a4de7021e8444978`
- Git tag: `prod-20260724-72b6c89`
- production URL: `https://portfoliodev.click`
- artifact: `s3://abc-demo-frontend-682fd1af/releases/<full-git-sha>/`
- live prefix: `s3://abc-demo-frontend-682fd1af/current/`
- preserved legacy release: `releases/5b13c6d/`

## 2. 전체 흐름

```text
feature branch
  -> pull request to main
  -> Frontend CI 자동 실행
  -> review 및 merge
  -> main Frontend CI 재실행
  -> 운영자가 Frontend Production CD 수동 실행
  -> GitHub OIDC로 AWS 임시 권한 획득
  -> Vite production build
  -> S3 immutable release publish
  -> current prefix로 promotion
  -> CloudFront invalidation
  -> deep-link, cache, CORS smoke
  -> production Git tag 기록
```

`main`이 배포 source of truth다. 개발자가 `dist/`를 직접 S3에 업로드하지 않는다.

## 3. Frontend CI

Workflow:

- `.github/workflows/frontend-ci.yml`
- Node.js: `22.16.0`

실행 조건:

- `main` 대상 pull request
- `main` push
- `abc_front/**`, CI/CD workflow 또는 배포 script 변경

자동 검증:

```text
npm ci
  -> production dependency audit
  -> ESLint
  -> TypeScript/Vite build
  -> dist/index.html 확인
  -> dist/assets 확인
  -> localhost API 포함 여부 확인
  -> VITE_API_BASE_URL bundle 포함 여부 확인
```

필수 check:

- `Lint and build`

현재 audit는 production dependency의 `critical` 이상을 차단한다.

## 4. 일반 개발 절차

```bash
git switch main
git pull
git switch -c feature/<작업명>

cd abc_front
npm ci
npm run lint
npm run build

git push -u origin feature/<작업명>
```

이후 GitHub에서 `feature/* -> main` pull request를 생성한다.

PR 확인 항목:

1. `Lint and build`가 성공했는가
2. `package.json` 변경 시 `package-lock.json`도 함께 변경됐는가
3. API base URL을 코드에 직접 작성하지 않았는가
4. `localhost:8080`이 production bundle에 포함되지 않는가
5. backend에 아직 없는 endpoint를 호출하지 않는가
6. `VITE_*` 값과 client secret을 혼동하지 않았는가

Frontend CI에는 path filter가 있다. 문서만 변경한 PR은 CI가 실행되지 않을 수 있다.

## 5. Production Environment 설정

GitHub `production` Environment의 deployment branch는 `main`으로 제한한다.

필수 Environment variables:

| 이름                         | 용도                        |
| ---------------------------- | --------------------------- |
| `AWS_REGION`                 | AWS region                  |
| `AWS_ROLE_ARN`               | frontend 전용 OIDC role     |
| `FRONTEND_S3_BUCKET`         | release/current bucket      |
| `CLOUDFRONT_DISTRIBUTION_ID` | invalidation 대상           |
| `FRONTEND_BASE_URL`          | production site URL         |
| `VITE_API_BASE_URL`          | production backend API URL  |
| `VITE_NAVER_MAP_CLIENT_ID`   | Naver Map browser client ID |

`VITE_*`는 browser bundle에 포함되는 공개 설정이다.

다음 값은 등록하지 않는다.

- OAuth client secret
- Naver client secret
- AWS Access Key
- AWS Secret Access Key
- backend `.env`

Google login frontend 구현 시 `VITE_GOOGLE_CLIENT_ID`를 Environment variable과
production bundle 검증 대상에 추가한다.

## 6. Production 배포

배포 전 최신 `main` full SHA를 확인한다.

```bash
git fetch origin
git rev-parse origin/main
```

GitHub에서 다음 순서로 실행한다.

```text
Actions
  -> Frontend Production CD
  -> Run workflow
  -> branch: main
```

입력:

| 입력                 | 값                                |
| -------------------- | --------------------------------- |
| `operation`          | `deploy`                          |
| `confirm_production` | `true`                            |
| `confirm_release`    | 현재 main의 full 40-character SHA |

주의:

- 과거 main SHA가 아니라 실행 시점의 최신 main SHA를 입력한다.
- SHA 확인 후 main이 변경됐으면 SHA를 다시 확인한다.
- 해당 SHA의 `Lint and build`가 성공하지 않았으면 CD가 중단된다.

## 7. Frontend CD 내부 동작

Production CD는 다음 순서로 실행된다.

1. `main`, production 확인, full SHA와 필수 variable을 검증한다.
2. 해당 SHA의 Frontend CI 성공을 확인한다.
3. production Environment variables로 Vite build를 수행한다.
4. GitHub OIDC로 frontend 전용 AWS role을 assume한다.
5. build 결과를 `releases/<full-sha>/`에 publish한다.
6. local manifest와 remote 전체 content를 검증한다.
7. manifest를 마지막 commit marker로 저장한다.
8. `current/`에 non-index 파일과 asset을 먼저 promotion한다.
9. `index.html`을 마지막에 교체한다.
10. CloudFront invalidation 완료까지 기다린다.
11. deep-link, cache header, backend CORS를 검증한다.
12. immutable production Git tag를 생성한다.

같은 SHA release가 이미 있으면 remote manifest와 content가 완전히 같은 경우만
재사용한다. 같은 SHA prefix를 다른 content로 덮어쓰지 않는다.

Manifest 없이 일부 object만 존재하면 모든 object가 local build의 byte-identical
subset인 경우에만 publish를 재개한다.

## 8. Cache 정책

| 대상         | Cache-Control                       |
| ------------ | ----------------------------------- |
| `index.html` | `no-cache,no-store,must-revalidate` |
| hashed asset | `public,max-age=31536000,immutable` |
| 기타 파일    | `no-cache`                          |

`index.html`을 마지막에 교체하는 이유는 browser가 아직 업로드되지 않은 새 asset을
요청하는 상황을 방지하기 위해서다.

기존 `current/assets`의 오래된 hashed asset은 기존 browser cache 호환을 위해
배포 시 바로 삭제하지 않는다.

## 9. Production smoke

CD가 자동 확인하는 항목:

- `/`
- `/login`
- `/books`
- SPA deep-link 응답
- `index.html` cache header
- hashed asset immutable cache header
- production origin의 backend CORS
- `www` origin의 backend CORS

Workflow 성공 후에도 실제 주요 사용자 흐름을 확인한다.

예:

- 로그인 화면 진입
- 도서 목록 조회
- 도서 상세 진입
- 사용자 인증이 필요한 기능의 오류 여부

## 10. Rollback

Frontend는 기존 immutable release를 다시 `current/`로 promotion할 수 있다.

GitHub에서 `Frontend Production CD`를 실행한다.

입력:

| 입력                 | 값                           |
| -------------------- | ---------------------------- |
| `operation`          | `rollback`                   |
| `confirm_production` | `true`                       |
| `confirm_release`    | 이전 full SHA 또는 `5b13c6d` |

Rollback 과정:

```text
releases/<release-id>/index.html 존재 확인
  -> assets/non-index 먼저 promotion
  -> index.html 마지막 교체
  -> CloudFront invalidation
  -> deep-link, cache, CORS smoke
```

주의:

- rollback 대상은 이미 존재하는 immutable release여야 한다.
- 다른 repository의 commit SHA를 입력하면 안 된다.
- frontend rollback 전에 현재 backend API와 호환되는지 확인한다.
- `5b13c6d`는 최초 수동 배포본으로 돌아갈 때만 사용한다.

## 11. Backend와 같이 변경될 때

기본 배포 순서:

```text
DB migration 필요 여부 확인
  -> migration이 필요하면 선행 적용
  -> Backend 배포
  -> Backend health와 API 확인
  -> Frontend 배포
  -> end-to-end 기능 확인
```

Frontend를 먼저 배포하면 아직 없는 backend endpoint를 호출해 사용자 화면이
깨질 수 있다.

필요하면 backend 기능을 feature flag OFF 상태로 먼저 배포한 뒤 frontend 배포 후
flag를 활성화한다.

## 12. 보안 및 운영 유의사항

- GitHub Secrets에 장기 AWS credential을 저장하지 않는다.
- GitHub OIDC 임시 credential만 사용한다.
- `dist/`를 commit하거나 수동 업로드하지 않는다.
- S3 `current/`를 개발자가 직접 수정하지 않는다.
- `releases/<sha>/` object를 수정하거나 덮어쓰지 않는다.
- production tag를 다른 commit으로 이동하거나 재사용하지 않는다.
- `VITE_*`에 server secret을 넣지 않는다.
- main push가 자동 production 배포를 발생시키지 않는다.
- production 배포 concurrency는 직렬이며 진행 중인 배포를 취소하지 않는다.

현재 non-blocking 항목:

- ESLint warning 2건
- `epubjs`와 관련 dependency의 high advisory
- `react-router-dom` moderate advisory
- GitHub Actions 일부 action의 Node.js runtime deprecation warning

## 13. 배포 체크리스트

### 배포 전

- [ ] PR review 완료
- [ ] `Lint and build` 성공
- [ ] 현재 main full SHA 확인
- [ ] backend API 선행 배포 여부 확인
- [ ] production Environment variables 확인
- [ ] rollback 대상 release 확인

### 배포 후

- [ ] Frontend Production CD 성공
- [ ] `/`, `/login`, `/books` 응답 확인
- [ ] SPA deep-link 확인
- [ ] API CORS 확인
- [ ] `index.html` no-cache 확인
- [ ] hashed asset immutable cache 확인
- [ ] production Git tag 생성 확인
- [ ] 주요 사용자 기능 확인
