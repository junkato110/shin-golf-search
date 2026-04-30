"use client";

import { useState } from "react";

const TO_EMAIL = "jun.kato110@gmail.com";

export default function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const subject = encodeURIComponent("[シン・ゴルフサーチ] サイト改善要望");
    const fromLabel = name.trim() ? `from: ${name.trim()}\n\n` : "";
    const body = encodeURIComponent(`${fromLabel}${message.trim()}\n`);
    window.location.href = `mailto:${TO_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <section
      id="feedback"
      className="bg-[var(--color-navy)] text-white"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-baseline gap-3 mb-4">
          <h2
            className="font-serif text-xl sm:text-2xl"
            style={{ fontWeight: 700, letterSpacing: "0.08em" }}
          >
            サイト改善要望
          </h2>
          <span className="font-display text-xs text-[var(--color-accent)] tracking-[0.3em] uppercase">
            Feedback
          </span>
        </div>
        <p className="text-[10px] sm:text-sm text-white/75 leading-relaxed mb-8 whitespace-nowrap">
          「シン・ゴルフサーチ」は皆さまのご意見を元に鋭意改善していきます！
          <br />
          「もっとこんな機能が欲しい！」の声を投稿お願いします！
        </p>

        {submitted ? (
          <div className="border border-[var(--color-accent)]/40 bg-white/5 px-5 py-4 text-sm">
            <p className="text-[var(--color-accent)] font-semibold mb-1">
              メーラーを起動しました
            </p>
            <p className="text-white/70 text-xs leading-relaxed">
              送信完了で投稿が反映されます。お時間いただきありがとうございます！
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fb-name"
                className="block text-xs font-semibold tracking-wider text-white/70 mb-1.5"
              >
                お名前 (任意)
              </label>
              <input
                id="fb-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: ゴルフ好き太郎"
                className="w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label
                htmlFor="fb-message"
                className="block text-xs font-semibold tracking-wider text-white/70 mb-1.5"
              >
                ご要望・ご意見 <span className="text-[var(--color-accent)]">*</span>
              </label>
              <textarea
                id="fb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="例: 料金帯でも絞り込みたい / 詳細ページでコース内のホール毎の写真が見たい …"
                required
                rows={5}
                className="w-full rounded-md bg-white/5 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--color-accent)] resize-y"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-[11px] text-white/50 leading-relaxed">
                送信ボタンを押すとメーラーが起動します。
                <br className="sm:hidden" />
                内容に問題なければそのまま送信してください。
              </p>
              <button
                type="submit"
                disabled={!message.trim()}
                className="font-display tracking-[0.25em] uppercase text-xs px-6 py-3 bg-[var(--color-accent)] text-[var(--color-navy)] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontWeight: 600 }}
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
