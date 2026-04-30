"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";
import FavoriteButton from "@/components/FavoriteButton";
import { formatTravelTime } from "@/lib/distance";
import type { Course } from "@/types";

export default function FavoritesList({ allCourses }: { allCourses: Course[] }) {
  const { ids, loaded, count } = useFavorites();

  if (!loaded) {
    return (
      <p className="text-sm text-[var(--color-ink-subtle)] py-12 text-center">
        読み込み中…
      </p>
    );
  }

  if (count === 0) {
    return (
      <div className="bg-white border border-dashed border-[var(--color-line-strong)] p-12 text-center">
        <p className="text-sm text-[var(--color-ink-muted)] mb-4">
          まだお気に入り登録がありません。
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)] leading-relaxed">
          検索結果や詳細ページでハートマークをクリックすると、
          <br />
          ここに登録したコースが集まります。
        </p>
        <Link
          href="/"
          className="inline-block mt-6 font-display tracking-[0.25em] uppercase text-xs px-6 py-3 border border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors"
        >
          コース検索へ
        </Link>
      </div>
    );
  }

  // ids 順でソート (登録順)
  const favCourses = ids
    .map((id) => allCourses.find((c) => c.id === id))
    .filter((c): c is Course => Boolean(c));

  return (
    <div>
      <p className="text-sm text-[var(--color-navy)] mb-6" style={{ fontWeight: 600 }}>
        登録中
        <span
          className="font-display text-2xl mx-2 align-baseline"
          style={{ fontWeight: 500 }}
        >
          {favCourses.length}
        </span>
        件
      </p>

      <div className="grid gap-5">
        {favCourses.map((course) => (
          <FavoriteCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

function FavoriteCard({ course }: { course: Course }) {
  return (
    <div className="relative">
      <Link
        href={`/courses/${course.id}`}
        className="flex bg-white border border-[var(--color-line)] overflow-hidden hover:shadow-md hover:border-[var(--color-line-strong)] transition-all"
      >
        {course.imageUrl && (
          <div className="w-40 sm:w-56 shrink-0 bg-neutral-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <h3
            className="font-serif text-base sm:text-lg text-[var(--color-navy)] leading-snug truncate"
            style={{ fontWeight: 600, letterSpacing: "0.04em" }}
          >
            {course.name}
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1.5 tracking-wide">
            {course.prefecture}
            {course.city ? ` · ${course.city}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-muted)]">
            {course.travelMinutesFromTokyo != null && (
              <span>
                <span className="text-[10px] text-[var(--color-ink-subtle)] mr-1">東京駅から</span>
                {formatTravelTime(course.travelMinutesFromTokyo).replace("目安 ", "")}
              </span>
            )}
            {course.courseLayout && (
              <span>
                <span className="text-[10px] text-[var(--color-ink-subtle)] mr-1">形態</span>
                {course.courseLayout}
              </span>
            )}
          </div>
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {course.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 border border-[var(--color-navy)]/25 bg-white text-[var(--color-navy)] text-[10px] tracking-wider"
                  style={{ fontWeight: 500 }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <FavoriteButton courseId={course.id} variant="overlay" size="sm" />
      </div>
    </div>
  );
}
