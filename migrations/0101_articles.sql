-- 文章：站内发布的命理、术数与取名科普
create table if not exists articles (
  id serial primary key,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  cover text,
  category text not null default '',
  tags text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_public_idx on articles (status, pinned desc, published_at desc);
