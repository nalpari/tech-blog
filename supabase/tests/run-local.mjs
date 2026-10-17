// 임시 디렉터리에 설치한 PGlite로 운영 DB 연결 없이 SQL 회귀 검증을 실행한다.
// npm install --prefix <temp-dir> --no-save --no-package-lock @electric-sql/pglite
// PGLITE_MODULE=<temp-dir>/node_modules/@electric-sql/pglite/dist/index.js node supabase/tests/run-local.mjs
// PGlite는 단일 연결이다. 실제 연결 간 경합 검증은 concurrent_likes.spec을 사용한다.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.resolve(testDir, "../migrations");
const moduleSpecifier = process.env.PGLITE_MODULE
  ? pathToFileURL(path.resolve(process.env.PGLITE_MODULE)).href
  : "@electric-sql/pglite";
const { PGlite } = await import(moduleSpecifier);
const db = new PGlite();

try {
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id uuid PRIMARY KEY,
      email text,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb
    );
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
    $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
  `);

  for (const file of (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort()) {
    if (file === "20261017090000_harden_auth_and_engagement.sql") {
      // 업그레이드 전 손상된 카운터와 구형 조회 overload를 재현한다.
      await db.exec(`
        INSERT INTO auth.users (id, email) VALUES ('00000000-0000-4000-c000-000000000001', 'upgrade@regression.invalid');
        INSERT INTO public.posts (author_id, slug, title, status, like_count)
        VALUES ('00000000-0000-4000-c000-000000000001', 'upgrade-regression', 'Upgrade test', 'published', 99);
        INSERT INTO public.post_likes (user_id, post_id)
        SELECT author_id, id FROM public.posts WHERE slug = 'upgrade-regression';
        CREATE FUNCTION public.increment_post_view_count(post_slug text) RETURNS integer
        LANGUAGE sql AS $$ SELECT 999; $$;
        GRANT UPDATE (role) ON public.profiles TO authenticated;
      `);
    }
    await db.exec(`BEGIN;\n${await readFile(path.join(migrationDir, file), "utf8")}\nCOMMIT;`);
    console.log(`PASS migration: ${file}`);
    if (file === "20261017090000_harden_auth_and_engagement.sql") {
      const { rows } = await db.query("SELECT like_count FROM public.posts WHERE slug = 'upgrade-regression'");
      assert.equal(rows[0]?.like_count, 1, "migration repairs a corrupted like count");
      await db.exec("DELETE FROM auth.users WHERE id = '00000000-0000-4000-c000-000000000001'");
      console.log("PASS migration repairs pre-existing counter drift");
    }
  }

  for (const file of (await readdir(testDir)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(path.join(testDir, file), "utf8"));
    console.log(`PASS regression: ${file}`);
  }
} finally {
  await db.close();
}
