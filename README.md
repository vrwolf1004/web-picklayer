# picklayer.net — Themes Playground

크로스 플랫폼 디자인 시스템으로, 다양한 스타일과 테마를 지원하는 UI 컴포넌트 라이브러리입니다.
개발자와 디자이너가 빠르게 고품질의 사용자 인터페이스를 만들 수 있도록 지원합니다.

**로그인 없이 익명으로 댓글을 남길 수 있는 커뮤니티**를 함께 제공합니다.
테마에 대한 의견, 피드백, 아이디어를 자유롭게 나눠보세요.

---

## 사용 방법

### 1. CSS 파일 링크

```html
<link rel="stylesheet" href="https://picklayer.net/theme/basic.css">
```

### 2. 테마 클래스 적용

```html
<body class="theme-basic">
  ...
</body>
```

### 사용 가능한 테마

| 클래스 | 테마 | 설명 |
|---|---|---|
| `theme-basic` | Basic | 심플하고 균형 잡힌 기본 테마 |
| `theme-flat` | Flat | 평면 디자인 기반의 간결한 테마 |
| `theme-dark` | Dark | 눈의 피로를 줄이는 다크 테마 |
| `theme-midcentury` | Midcentury | 1950–60년대 미드센추리 모던 |
| `theme-bauhaus` | Bauhaus | 기하학과 삼원색의 기능미 디자인 |
| `theme-cyberpunk` | Cyberpunk | 네온과 디지털 감성의 강렬한 테마 |
| `theme-vaporwave` | Vaporwave | 80–90년대 복고 감성 테마 |
| `theme-rococo` | Rococo | 화려한 장식과 곡선의 우아한 테마 |
| `theme-artnouveau` | Art Nouveau | 유려한 곡선과 자연 모티프 테마 |
| `theme-newtro` | Newtro | 현대적 색감과 복고 요소를 결합한 테마 |

테마 미리보기 → [picklayer.net](https://picklayer.net)

---

- [About](https://picklayer.net/about.html)
- [이용약관](https://picklayer.net/terms.html)
- [개인정보처리방침](https://picklayer.net/privacy.html)

---

질문이나 피드백은 [GitHub Issues](https://github.com/vrwolf1004/web-picklayer/issues)로 부탁드립니다.

---

## 프로젝트 구조

| 경로 | 내용 |
|---|---|
| `index.html`, `about.html` 등 페이지 | 사이트 소스 (루트, GitHub Pages `main` 의 `/` 로 배포) |
| `css`, `js`, `assets`, `theme`, `i18n`, `blog`, `admin` | 사이트 리소스 |
| `CNAME`, `_headers`, `robots.txt`, `sitemap.xml` | 도메인과 배포 설정 |
| `build.js`, `package.json`, `package-lock.json` | 빌드 스크립트와 의존성 (루트) |
| `.github/workflows/build-site.yml` | `index.html` 이 바뀌면 빌드 값을 넣어 자동 커밋 |
| `docs/` | 문서 (`.env.example` 등) |

로컬 빌드는 `docs/.env.example` 을 참고해 `.env.local` 을 만든 뒤 `npm run build` 를 실행합니다. 이 명령은 `index.html` 을 직접 수정합니다.

