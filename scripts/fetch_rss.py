import feedparser
import json
import re
import os
from datetime import datetime, timezone, timedelta
from urllib.parse import quote

JST = timezone(timedelta(hours=9))

# 資産ごとの信頼メディアリスト（source.href のドメイン名 or source.title と照合）
# 2026-07-07 改善：タイトル末尾の文字列一致からドメイン一致に変更（表記揺れに強くするため）
TRUSTED_MEDIA = {
    "finance": [
        "reuters.com", "nikkei.com", "bloomberg.co.jp", "bloomberg.com",
        "diamond.jp", "toyokeizai.net", "cnbc.com", "nhk.or.jp",
        "kabutan.jp", "nli-research.co.jp", "yahoo.co.jp",
    ],
    # 注記（2026-07-07）：yahoo.co.jp はGoogle News検索結果の出典表示（source.href/title）を
    # 信頼メディア扱いするためのドメイン一致対象。Yahoo!ニュースのRSSを直接取得しているわけではない
    # （Yahoo!ニュースRSSは個人利用限定・二次配信不可の規約があるため直接取得はしない方針＝research-dept調査済み）
    "intel": [
        "itmedia.co.jp", "techcrunch.com", "ascii.jp", "gizmodo.jp",
        "jaxa.jp", "tohoku.ac.jp", "riken.jp", "nhk.or.jp",
        "impress.co.jp", "watch.impress.co.jp", "gihyo.jp",
    ],
    "health": [
        "yomiuri.co.jp", "nhk.or.jp", "asahi.com", "mhlw.go.jp",
        "yahoo.co.jp", "nikkei.com",
    ],
    # 2026-08-01：tokyo.lg.jp（生活）・metro.tokyo.lg.jp（制度）を外した。
    # 特定の地域の役所を信頼メディアに入れておくと、そこに住んでいる前提の一覧になるため。
    "life": [
        "nhk.or.jp", "asahi.com", "jma.go.jp",
        "nikkei.com", "yahoo.co.jp",
        "ntv.co.jp", "news24.jp", "tbs.co.jp",
    ],
    # 2026-08-01：特定の求人サービスのドメインを信頼リストから外した。
    # 誰が使うか分からない以上、特定の会社を固定で信頼する理由がないため、報道に絞る。
    "career": [
        "nikkei.com", "nhk.or.jp",
        "mhlw.go.jp", "yahoo.co.jp", "itmedia.co.jp", "diamond.jp",
        "toyokeizai.net", "asahi.com",
    ],
    "system": [
        # 2026-07-07：yahoo.co.jp は制度資産では外した（Google News経由で無関係な
        # ライフ系記事がyahoo.co.jp出典で紛れ込むため。官公庁・報道の一次情報に絞る）
        "mhlw.go.jp", "nta.go.jp",
        "asahi.com", "nhk.or.jp",
    ],
    "relation": [
        "walkerplus.com", "timeout.jp", "tokyocheapo.com",
        "nhk.or.jp", "yahoo.co.jp", "rurubu.com",
    ]
}

# 広告・PR除外キーワード
AD_KEYWORDS = [
    "株式会社", "プレスリリース", "pr times", "prtimes",
    "キャンペーン", "モニター募集", "タイアップ", "sponsored",
    "advertisement", "お知らせ", "のご案内", "助成金", "補助金",
    "融資制度",
]

# 事務的な告知タイトル除外キーワード（官公庁RSS等の中身の薄い開催案内を弾く。資産ごとに設定）
NOTICE_KEYWORDS = {
    "system": [
        "開催案内", "開催します", "開催について", "会見概要", "審議会",
        "検討会", "ワーキンググループ", "分科会", "懇談会", "セミナー",
        "資料について", "遺骨引渡式",
    ],
}


def google_news_url(query, when_days=7):
    q = f"{query} when:{when_days}d"
    return f"https://news.google.com/rss/search?q={quote(q)}&hl=ja&gl=JP&ceid=JP:ja"


# ── 資産ごとの情報源設計（2026-07-07 改善）───────────────────────
# 方針：
# 1) 信頼メディアの公式RSSを「direct」として直接取得できるものは優先的に混ぜる
#    （Google News検索経由だとメディア判定が表記揺れですり抜けるため）
# 2) 検索ワードは社長のプロフィール・7資産の関心（STATE.md ニュース設計）に沿って具体化
# 3) 検索語は誰にでも当てはまる一般的な言葉だけにする（2026-07-31）
#    個人に属するもの（病名・住んでいる場所・家族構成・障害の有無・持っている商品など）は
#    このファイルに書かない。使う人ごとの言葉は、端末の中の設定として持たせる方針
# 4) 線の引き方（2026-08-01・他人に配る前提で決めた）
#    書かない ＝ 読む人の事情を決めつける言葉
#                （住んでいる場所・世帯の形・恋人や家族の有無・勤め先や使っているサービス）
#    書いてよい ＝ 話題そのもの（睡眠・防災・節約・確定申告など）。誰にでも当てはまるため
#    この線で引き直し、地域名・世帯の形・家族関係を決めつける語と、
#    特定の会社のドメインを、検索語と信頼メディアの両方から外した
RSS_SOURCES = [
    {
        "id": "finance",
        "icon": "💰",
        "title": "金融資産 — マーケット動向",
        "feeds": [
            "http://toyokeizai.net/list/feed/rss",
            google_news_url("米国経済 FRB 金融政策"),
            google_news_url("日銀 円相場 為替"),
            google_news_url("米国株 主要株価指数"),
            google_news_url("日経平均 東京市場"),
            google_news_url("インデックス投資 全世界株式"),
            google_news_url("つみたて投資 資産形成"),
            google_news_url("暗号資産 市場動向"),
            google_news_url("商品市況 コモディティ"),
            google_news_url("reuters OR bloomberg 経済 マーケット"),
        ],
        "limit": 10,
        "interval_days": 1,
        "max_age_days": 7,
        "source": "東洋経済 / Google News"
    },
    {
        "id": "intel",
        "icon": "🧠",
        "title": "認知資産 — AI・テクノロジー・科学",
        "feeds": [
            "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml",
            "https://techcrunch.com/feed/",
            "https://www.jaxa.jp/rss/press_j.rdf",
            "https://www.riken.jp/feed/press_feed/",
            google_news_url("Claude Anthropic 新機能 活用法"),
            google_news_url("ChatGPT OpenAI 生成AI ビジネス活用"),
            google_news_url("生成AI 業務効率化 事例"),
        ],
        "limit": 7,
        "interval_days": 1,
        "max_age_days": 10,
        "source": "ITmedia / TechCrunch / JAXA / 理研 / Google News"
    },
    {
        "id": "health",
        "icon": "💪",
        "title": "健康資産 — 健康トピック",
        "feeds": [
            google_news_url("気分の波 セルフケア"),
            google_news_url("集中力 続かない 対処"),
            google_news_url("睡眠の質 改善"),
            google_news_url("メンタルヘルス 睡眠"),
            google_news_url("生活習慣病 予防"),
        ],
        "limit": 7,
        "interval_days": 1,
        "max_age_days": 10,
        "source": "Google News"
    },
    {
        "id": "life",
        "icon": "🏡",
        "title": "生活資産 — 生活・社会",
        "feeds": [
            google_news_url("くらし 生活情報 見直し"),
            google_news_url("防災 災害対策 備え"),
            google_news_url("電気代 節約 光熱費"),
            google_news_url("家計 見直し 節約 工夫"),
            google_news_url("自治体 生活支援 制度"),
        ],
        "limit": 7,
        "interval_days": 1,
        "max_age_days": 10,
        "source": "Google News"
    },
    {
        "id": "relation",
        "icon": "❤️",
        "title": "関係資産 — トレンド・体験",
        "feeds": [
            google_news_url("週末 イベント おでかけ"),
            google_news_url("展覧会 美術館 開催"),
            google_news_url("おでかけ スポット 話題"),
            google_news_url("walkerplus OR timeout イベント情報"),
        ],
        "limit": 7,
        "interval_days": 2,
        "max_age_days": 10,
        "source": "Google News"
    },
    {
        "id": "career",
        "icon": "💼",
        "title": "仕事資産 — キャリア・副業",
        "feeds": [
            google_news_url("DX推進 事務職 求人"),
            google_news_url("働きやすい職場 配慮 事例"),
            google_news_url("DX人材 未経験 転職"),
            google_news_url("生成AI スキル 仕事 需要"),
            google_news_url("多様な人材 採用 企業の取り組み"),
        ],
        "limit": 7,
        "interval_days": 1,
        "max_age_days": 10,
        "source": "Google News"
    },
    {
        "id": "system",
        "icon": "📜",
        "title": "制度資産 — 制度・法律",
        "feeds": [
            "https://www.mhlw.go.jp/stf/news.rdf",
            google_news_url("公的支援 申請 手続き"),
            google_news_url("医療費 助成 制度"),
            google_news_url("厚労省 制度改正 2026"),
            google_news_url("確定申告 控除 2026"),
            google_news_url("公的年金 申請 手続き"),
        ],
        "limit": 7,
        "interval_days": 3,
        "max_age_days": 14,
        "source": "厚生労働省 / Google News"
    }
]


def clean_html(raw):
    return re.sub(r'<[^>]+>', '', raw or '').strip()


def clean_title(title):
    """タイトル末尾の「 - メディア名」を除去（表示用）"""
    return re.sub(r'\s*[-–—]\s*[^-–—]+$', '', title).strip()


def extract_source(entry):
    """entry.source（Google News構造化データ）からドメイン・メディア名を取得。
    存在しない場合（公式RSS直取得時など）はlinkのドメインで代用。
    """
    src = entry.get("source", {})
    href = (src.get("href") or "").lower()
    title = (src.get("title") or "").lower()
    if not href:
        href = (entry.get("link", "") or "").lower()
    return href, title


def is_trusted(entry, section_id):
    """信頼メディアリストに含まれるか確認（ドメイン優先・メディア名も補助的に見る）"""
    trusted = TRUSTED_MEDIA.get(section_id, [])
    href, title = extract_source(entry)
    for t in trusted:
        if t in href or t in title:
            return True
    return False


def is_ad(title):
    """広告・PR記事を除外"""
    title_lower = title.lower()
    for kw in AD_KEYWORDS:
        if kw.lower() in title_lower:
            return True
    return False


def is_notice(title, section_id):
    """審議会・検討会の開催案内など、内容の薄い事務的告知を除外（資産ごとに判定基準を変える）"""
    for kw in NOTICE_KEYWORDS.get(section_id, []):
        if kw in title:
            return True
    return False


# 東洋経済など「総合RSS＋カテゴリタグ」形式のフィードで、資産に関係ないカテゴリを弾くための許可リスト
CATEGORY_ALLOWLIST = {
    "finance": ["政治・経済・投資", "マネー"],
}


def _collect_entries(feeds, limit, section_id, trusted_only, seen_urls, max_age_days=None):
    """フィードから記事を収集する内部ヘルパー。
    trusted_only=True なら信頼メディアのみ、False なら全メディアを対象とする。
    """
    items = []
    seen_titles = set()
    now = datetime.now(timezone.utc)
    allowlist = CATEGORY_ALLOWLIST.get(section_id)
    for url in feeds:
        if len(items) >= limit:
            break
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:20]:
                if len(items) >= limit:
                    break
                raw_title = clean_html(entry.get("title", ""))
                if not raw_title:
                    continue
                # カテゴリタグがある総合RSSは、関係ないカテゴリを除外
                cat = entry.get("category", "")
                if allowlist and cat and cat not in allowlist:
                    print(f"[CAT-SKIP:{cat}] {raw_title[:40]}")
                    continue
                # 記事の鮮度チェック
                if max_age_days is not None:
                    pub = entry.get("published_parsed") or entry.get("updated_parsed")
                    if pub:
                        pub_dt = datetime(*pub[:6], tzinfo=timezone.utc)
                        age = (now - pub_dt).days
                        if age > max_age_days:
                            print(f"[OLD:{age}d] {raw_title[:40]}")
                            continue
                # 広告除外
                if is_ad(raw_title):
                    print(f"[AD] {raw_title[:40]}")
                    continue
                # 事務的告知の除外（審議会開催案内など中身のないもの）
                if is_notice(raw_title, section_id):
                    print(f"[NOTICE] {raw_title[:40]}")
                    continue
                # 信頼メディアチェック（direct取得＝公式RSSは常に信頼済み扱い）
                if trusted_only and not is_trusted(entry, section_id):
                    print(f"[SKIP] {raw_title[:40]}")
                    continue
                title = clean_title(raw_title)
                # 短すぎるタイトル（クリーニングで大部分が消えた壊れた記事）は除外
                if len(title) < 6:
                    print(f"[SHORT] {raw_title[:40]}")
                    continue
                # タイトル正規化キー（表記揺れ吸収のため空白・記号を除去して比較）
                title_key = re.sub(r'[\s　【】｜|・()（）]', '', title).lower()
                raw_desc = entry.get("summary", entry.get("description", ""))
                desc = clean_html(raw_desc)
                desc = desc[:500] if len(desc) > 500 else desc
                link = entry.get("link", "")
                if title and link not in seen_urls and title_key not in seen_titles:
                    seen_urls.add(link)
                    seen_titles.add(title_key)
                    items.append({"text": title, "desc": desc, "url": link})
        except Exception as e:
            print(f"[WARN] {url[:60]}: {e}")
    return items


def fetch_items(feeds, limit, section_id, max_age_days=None):
    """信頼メディアのみで取得する（質優先・補充フォールバックは廃止）。
    2026-07-07改善：件数が足りなくても低品質記事で埋めない（質＞量の方針）。
    """
    seen_urls = set()
    items = _collect_entries(feeds, limit, section_id, trusted_only=True,
                             seen_urls=seen_urls, max_age_days=max_age_days)
    return items[:limit]


def main():
    today = datetime.now(JST).strftime("%Y-%m-%d")
    today_date = datetime.now(JST).date()

    existing = {}
    if os.path.exists("data/report.json"):
        try:
            with open("data/report.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                for s in data.get("summaries", []):
                    existing[s["id"]] = s
        except Exception:
            pass

    summaries = []
    for src in RSS_SOURCES:
        sid = src["id"]
        prev = existing.get(sid, {})
        last_str = prev.get("lastFetchedAt", "")

        do_update = True
        if last_str:
            try:
                last_date = datetime.strptime(last_str, "%Y-%m-%d").date()
                do_update = (today_date - last_date).days >= src["interval_days"]
            except Exception:
                pass

        if do_update:
            items = fetch_items(src["feeds"], src["limit"], sid, src.get("max_age_days"))
            print(f"[UPDATE] {sid}: {len(items)}件取得")
            # 0件のときは前回データをフォールバックとして使用
            if len(items) == 0:
                fallback = prev.get("items", [])
                if fallback:
                    items = fallback
                    last_fetched = last_str  # 前回の日付を維持
                    print(f"[FALLBACK] {sid}: 0件のため前回データ({len(fallback)}件)を使用")
                else:
                    last_fetched = today
            else:
                last_fetched = today
        else:
            items = prev.get("items", [])
            last_fetched = last_str
            print(f"[SKIP] {sid}: 前回データ使用 ({last_str})")

        summaries.append({
            "id": sid,
            "icon": src["icon"],
            "title": src["title"],
            "items": items,
            "lastFetchedAt": last_fetched,
            "source": src["source"]
        })

    report = {"updatedAt": today, "summaries": summaries}

    os.makedirs("data", exist_ok=True)
    with open("data/report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"report.json を更新しました: {today}")


if __name__ == "__main__":
    main()
