# Frontend CI/CD 운영

## 배포 구조

- source: `rlarjsgml1/ABCProjectFront`의 `main`
- app working directory: `abc_front/`
- artifact: `s3://abc-demo-frontend-682fd1af/releases/<full-git-sha>/`
- live prefix: `s3://abc-demo-frontend-682fd1af/current/`
- CloudFront: `E7F3SFWM7Z6KF`
- production URL: `https://portfoliodev.click`
- preserved manual baseline: `releases/5b13c6d/`

PR과 `main` push에서는 `Frontend CI`가 `npm ci`, production dependency audit,
lint, TypeScript/Vite build를 수행한다. Production 변경은 `Frontend Production CD`를
수동 실행할 때만 발생한다.

## GitHub Environment variables

첫 workflow 실행 전에 repository admin이 `production` Environment를 생성하고 deployment
branch를 `main`으로만 제한한다. 이 설정이 완료되기 전에는 Production CD를 실행하지 않는다.
AWS role trust도 immutable repository identity와 `environment:production` subject만 허용한다.

`production` Environment에 다음 non-secret variable을 둔다.

| 이름                         | 값                                      |
| ---------------------------- | --------------------------------------- |
| `AWS_REGION`                 | `ap-northeast-2`                        |
| `AWS_ROLE_ARN`               | frontend 전용 OIDC role ARN             |
| `FRONTEND_S3_BUCKET`         | `abc-demo-frontend-682fd1af`            |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E7F3SFWM7Z6KF`                         |
| `FRONTEND_BASE_URL`          | `https://portfoliodev.click`            |
| `VITE_API_BASE_URL`          | `https://api.portfoliodev.click/api/v1` |
| `VITE_NAVER_MAP_CLIENT_ID`   | NCP Dynamic Map browser client ID       |

`VITE_*` 값은 browser bundle에 포함되는 공개 설정이다. Client secret, AWS access key,
backend secret은 등록하지 않는다.

## Production deploy

1. 대상 `main` SHA의 `Frontend CI` 성공을 확인한다.
2. `Frontend Production CD`를 `main`에서 실행한다.
3. `operation=deploy`, `confirm_production=true`를 선택한다.
4. `confirm_release`에 현재 `main`의 full 40-character SHA를 입력한다.
5. release upload, assets-first promotion, `index.html` last promotion, CloudFront
   invalidation, deep-link/cache/CORS smoke가 모두 성공해야 배포가 완료된다.

새 release prefix에 manifest가 있으면 local manifest와 원격 전체 content가 완전히 같은
경우만 재사용한다. Manifest 없이 일부 object만 남은 실패 release는 모든 원격 object가
local build의 byte-identical subset인 경우에만 upload를 재개한다. 전체 content 검증이
끝난 뒤 manifest를 마지막 commit marker로 기록한다. 다른 content로 같은 SHA prefix를
덮어쓰지 않는다.

## Rollback

1. 대상 `releases/<release-id>/index.html`이 존재하는지 확인한다.
2. `operation=rollback`, `confirm_production=true`를 선택한다.
3. `confirm_release`에 full SHA를 입력한다.
4. 최초 수동 배포본으로 되돌릴 때만 preserved legacy ID `5b13c6d`를 사용할 수 있다.

Rollback도 assets-first, `index.html` last, CloudFront invalidation과 smoke 검증을 동일하게
수행한다. `current/assets`의 이전 hashed asset은 기존 browser cache와의 호환을 위해
첫 단계에서 삭제하지 않는다.

## 알려진 non-blocking 항목

- 현재 lint warning 2건은 error가 아니어서 CI를 통과한다.
- production dependency audit에는 `epubjs`/`@xmldom/xmldom` high와
  `react-router-dom` moderate가 있다. 현재 CI는 critical 이상을 차단한다.
  Major-version 호환성 검증이 필요한 dependency upgrade는 별도 작업으로 처리한다.
