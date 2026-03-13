# 환경 변수 설정 가이드

## 📁 환경 파일 구조

```
.env                  # 로컬 개발용 (gitignore됨, 개인 설정)
.env.development      # 개발 환경 (git에 포함, 팀 공유)
.env.staging          # 스테이징 환경 (git에 포함, 팀 공유)
.env.production       # 프로덕션 환경 (git에 포함, 팀 공유)
.env.example          # 예시 파일 (git에 포함, 템플릿)
```

## 🔧 Vite 환경 변수 동작 방식

Vite는 다음 우선순위로 환경 변수를 로드합니다:

1. `.env.[mode].local` (최우선, gitignore됨)
2. `.env.[mode]` (환경별 설정)
3. `.env.local` (gitignore됨)
4. `.env` (기본 설정)

## 🚀 사용 방법

### 1. 로컬 개발 (기본)

```bash
npm run dev
```

→ `.env` 또는 `.env.development` 파일 사용

### 2. 스테이징 환경으로 빌드

```bash
npm run build:staging
```

→ `.env.staging` 파일 사용

### 3. 프로덕션 환경으로 빌드

```bash
npm run build:production
# 또는
npm run build
```

→ `.env.production` 파일 사용

## 📝 package.json 스크립트 추가

`package.json`에 다음 스크립트를 추가하세요:

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "dev:staging": "vite --mode staging",
    "build": "vite build --mode production",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "preview": "vite preview"
  }
}
```

## 🔐 보안 주의사항

### Git에 포함되는 파일
- ✅ `.env.example` - 예시 파일
- ✅ `.env.development` - 개발 환경 (민감하지 않은 정보만)
- ✅ `.env.staging` - 스테이징 환경 (민감하지 않은 정보만)
- ✅ `.env.production` - 프로덕션 환경 (민감하지 않은 정보만)

**중요:** 모든 브랜치에 모든 환경 파일을 포함합니다. 브랜치별로 나누지 않습니다.

### Git에 포함되지 않는 파일 (.gitignore)
- ❌ `.env` - 개인 로컬 설정
- ❌ `.env.local` - 로컬 오버라이드
- ❌ `.env.*.local` - 환경별 로컬 오버라이드

### 민감한 정보 관리

**절대 Git에 올리면 안 되는 정보:**
- 실제 API 키
- 데이터베이스 비밀번호
- 인증 토큰
- 개인 정보

**해결 방법:**

1. `.env.*.local` 파일 사용 (gitignore됨)
```bash
# 로컬에서만 사용하는 실제 API 키
cp .env.development .env.development.local
# .env.development.local 파일에 실제 API 키 입력
```

2. CI/CD 환경 변수 사용
```yaml
# GitHub Actions 예시
env:
  VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

3. 비밀 관리 서비스 사용 (AWS Secrets Manager, Vault 등)

### 실무 권장 방식

**Git에 올리는 .env 파일에는:**
```env
# ✅ 공개 URL (괜찮음)
VITE_USER_SERVICE_URL=https://api.yourdomain.com

# ✅ Placeholder (괜찮음)
VITE_GEMINI_API_KEY=your_api_key_here

# ❌ 실제 API 키 (절대 안됨!)
# VITE_GEMINI_API_KEY=AIzaSyC1234567890abcdefg
```

**로컬 .env.local 파일에는:**
```env
# 실제 API 키 (gitignore됨)
VITE_GEMINI_API_KEY=AIzaSyC1234567890abcdefg
```

## 📋 환경별 설정 예시

### .env.development (개발)
```env
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_SCHEDULE_SERVICE_URL=http://localhost:3002
VITE_INTELLIGENCE_SERVICE_URL=http://localhost:3003
VITE_INSIGHT_SERVICE_URL=http://localhost:3004
VITE_GEMINI_API_KEY=placeholder_key  # 실제 키는 .env.local에
```

### .env.staging (스테이징)
```env
VITE_USER_SERVICE_URL=https://staging-user-api.yourdomain.com
VITE_SCHEDULE_SERVICE_URL=https://staging-schedule-api.yourdomain.com
VITE_INTELLIGENCE_SERVICE_URL=https://staging-intelligence-api.yourdomain.com
VITE_INSIGHT_SERVICE_URL=https://staging-insight-api.yourdomain.com
VITE_GEMINI_API_KEY=placeholder_key  # 실제 키는 CI/CD 환경 변수에
```

### .env.production (프로덕션)
```env
VITE_USER_SERVICE_URL=https://user-api.yourdomain.com
VITE_SCHEDULE_SERVICE_URL=https://schedule-api.yourdomain.com
VITE_INTELLIGENCE_SERVICE_URL=https://intelligence-api.yourdomain.com
VITE_INSIGHT_SERVICE_URL=https://insight-api.yourdomain.com
VITE_GEMINI_API_KEY=placeholder_key  # 실제 키는 CI/CD 환경 변수에
```

## 🛠️ 실전 워크플로우

### 신규 개발자 온보딩

1. 저장소 클론
```bash
git clone <repository-url>
cd <project>
```

2. 의존성 설치
```bash
npm install
```

3. 로컬 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어서 실제 API 키 입력
```

4. 개발 서버 실행
```bash
npm run dev
```

### 배포 프로세스

#### 스테이징 배포
```bash
# 스테이징 환경으로 빌드
npm run build:staging

# 빌드 결과물 확인
npm run preview

# 스테이징 서버에 배포
# (CI/CD 파이프라인에서 자동 처리)
```

#### 프로덕션 배포
```bash
# 프로덕션 환경으로 빌드
npm run build:production

# 프로덕션 서버에 배포
# (CI/CD 파이프라인에서 자동 처리)
```

## 🔍 환경 변수 확인

코드에서 현재 환경 확인:

```typescript
// 현재 모드 확인
console.log('Mode:', import.meta.env.MODE);
// 'development', 'staging', 'production'

// 환경 변수 확인
console.log('User Service URL:', import.meta.env.VITE_USER_SERVICE_URL);

// 프로덕션 여부 확인
if (import.meta.env.PROD) {
  console.log('프로덕션 환경입니다');
}

// 개발 환경 여부 확인
if (import.meta.env.DEV) {
  console.log('개발 환경입니다');
}
```

## ⚠️ 주의사항

1. **VITE_ 접두사 필수**: Vite에서 환경 변수를 사용하려면 반드시 `VITE_` 접두사가 필요합니다.

2. **빌드 타임 변수**: 환경 변수는 빌드 시점에 코드에 삽입됩니다. 런타임에 변경할 수 없습니다.

3. **민감한 정보 노출**: 클라이언트 코드에 포함되므로 민감한 정보는 절대 넣지 마세요.

4. **환경 변수 변경 후**: 개발 서버를 재시작해야 합니다.

## 📚 참고 자료

- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- [환경별 빌드 가이드](https://vitejs.dev/guide/build.html)


## 🌳 Git 브랜치 전략과 환경 파일

### 모든 브랜치에 모든 환경 파일 포함 (권장)

```
main (production)
├── .env.development
├── .env.staging
├── .env.production
└── .env.example

develop
├── .env.development
├── .env.staging
├── .env.production
└── .env.example

feature/new-feature
├── .env.development
├── .env.staging
├── .env.production
└── .env.example
```

**장점:**
- ✅ 모든 개발자가 모든 환경 설정 확인 가능
- ✅ 어떤 브랜치에서든 원하는 환경으로 빌드 가능
- ✅ 환경 설정 변경 시 한 번에 관리
- ✅ 머지 충돌 최소화
- ✅ CI/CD 파이프라인 단순화

**사용 예시:**
```bash
# feature 브랜치에서 작업 중
git checkout feature/new-feature

# 개발 환경으로 테스트
npm run dev  # .env.development 사용

# 스테이징 환경으로 테스트
npm run dev:staging  # .env.staging 사용

# 프로덕션 빌드 테스트 (배포 전 확인)
npm run build:production  # .env.production 사용
```

### 브랜치별로 나누는 방식 (비권장)

```
main → .env.production만
staging → .env.staging만
develop → .env.development만
```

**단점:**
- ❌ 환경 설정 변경 시 여러 브랜치에 각각 커밋 필요
- ❌ 머지 시 충돌 가능성
- ❌ 개발자가 다른 환경 설정을 볼 수 없음
- ❌ CI/CD 설정 복잡해짐

### 실무 워크플로우

#### 1. 환경 설정 변경 시

```bash
# develop 브랜치에서 작업
git checkout develop

# 모든 환경 파일 수정
vim .env.development
vim .env.staging
vim .env.production

# 한 번에 커밋
git add .env.*
git commit -m "feat: Update API endpoints for all environments"
git push origin develop

# main 브랜치로 머지
git checkout main
git merge develop
git push origin main
```

#### 2. CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [develop, staging, main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      
      # 브랜치에 따라 다른 환경으로 빌드
      - name: Build for Development
        if: github.ref == 'refs/heads/develop'
        run: npm run build  # .env.development 사용
        
      - name: Build for Staging
        if: github.ref == 'refs/heads/staging'
        run: npm run build:staging  # .env.staging 사용
        
      - name: Build for Production
        if: github.ref == 'refs/heads/main'
        run: npm run build:production  # .env.production 사용
      
      # 민감한 정보는 GitHub Secrets에서 주입
      - name: Inject Secrets
        run: |
          echo "VITE_GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}" >> .env.local
```

### 팀 협업 가이드

#### 신규 개발자 온보딩

```bash
# 1. 저장소 클론
git clone <repository-url>
cd <project>

# 2. 의존성 설치
npm install

# 3. 로컬 환경 변수 설정 (실제 API 키)
cp .env.development .env.development.local
# .env.development.local 파일에 실제 API 키 입력

# 4. 개발 서버 실행
npm run dev
```

#### 환경 설정 변경 프로세스

1. **개발자가 변경 필요 시:**
   - 모든 환경 파일 확인 및 수정
   - PR 생성 시 변경 사항 명시
   - 팀원 리뷰 후 머지

2. **리뷰 체크리스트:**
   - [ ] 모든 환경 파일이 일관성 있게 수정되었는가?
   - [ ] 민감한 정보가 포함되지 않았는가?
   - [ ] URL 형식이 올바른가?
   - [ ] 주석이 명확한가?

3. **머지 후:**
   - 팀원들에게 환경 변수 변경 공지
   - 필요 시 로컬 `.env.local` 파일 업데이트 안내

### 요약

✅ **권장:** 모든 브랜치에 모든 환경 파일 포함
❌ **비권장:** 브랜치별로 환경 파일 분리

이 방식이 관리가 쉽고, 팀 협업에 유리하며, CI/CD 파이프라인도 단순해집니다.
