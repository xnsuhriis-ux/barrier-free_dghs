-- ====================================================
-- Barrier-Free Map: Supabase 초기 설정 SQL
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.
-- ====================================================

-- 1) reports 테이블 생성
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  latitude float8 not null,
  longitude float8 not null,
  category text not null,
  description text,
  image_url text
);

-- 2) Row Level Security 활성화
alter table reports enable row level security;

-- 3) 누구나 읽을 수 있도록 허용 (지도에 마커를 표시하기 위함)
create policy "Public can read reports"
  on reports
  for select
  using (true);

-- 4) 누구나 제보를 등록할 수 있도록 허용 (로그인 없는 크라우드소싱 구조)
create policy "Public can insert reports"
  on reports
  for insert
  with check (true);

-- ====================================================
-- 5) Storage 버킷 생성 (barrier-images, public)
-- ====================================================
insert into storage.buckets (id, name, public)
values ('barrier-images', 'barrier-images', true)
on conflict (id) do nothing;

-- 6) 스토리지 버킷 읽기/쓰기 정책
create policy "Public can read barrier-images"
  on storage.objects
  for select
  using (bucket_id = 'barrier-images');

create policy "Public can upload barrier-images"
  on storage.objects
  for insert
  with check (bucket_id = 'barrier-images');
