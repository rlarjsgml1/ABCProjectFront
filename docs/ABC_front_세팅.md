# ABC Front GitHub 협업 세팅 가이드

> 대상: GitHub에서 받은 `abc-front`만 실행하는 팀원  
> 기준 경로: `C:\AcornProject\AcornProject\abc-front`  
> 화면 구현 상세: `ABC_front_화면.md`

## 1. 핵심 요약

이 문서는 Front만 세팅하고 실행하는 절차를 다룬다.

| 확인 항목 | 내용 |
|---|---|
| Front stack | `React`, `Vite`, `TypeScript`, `React Router`, `Axios` |
| 실행 위치 | `abc-front` 폴더 |
| 설치 명령 | `npm install` |
| 실행 명령 | `npm run dev` |
| 접속 URL | `http://localhost:5173` |
| API Base URL | `http://localhost:8080/api/v1` |

검증된 현재 repo 상태는 아래와 같다.

1. `abc-front/package.json`과 `abc-front/package-lock.json`은 GitHub에 포함되어 있다.
2. 팀원은 새 Vite 프로젝트를 생성하지 않는다.
3. `abc-front/.env`는 이 프로젝트의 GitHub에 이미 포함되어 있다.
4. 팀원은 `.env`를 따로 만들지 않는다.

## 2. 사전 설치

Windows PowerShell에서 아래 명령으로 확인한다.

| 항목 | 확인 명령 |
|---|---|
| Node.js LTS | `node -v` |
| npm | `npm -v` |
| Git | `git --version` |

## 3. 처음 clone하는 경우

PowerShell에서 진행한다.

```powershell
cd C:\AcornProject
git clone <GitHub repository URL>
cd C:\AcornProject\AcornProject\abc-front
npm install
npm run dev
```

clone 위치가 다르면 `cd` 경로만 본인 PC에 맞게 바꾼다.

브라우저에서 접속한다.

```text
http://localhost:5173
```

## 4. 이미 clone한 repo를 최신화하는 경우

PowerShell에서 기존 Front 폴더로 이동한 뒤 최신 코드를 받는다.

```powershell
cd C:\AcornProject\AcornProject\abc-front
git pull
npm install
npm run dev
```

브라우저에서 다시 확인한다.

```text
http://localhost:5173
```

## 5. `.env` 확인

`abc-front/.env`는 이미 GitHub에 포함되어 있다. 새로 만들지 말고 값만 확인한다.

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

API 호출 코드는 이 값을 기준으로 동작해야 한다. Front 코드에서 `http://localhost:8080/api/v1`을 직접 반복해서 쓰지 않는다.

## 6. Backend 연결 범위

Front 화면을 실행하는 것과 Backend DB 세팅은 별개다.

1. Front 개발 서버는 `npm run dev`로 실행한다.
2. 실제 API 데이터를 보려면 Backend가 `8080` 포트에서 실행 중이어야 한다.
3. 이 문서는 Backend DB, MySQL, secret 세팅을 다루지 않는다.

## 7. WSL `node_modules` 문제 해결

Windows PowerShell에서 실행할 프로젝트는 PowerShell에서 `npm install`을 맞추는 편이 안전하다.

WSL에서 설치한 뒤 PowerShell에서 `vite`를 못 찾거나 실행이 꼬이면 `node_modules`를 삭제하고 다시 설치한다.

```powershell
cd C:\AcornProject\AcornProject\abc-front
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

## 8. Front 관련 파일과 폴더

화면별 route, API 연결, validation, 구현 순서는 `ABC_front_화면.md`에서 확인한다. 이 문서에는 실행에 필요한 위치만 남긴다.

| 파일/폴더 | 역할 |
|---|---|
| `abc-front/package.json` | npm scripts와 dependency 기준 |
| `abc-front/package-lock.json` | 팀원 간 동일한 npm dependency 설치 기준 |
| `abc-front/.env` | Front API base URL 설정, 이미 GitHub에 포함됨 |
| `abc-front/src/app` | App과 router 진입점 |
| `abc-front/src/api` | Axios client와 API 함수 |
| `abc-front/src/pages` | User, Admin 화면 파일 |
| `abc-front/src/components` | 공통 UI와 layout component |
| `abc-front/src/styles` | 공통 CSS |

## 9. 실행 체크리스트

| 확인 | 기준 |
|---|---|
| `node -v` | 버전 출력 |
| `npm -v` | 버전 출력 |
| `git pull` 또는 `git clone` | GitHub 코드 확보 |
| `npm install` | package 설치 완료 |
| `.env` | `VITE_API_BASE_URL=http://localhost:8080/api/v1` 확인 |
| `npm run dev` | Vite dev server 실행 |
| Browser | `http://localhost:5173` 접속 |
