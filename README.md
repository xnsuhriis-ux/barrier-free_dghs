# Barrier-Free Map

당사자 참여형 크라우드소싱 배리어프리 지도 웹앱.

## 설치 및 실행

```bash
npx create-next-app@latest barrier-free-map --typescript --tailwind --app --src-dir=false --import-alias "@/*"
cd barrier-free-map
npm install @supabase/supabase-js react-kakao-maps-sdk lucide-react
```

이후 이 폴더의 다음 파일들을 새로 생성된 프로젝트의 동일 경로에 그대로 덮어쓰세요.

- `lib/supabase.ts`
- `types/kakao.d.ts`
- `components/MapComponent.tsx`
- `components/ReportModal.tsx`
- `app/page.tsx`
- `app/layout.tsx`

`.env.local.example`을 참고하여 프로젝트 루트에 `.env.local`을 만들고 실제 키 값을 채우세요.

`supabase/setup.sql`을 Supabase 대시보드의 SQL Editor에 붙여넣고 실행하세요.

```bash
npm run dev
```
