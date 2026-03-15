"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface PostStat {
  id: string;
  slug: string;
  title: string;
  view_count: number;
  like_count: number;
  published_at: string | null;
}

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PostRef {
  title: string;
  slug: string;
}

interface LikeRecord {
  post_id: string;
  user_id: string;
  created_at: string;
  profiles: Profile | null;
  posts: PostRef | null;
}

interface ViewRecord {
  post_id: string;
  user_id: string | null;
  created_at: string;
  profiles: Profile | null;
  posts: PostRef | null;
}

type Tab = "overview" | "likes" | "views";

export function DashboardContent({
  posts,
  likes,
  views,
}: {
  posts: PostStat[];
  likes: LikeRecord[];
  views: ViewRecord[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const totalViews = posts.reduce((sum, p) => sum + p.view_count, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.like_count, 0);

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard label="총 게시글" value={posts.length} />
        <SummaryCard label="총 조회수" value={totalViews} />
        <SummaryCard label="총 좋아요" value={totalLikes} />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          게시글 통계
        </TabButton>
        <TabButton active={tab === "likes"} onClick={() => setTab("likes")}>
          좋아요 이력
        </TabButton>
        <TabButton active={tab === "views"} onClick={() => setTab("views")}>
          조회 이력
        </TabButton>
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab posts={posts} />}
      {tab === "likes" && <ActivityTab records={likes} type="like" />}
      {tab === "views" && <ActivityTab records={views} type="view" />}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border/40 bg-card/30 rounded-lg p-5">
      <p className="text-xs font-mono text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-mono transition-colors -mb-px ${
        active
          ? "text-accent border-b-2 border-accent"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OverviewTab({ posts }: { posts: PostStat[] }) {
  const [sortBy, setSortBy] = useState<"views" | "likes">("views");

  const sorted = [...posts].sort((a, b) =>
    sortBy === "views"
      ? b.view_count - a.view_count
      : b.like_count - a.like_count,
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy("views")}
          className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
            sortBy === "views"
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          조회수순
        </button>
        <button
          onClick={() => setSortBy("likes")}
          className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
            sortBy === "likes"
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          좋아요순
        </button>
      </div>

      <div className="border border-border/40 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 bg-card/50">
              <th className="text-left text-[11px] font-mono text-muted-foreground px-4 py-3">
                게시글
              </th>
              <th className="text-right text-[11px] font-mono text-muted-foreground px-4 py-3 w-24">
                조회수
              </th>
              <th className="text-right text-[11px] font-mono text-muted-foreground px-4 py-3 w-24">
                좋아요
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((post) => (
              <tr
                key={post.id}
                className="border-b border-border/20 hover:bg-card/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-sm text-foreground hover:text-accent transition-colors"
                  >
                    {post.title}
                  </Link>
                </td>
                <td className="text-right px-4 py-3 text-sm font-mono text-muted-foreground tabular-nums">
                  {post.view_count.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3 text-sm font-mono text-muted-foreground tabular-nums">
                  {post.like_count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTab({
  records,
  type,
}: {
  records: (LikeRecord | ViewRecord)[];
  type: "like" | "view";
}) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        {type === "like" ? "아직 좋아요 이력이 없습니다." : "로그인 사용자의 조회 이력이 없습니다."}
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40 bg-card/50">
            <th className="text-left text-[11px] font-mono text-muted-foreground px-4 py-3">
              사용자
            </th>
            <th className="text-left text-[11px] font-mono text-muted-foreground px-4 py-3">
              게시글
            </th>
            <th className="text-right text-[11px] font-mono text-muted-foreground px-4 py-3 w-36">
              일시
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => {
            const profile = record.profiles;
            const post = record.posts;
            return (
              <tr
                key={`${record.post_id}-${record.user_id}-${i}`}
                className="border-b border-border/20 hover:bg-card/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name ?? profile.username}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="size-5 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-accent">
                          {(profile?.username ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-foreground">
                      {profile?.display_name ?? profile?.username ?? "unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {post ? (
                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      {post.title}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">삭제된 게시글</span>
                  )}
                </td>
                <td className="text-right px-4 py-3 text-xs font-mono text-muted-foreground/60 tabular-nums">
                  {formatDateTime(record.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}
