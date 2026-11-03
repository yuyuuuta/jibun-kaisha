// ══════════════════════════════════════════
//  開幕画面（splash）の開始時刻
//  index.htmlの<script>はbodyの一番下にあるため、この行が動く時点で
//  #splashはもう画面に描かれている。ここを起点に「最低これだけは見せる時間」を測る。
// ══════════════════════════════════════════
const splashStartedAt = (window.performance && performance.now) ? performance.now() : Date.now();

// 2026-08-12 テックMGR検品で発見・修正：
// 「回転マークを51.43°の倍数の時間だけ見せれば、開始時と同じ向きで消える」という設計
// （COOの実装・2026-08-11）は、理屈自体は正しいが、時間の測り方に穴があった。
// 詳しい理由と直し方は、下のreadySplash()のコメントにまとめてある。

// CSSのトークン（style.css :root）から時間の値を読み取る。
// 「800ms」のような文字列から数字だけ取り出す（parseFloatは末尾の"ms"を無視して800を返す）。
// こうしておくと、デザイン班が今後トークンの数値を変えても、JS側の数字を書き換え忘れる事故がない。
function cssMs(varName, fallback){
  try{
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }catch(e){ return fallback; }
}

// ══════════════════════════════════════════
//  DATA VERSION
// ══════════════════════════════════════════
const DATA_VERSION = 14;

// ══════════════════════════════════════════
//  はじめて開いたときに入っている「見本」（2026-11-02：試作の448マスに入れかえ）
//  ここに書くのは、だれにでも当てはまる一般的な言葉だけ。
//  個人の目標・金額・病名・会社名などは1文字も書かない。
//  使う人は「✏️ 書きかえる」で自分の言葉に書きかえるか、
//  「全部消す」でゼロから始められる。
//
//  形：7つの資産 × コアゴール1つ × サブゴール8つ × タスク8つ（＝448マス）。
//  言葉の正本は 03_知性MGR/文言_20261031_試作直感版.md（5章まで反映済み）。
//  「|」は、画面で文字を折り返してよい場所のしるし。保存するデータには入れない
//  （入れると、書き出した控えのファイルにも残ってしまうため）。画面に出すときだけ使う（下の SAMPLE_HINTS）。
//  各サブゴールの「名前」と「8つのタスク（/ で区切る）」の順で並べてある。
// ══════════════════════════════════════════
const SAMPLE_RAW = [
  {id:"finance",icon:"💰",name:"金融資産",goal:"お金の|不安を|減らす",subs:[
    ["出費を|記録する","出費を|メモ/レシートを|整理/家計簿を|つける/お金の|動きを見る/今月の|出費を見る/食費だけ|書く/大きな|出費を書く/現金払いを|書く"],
    ["積立を|続ける","貯金に|回す/積立を|確認/先取り|貯金をする/おつりを|貯める/100円だけ|貯める/貯まった|額を見る/引き落とし|確認/入金日を|確認"],
    ["固定費を|見直す","固定費を|見る/住居費を|見る/水道代を|見る/スマホ代を|見る/固定費を|合計する/サブスクを|見直す/電気代を|見る/ネット代を|見る"],
    ["貯金の|目標","貯金額を|見る/目標額を|決める/期限を|決める/目標を|紙に書く/貯める理由|を考える/毎月の額を|決める/ほしい物を|書く/貯まり|具合を見る"],
    ["お得な|情報を探す","補助金を|探す/手当を|調べる/割引を|探す/ポイントを|確認/税の優遇を|調べる/役所の|案内を読む/案内を|保存する/申込期限を|見る"],
    ["お金の|勉強","お金の本を|開く/用語を|1つ覚える/仕組みを|調べる/お金の|動画を見る/金利を|調べる/ニュースを|見る/分かった|ことを書く/節約を|調べる"],
    ["持っている|お金","残高を|見る/口座を|全部見る/財布の中を|見る/合計を|出す/電子マネー|を見る/お金の|一覧を作る/先月と|比べる/使える額を|知る"],
    ["衝動買いを|防ぐ","買う前に|考える/値段を|比べる/必要か|自分に聞く/一晩|待ってみる/家の在庫を|見る/口コミを|見る/予算を先に|決める/ほしい理由|を書く"],
  ]},
  {id:"health",icon:"💪",name:"健康資産",goal:"からだを|元気に保つ",subs:[
    ["運動の習慣","体を|動かす/ストレッチ/散歩する/筋トレ|する/ヨガを|する/ラジオ体操/ダンスする/イスで|体を動かす"],
    ["睡眠を|守る","早めに|寝る/日光を|浴びる/同じ時間に|起きる/スマホを|置いて寝る/部屋を|暗くする/足を|温める/カフェイン|は昼まで/寝室を|整える"],
    ["食事を|整える","野菜を|食べる/水を|飲む/朝ごはんを|食べる/ゆっくり|かむ/腹八分目に|する/間食を|減らす/果物を|食べる/たんぱく質|をとる"],
    ["体調を|記録する","体重を|測る/体温を|測る/睡眠時間を|書く/歩数を|見る/調子を|書く/鏡で|顔色を見る/気になる|所を書く/食べた物を|書く"],
    ["健康診断|を受ける","健診の日を|調べる/予約を|取る/結果を|見る/気になる|点をメモ/病院を|調べる/前回と|比べる/問診票を|書く/予定に|入れる"],
    ["休む日を|つくる","予定を|空ける/ごろごろ|する/好きな|ことをする/昼寝する/ぼーっと|する/ゆっくり|お茶を飲む/早めに|切り上げる/休みの予定|を入れる"],
    ["疲れの|サイン","肩のこりを|確認/目の疲れを|確認/眠気を|確認/疲れ具合を|書く/休憩を|とる/肩を回す/首を回す/目を休める"],
    ["気持ちを|整える","深呼吸|する/空を|見上げる/音楽を|聞く/気持ちを|書く/静かに|座る/笑える物を|見る/肩の力を|抜く/外に|出る"],
  ]},
  {id:"intel",icon:"🧠",name:"認知資産",goal:"新しい|ことを知る",subs:[
    ["本を|読む","本を|開く/10分|読む/1ページ|読む/本を|持ち歩く/本を|探す/図書館に|寄る/目次を|眺める/音声で|本を聞く"],
    ["学びを|メモする","学んだ|ことを書く/1行で|まとめる/気づきを|書く/疑問を|書く/感想を|書く/図にして|みる/要点を|3つ書く/用語を|整理する"],
    ["ニュースを|追う","記事を|読む/ニュース|番組を見る/新聞を|読む/見出しを|眺める/コラムを|1本読む/気になる|記事を保存/解説記事を|読む/言葉を|調べる"],
    ["新しい|ことを試す","新しい物を|触る/アプリを|1つ試す/AIに|質問する/調べものを|する/機能を|1つ覚える/説明書を|読む/試した|ことを書く/便利な|方法を探す"],
    ["資格に|挑戦する","資格を|調べる/試験日を|調べる/問題を|1問解く/過去問を|見る/テキストを|開く/受験料を|調べる/解説を|読む/予定を|立てる"],
    ["人の話を|聞く","動画で|学ぶ/講座を|1本見る/ラジオを|聞く/音声配信を|聞く/対談を|見る/イベントを|調べる/経験者の話|を聞く/質問を|してみる"],
    ["考えを|文章にする","考えを|書き出す/3行で|書く/日記を|書く/理由を|書く/例を1つ|書く/声に出して|読む/書いた物を|見直す/人に|教える"],
    ["ふり返りの|時間","復習する/ノートを|見返す/学びを|思い出す/間違いを|見直す/暗記カード|を見る/覚えたか|試す/学びを|整理する/今週を|ふり返る"],
  ]},
  {id:"life",icon:"🏡",name:"生活資産",goal:"気持ちよく|暮らす",subs:[
    ["朝の|流れ","カーテンを|開ける/換気する/着替える/ゴミ出し/朝ごはんを|用意/布団を|整える/顔を|洗う/歯を|みがく"],
    ["夜の|流れ","お風呂に|入る/洗い物を|する/洗濯する/寝る前に|片づける/明日の|準備/戸締まりを|確認/スマホを|充電する/目覚ましを|セット"],
    ["部屋を|片づける","5分|片づける/机を|ふく/床の物を|拾う/服を|しまう/引き出しを|1つ整理/玄関を|整える/洗面台を|ふく/掃除機を|かける"],
    ["明日の|予定を見る","カレンダー|を開く/起きる時間|を決める/約束を|確認/行き方を|調べる/持ち物を|そろえる/着る服を|選ぶ/天気を|見る/あき時間を|つくる"],
    ["買い物と|食事の計画","買い物|メモ/日用品の|在庫を見る/特売日を|調べる/献立を|考える/買う店を|決める/マイバッグ|を持つ/チラシを|見る/冷蔵庫を|見る"],
    ["持ち物を|減らす","不用品を|1つ捨てる/着ない服を|探す/ダブった|物を探す/使わない|物を分ける/カバンの|中を出す/チラシを|捨てる/収納の|中を見る/譲れる物を|探す"],
    ["もしもの|備え","非常食を|確認/水の備蓄を|見る/懐中電灯を|確認/連絡先を|控える/避難先を|調べる/常備薬を|確認/電池を|確認/家具の|固定を見る"],
    ["やる気が|出ない日","水を|1杯飲む/手を|洗う/5分だけ|動く/何か|食べる/1つだけ|片づける/休むと|決める/横になる/できたこと|を数える"],
  ]},
  {id:"relation",icon:"❤️",name:"関係資産",goal:"大切な人と|つながる",subs:[
    ["身近な人と|話す","誰かと|話す/あいさつ|する/立ち話を|する/目を見て|話す/今日の話を|する/電話で|話す/一緒に|食べる/おやすみを|伝える"],
    ["友だちに|声をかける","ひとこと|送る/返信する/スタンプを|送る/写真を|送る/電話を|かける/久しぶりに|声をかける/友だちを|誘う/未読を|見る"],
    ["感謝を|言葉にする","ありがとう|と言う/お礼を|伝える/感謝を|書く/お礼の|一言を送る/お店で|お礼を言う/感謝を|思い出す/小さな親切|に気づく/相手を|ほめる"],
    ["一緒に|過ごす","お茶に|誘う/散歩に|誘う/ごはんに|誘う/一緒に|料理する/遊ぶ|約束をする/ビデオ|通話をする/相手の|予定を聞く/一緒に|写真を撮る"],
    ["新しい|場所へ行く","近所を|歩く/初めての|店に入る/集まりを|調べる/誘いを|受ける/顔を|出してみる/違う道を|通る/気になる|場所を書く/趣味の|教室を探す"],
    ["相手の話を|聞く","調子を|聞く/最後まで|聞く/相づちを|打つ/続きを|聞いてみる/困りごとを|聞く/好きな話を|聞く/表情を|見る/休めたか|聞く"],
    ["大切な日を|覚える","誕生日を|祝う/誕生日を|聞く/カレンダー|に入れる/贈り物を|考える/お祝いを|送る/思い出の|写真を見る/喜ぶこと|を考える/前日に|確認"],
    ["ひとりの|時間","1人で|休む/静かに|過ごす/好きな物を|見る/お茶を|入れる/窓の外を|見る/ゆっくり|歩く/無理な|誘いを断る/スマホを|置く"],
  ]},
  {id:"career",icon:"💼",name:"仕事資産",goal:"仕事を|前へ進める",subs:[
    ["今日の仕事|を進める","1つ|終わらせる/最優先を|進める/連絡に|返事する/予定を|確認/後回しを|1つ終える/できた|ことを書く/明日を|計画する/時間を|記録する"],
    ["できること|を増やす","仕事の|勉強をする/新しい|方法を試す/手本を|まねる/AIに|聞いてみる/用語を|1つ覚える/使い方を|1つ覚える/業界を|調べる/資料を|読む"],
    ["まわりの|人に相談","相談する/質問する/確認を|取る/話す時間を|もらう/意見を|聞く/進み具合を|伝える/困りごとを|伝える/お願いする"],
    ["手順を|メモする","段取りを|考える/仕上がりを|決める/手順を|書き出す/順番を|並べ替える/必要な物を|書く/最初を|決める/やることを|分ける/時間を|見積もる"],
    ["勉強時間を|つくる","勉強の|道具を出す/仕事の本を|開く/記事を|1本読む/動画を|1本見る/時間を|決める/机に|向かう/10分だけ|学ぶ/学びを|使ってみる"],
    ["働き方を|ふり返る","今日を|振り返る/予定と|比べる/疲れた|ことを書く/楽だった|ことを書く/休めた|時間を探す/気づきを|書く/自分を|ほめる/明日の1つ|を決める"],
    ["自分の|強みを知る","得意な|ことを書く/スキルを|書き出す/強みを|探す/ほめられた|ことを書く/経験を|書き出す/成果を|書く/人に|強みを聞く/好きな|作業を書く"],
    ["5年後の|自分","5年後を|想像する/なりたい|姿を書く/5年前と|比べる/1年後を|決める/やりたい|ことを書く/憧れの人を|探す/会いたい|人を考える/一歩目を|決める"],
  ]},
  {id:"system",icon:"📜",name:"制度資産",goal:"手続きを|忘れずに|済ませる",subs:[
    ["使える|制度を知る","制度を|調べる/公式サイト|を見る/体験談を|読む/対象か|調べる/必要書類を|調べる/手順を|確認/費用を|調べる/申し込みを|進める"],
    ["期限を|管理する","期限を|見る/今月の|期限を見る/予定に|書き込む/残り日数を|数える/更新日を|確認/身分証の|期限を見る/通知を|設定する/期限が近い|物を探す"],
    ["書類を|まとめる","書類を|整理/書類を|確認/ファイルに|しまう/古い書類を|分ける/ラベルを|貼る/写真に|撮って残す/置き場所を|決める/届いた|郵便を見る"],
    ["相談窓口を|メモする","窓口を|調べる/受付時間を|調べる/場所を|調べる/電話番号を|調べる/予約を|調べる/持ち物を|確認/混む時間を|調べる/ネット申請|を調べる"],
    ["税金の|手続き","控除を|調べる/納付書を|確認/還付を|調べる/税金の|通知を見る/領収書を|しまう/医療費を|まとめる/申告の日を|調べる/去年の|書類を見る"],
    ["保険の|内容","税金・|保険を見る/保険の|書類を探す/加入先を|確認/保険料を|見る/保障を|確認/年金を|確認/健康保険を|確認/使い方を|調べる"],
    ["制度の|変更を知る","ニュースを|見る/見る日を|決める/変更点を|確認/新しい|制度を探す/お知らせを|読む/広報誌を|読む/来年の|変更を見る/気になる|記事を保存"],
    ["疑問を|聞いてみる","聞くことを|メモ/聞く順番を|決める/聞く人を|決める/電話か|窓口か選ぶ/予約を|取る/聞いた話を|メモ/不明点に|印をつける/次にやる|ことを書く"],
  ]},
];

function plainBar(t){ return String(t==null?'':t).split('|').join(''); }
// 見本の文字 → 折り返し位置つきの文字（見本のまま変えていないときだけ使う。自分で書きかえた文字には付かない）
const SAMPLE_HINTS = Object.create(null);   // 「constructor」のような言葉を自分で書いても、ここに引っかからないように（継承なしの入れ物）
(function(){
  SAMPLE_RAW.forEach(F=>{
    const add = t => { if(t.indexOf('|')>=0) SAMPLE_HINTS[plainBar(t)] = t; };
    add(F.goal);
    F.subs.forEach(p=>{ add(p[0]); p[1].split('/').forEach(add); });
  });
})();
function buildStarterMandala(){
  return SAMPLE_RAW.map(F=>({
    id:F.id, icon:F.icon, name:F.name, center:plainBar(F.goal),
    subGoals:F.subs.map(p=>({ text:plainBar(p[0]), subSubGoals:p[1].split('/').map(plainBar) }))
  }));
}
const STARTER_MANDALA = buildStarterMandala();

// ──────────────────────────────────────────
//  ひとつ前の版（〜v13）の見本。作り直す前の見本を「見本のままか」見分けるためだけに残してある。
//  使い方：v14への移行で、見本のままの文字だけを新しい見本に入れかえる（自分で書いた文字には触れない）。
// ──────────────────────────────────────────
function legacySubGoals(list){
  return list.map(item=>{
    if(typeof item === 'string') return {text:item, subSubGoals:Array(8).fill('')};
    const tasks = ["","","","","","","",""];
    (item.tasks||[]).forEach((t,i)=>{ if(i<8) tasks[i]=t; });
    return {text:item.text, subSubGoals:tasks};
  });
}
const LEGACY_STARTER_V13 = [
  {id:"finance",icon:"💰",name:"金融資産",center:"お金の流れを整えて、\nほうっておいても増える形をつくる",
   subGoals:legacySubGoals([
     {text:"使ったお金を\n記録する",tasks:["レシートを財布から出す","家計簿に今日の金額を書く","今週使った合計を出す"]},
     "毎月の積立を\n続ける","固定費を\n見直す","貯金の目標を\n決める",
     "使えるお金の\n制度を知る","お金の勉強を\nする","資産の合計を\n見える化する","買う前に\n一度考える",
   ])},
  {id:"health",icon:"💪",name:"健康資産",center:"無理なく続けられる形で、\n体と心を整える",
   subGoals:legacySubGoals([
     {text:"体を動かす\n習慣をつくる",tasks:["20分歩く","ストレッチを5分する","階段を使う"]},
     "睡眠の時間を\n守る","食事のリズムを\n整える","体調を\n記録する",
     "定期的に\n検診を受ける","休む日を\nつくる","疲れのサインに\n気づく","こころの調子を\n書きとめる",
   ])},
  {id:"intel",icon:"🧠",name:"認知資産",center:"学び続けて、\n考える力を伸ばす",
   subGoals:legacySubGoals([
     {text:"本を読む",tasks:["本を10ページ読む","気になった一文をメモする","読んだ内容を人に話す"]},
     "学んだことを\nメモする","ニュースを\n追いかける","新しい道具を\n試す",
     "資格や検定に\n挑戦する","人の話を\n聞きに行く","考えを\n文章にする","ふり返りの\n時間をとる",
   ])},
  {id:"life",icon:"🏡",name:"生活資産",center:"毎日の仕組みを整えて、\n暮らしを楽にする",
   subGoals:legacySubGoals([
     {text:"朝の流れを\n決める",tasks:["起きたらカーテンを開ける","朝ごはんを食べる","出かける前に持ち物を確認する"]},
     "夜の流れを\n決める","部屋を\n片づける","明日の予定を\n確認する",
     "買い物と食事を\n計画する","持ち物を\n減らす","困ったときの\n備えをする","崩れた日の\n最小の行動を決める",
   ])},
  {id:"relation",icon:"❤️",name:"関係資産",center:"大事な人とのつながりを、\n無理なく続ける",
   subGoals:legacySubGoals([
     {text:"家族と話す",tasks:["今日あったことを話す","ありがとうを言葉にする","一緒にごはんを食べる"]},
     "友だちに\n連絡する","感謝を\n言葉にする","一緒に過ごす\n時間をつくる",
     "新しい場所に\n顔を出す","相手の話を\n聞く","記念日を\n覚えておく","ひとりの時間も\n大切にする",
   ])},
  {id:"career",icon:"💼",name:"仕事資産",center:"今の仕事を続けながら、\n次の選択肢を増やす",
   subGoals:legacySubGoals([
     {text:"今日の仕事を\n記録する",tasks:["やった仕事を3行で書く","明日やることを3つ決める","うまくいったことを1つ書く"]},
     "できることを\n増やす","職場の人に\n相談する","手順をメモに\n残す",
     "勉強の時間を\nつくる","働き方を\nふり返る","収入のたねを\n探す","5年後の自分を\n考える",
   ])},
  {id:"system",icon:"📜",name:"制度資産",center:"使える仕組みは調べて、\nもれなく使う",
   subGoals:legacySubGoals([
     {text:"使える制度を\n調べる",tasks:["自治体のページを見る","気になった制度をメモする","窓口の連絡先を控える"]},
     "申請の期限を\n管理する","書類を1か所に\nまとめる","相談できる窓口を\n控える",
     "税金の控除を\n確認する","保険の内容を\n確認する","制度のニュースを\n見る","分からない点を\n聞きに行く",
   ])},
];

// 〜v13 → v14（2026-11-02）の移行で使う：見本のままの人にだけ、新しい見本（448マス）を入れる。
// 見本のままかどうかは、(1) 保存してある sampleMode が true（曼陀羅の文字を保存すると必ず false になる）
// かつ (2) その場所の文字が「空」か「ひとつ前の見本そのまま」のときだけ入れかえる、の二重で確かめる。
// 自分で書いた文字は、見本と違う文字なので、必ずそのまま残る。
function upgradeSampleToV14(d){
  if(!d || d.sampleMode!==true || !Array.isArray(d.mandala)) return;
  d.mandala.forEach(m=>{
    if(!m || typeof m!=='object' || !Array.isArray(m.subGoals)) return;
    const f = STARTER_MANDALA.find(x=>x.id===m.id), o = LEGACY_STARTER_V13.find(x=>x.id===m.id);
    if(!f || !o) return;
    const swap = (cur, oldSample, fresher) => (cur===undefined || cur===null || cur==='' || cur===oldSample) ? fresher : cur;
    m.center = swap(m.center, o.center, f.center);
    f.subGoals.forEach((fs,i)=>{
      const ms = m.subGoals[i];
      if(!ms || typeof ms!=='object') return;
      const os = o.subGoals[i] || {text:'', subSubGoals:[]};
      ms.text = swap(ms.text, os.text, fs.text);
      if(!Array.isArray(ms.subSubGoals)) ms.subSubGoals = [];
      for(let k=0;k<8;k++) ms.subSubGoals[k] = swap(ms.subSubGoals[k], os.subSubGoals[k]||'', fs.subSubGoals[k]);
    });
  });
}

// ══════════════════════════════════════════
//  DEFAULT DATA
// ══════════════════════════════════════════
const DEFAULT_DATA = {
  dataVersion: DATA_VERSION,
  updatedAt:"2026-11-02",
  sampleMode:true,        // 見本が入っている状態（自分で決めたら false になる）
  wave:{status:"stable",label:"🟢 安定"},
  checkins:{},
  autoCheckins:{},
  lifeLog:{},
  taskDone:{},
  taskLog:{},
  lastBackup:'',
  settings:{medsTime:'', theme:'auto'},   // この端末だけの設定。medsTime=服薬の時刻（最初は空）／theme=画面の明るさ（auto=端末に合わせる／light/dark=手で選んだ設定）
  health:{weight:{}, steps:{}, runs:{}},  // ヘルスケア連携（2026-09-25）。iPhoneのショートカット経由で届いた値だけが入る。キーは日付（YYYY-MM-DD）
  tasks:[
    {text:"やったことのマスを、1つ押してみる",done:false,doneDate:''},
    {text:"コアゴールを自分の言葉に書きかえる",done:false,doneDate:''},
    {text:"サブゴールを1つ選んで、中の行動を書きかえる",done:false,doneDate:''},
  ],
  assets:[
    {id:"finance",icon:"💰",name:"金融資産",status:"yellow",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
    {id:"health",icon:"💪",name:"健康資産",status:"gray",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
    {id:"intel",icon:"🧠",name:"認知資産",status:"gray",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
    {id:"life",icon:"🏡",name:"生活資産",status:"gray",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
    {id:"relation",icon:"❤️",name:"関係資産",status:"gray",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
    {id:"career",icon:"💼",name:"仕事資産",status:"gray",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
    {id:"system",icon:"📜",name:"制度資産",status:"gray",behavior:0,behaviorLabel:"未入力",subjective:0,subjectiveLabel:"未入力"},
  ],
  summaries:[
    {id:"finance",icon:"💰",title:"金融資産 — マーケット動向",items:["最新ニュースを取得中です（↻ 更新を押してください）"],source:"自動ニュース収集"},
    {id:"health",icon:"💪",title:"健康資産 — 健康トピック",items:["最新ニュースを取得中です"],source:"自動ニュース収集"},
    {id:"intel",icon:"🧠",title:"認知資産 — AI・テクノロジー",items:["最新ニュースを取得中です"],source:"自動ニュース収集"},
    {id:"life",icon:"🏡",title:"生活資産 — 生活・社会",items:["最新ニュースを取得中です"],source:"自動ニュース収集"},
    {id:"relation",icon:"❤️",title:"関係資産 — トレンド",items:["最新ニュースを取得中です"],source:"自動ニュース収集"},
    {id:"career",icon:"💼",title:"仕事資産 — キャリア・副業",items:["最新ニュースを取得中です"],source:"自動ニュース収集"},
    {id:"system",icon:"📜",title:"制度資産 — 制度・法律",items:["最新ニュースを取得中です"],source:"自動ニュース収集"},
  ],
  mandala: JSON.parse(JSON.stringify(STARTER_MANDALA)),
};

// ══════════════════════════════════════════
//  資産の名前（画面に出す名前）
//  2026-11-02 社長決定：「〜資産」という言葉は外さない。名前は 金融資産・健康資産・認知資産・生活資産・
//  関係資産・仕事資産・制度資産 のまま、保存してある名前をそのまま出す（自分で書きかえた名前も、書いたとおり）。
//  （同じ日の最初の決定「お金など短い名前にする」は、社長が取り消した。画面に出す名前を変えたくなったら、ここ1か所で足りる）
// ══════════════════════════════════════════
function assetLabel(a){ return a ? String(a.name==null?'':a.name) : ''; }

// ══════════════════════════════════════════
//  マーク（部品）
//  2026-08-08：ロゴの七色の点＋中心の点。開幕画面と、読み込み中の
//  合図（ニュース取得・引っ張って更新）の両方で、このSVGを使い回す。
//  待つ場所ごとにバラバラの見た目にならないよう、この1つの部品だけを使う。
//
//  mode で見た目を切り替える（デザイン班「動きの指定」より）：
//    'spin'          … 常時回転（ease無し・一定速度）。2026-08-11時点、待機中に使う場面のための
//                        予備で、いまはどこからも呼んでいない（開幕はindex.html側で.lo-splash-inを直接指定）
//    true / 'loading' … 点が順に光って一周（読み込み中。回転ではない）
//    false / 省略     … 静止（動いていない状態）
//  data-dot="1"〜"7" は読み込み中モード（.lo-loader）が各点の光る順番を
//  決めるのに使う。常時回転・静止のときは付いていても効果はない。
// ══════════════════════════════════════════
function markSpinnerSVG(mode){
  let cls = '';
  if(mode === 'spin') cls = ' lo-mark-spin';
  else if(mode === true || mode === 'loading') cls = ' lo-loader';
  return `<svg class="mark-spinner${cls}" viewBox="0 0 120 120" aria-hidden="true">
    <circle class="d1" data-dot="1" cx="60" cy="21.8" r="9.8"></circle>
    <circle class="d2" data-dot="2" cx="89.9" cy="36.2" r="9.8"></circle>
    <circle class="d3" data-dot="3" cx="97.2" cy="68.5" r="9.8"></circle>
    <circle class="d4" data-dot="4" cx="76.6" cy="94.4" r="9.8"></circle>
    <circle class="d5" data-dot="5" cx="43.4" cy="94.4" r="9.8"></circle>
    <circle class="d6" data-dot="6" cx="22.8" cy="68.5" r="9.8"></circle>
    <circle class="d7" data-dot="7" cx="30.1" cy="36.2" r="9.8"></circle>
    <circle class="dc" cx="60" cy="60" r="11.8"></circle>
  </svg>`;
}

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
let DATA = loadData();
let editMode = false;
let currentMandala = 0;
let currentSubGoal = 0;      // 開いているサブゴールの番号（0〜7）。どの画面かは mView（下の9マスの節）で決まる
let modalCallback = null;

function loadData(){
  try{
    const s = localStorage.getItem('jibun-data');
    if(s){
      const d = JSON.parse(s);
      const _prevVer = d.dataVersion;
      // 議事録はreports.jsに分離済み（古い保存データの残骸を除去）
      delete d.reports;
      // 継続のきろく（v2.1で追加）— 既存データに無ければ用意
      if(!d.checkins) d.checkins={};
      // 生活リズム記録：起床・服薬・就寝（v7で追加）— 既存データに無ければ用意
      if(!d.lifeLog) d.lifeLog={};
      // 曼陀羅タスクの「やった」記録（v8で追加）— 既存データに無ければ用意
      // 形は checkins と同じ {"YYYY-MM-DD":["資産id|サブゴール番号|タスク番号", ...]}
      if(!d.taskDone || typeof d.taskDone!=='object' || Array.isArray(d.taskDone)) d.taskDone={};
      // 曼陀羅から自動でついたホームの印の目印（v9で追加）— 既存データに無ければ用意
      if(!d.autoCheckins || typeof d.autoCheckins!=='object' || Array.isArray(d.autoCheckins)) d.autoCheckins={};
      // マイグレーション v1 → v2: 偽スコアをリセット
      if(!d.dataVersion || d.dataVersion < 2){
        d.assets = d.assets.map(a => {
          if(a.id === 'health' && a.behavior > 0 && a.behaviorLabel === '70%'){
            return {...a, behavior:0, behaviorLabel:'未入力', subjective:0, subjectiveLabel:'未入力', status:'gray'};
          }
          if(a.id === 'intel' && a.behavior > 0 && a.behaviorLabel === '80%'){
            return {...a, behavior:0, behaviorLabel:'未入力', subjective:0, subjectiveLabel:'未入力', status:'gray'};
          }
          return a;
        });
      }
      // v2〜v6 の「金融の言葉を自動で新しい版に書きかえる」処理は v9 で廃止した。
      // 理由：その処理は特定の人の目標の文章をコードに持っている必要があり、
      // このアプリを他の人が使えるようにするうえで残せないため。
      // すでに保存されている文言はそのまま残る（消したり書きかえたりしない）。
      //
      // v8 → v9：見本かどうかの目印を足すだけ。
      // すでに使っている人のデータは「自分で決めたもの」として扱う（見本の案内を出さない）。
      if(typeof d.sampleMode !== 'boolean') d.sampleMode = false;
      //
      // v9 → v10：足すだけの変更を3つ。
      // ① 今日のタスクに「チェックした日」を持たせる。
      //    これまでは一度チェックすると永久に消えず、次の日も「済み」のままだった。
      //    日付を持たせると、日が変われば自動でチェックが外れる。
      //    いまチェックが付いているものは「今日チェックした」ものとして扱う（今日の見た目は変わらない）。
      // ② 今日のタスクをやった記録を日付ごとに残す（taskLog）。
      // ③ 最後にバックアップを書き出した日を、データ本体の中へ引っ越す。
      //    これまではブラウザの別の場所に置いていたため、書き出したファイルに入っていなかった。
      if(!d.taskLog || typeof d.taskLog!=='object' || Array.isArray(d.taskLog)) d.taskLog={};
      if(Array.isArray(d.tasks)){
        const _t=dkey();
        d.tasks.forEach(t=>{
          if(!t || typeof t!=='object') return;
          if(t.done && !t.doneDate){
            t.doneDate=_t;
            const arr=Array.isArray(d.taskLog[_t])?d.taskLog[_t]:[];
            if(arr.indexOf(t.text)<0) arr.push(t.text);
            d.taskLog[_t]=arr;
          }
          if(typeof t.doneDate!=='string') t.doneDate='';
        });
      }
      if(typeof d.lastBackup!=='string'){
        let _old=''; try{ _old=localStorage.getItem('lastBackup')||''; }catch(e){}
        d.lastBackup=_old;
      }
      //
      // v10 → v11：この端末だけの設定を置く場所（settings）を足すだけ。
      // 第1号は服薬のお知らせの時刻。これまでは「21時以降」とプログラムに直接
      // 書いてあったが、薬をのむ時刻は人によって違うため、他の人が使うと
      // 見当違いの時刻に「そろそろ」と出てしまう。時刻は使う人が選び、
      // その端末の中だけに持たせる。
      if(!d.settings || typeof d.settings!=='object' || Array.isArray(d.settings)) d.settings={};
      if(typeof d.settings.medsTime!=='string') d.settings.medsTime='';
      //
      // v11 → v12：画面の明るさ設定（theme）を足すだけ。
      // 決めるまでは 'auto'（これまで通り、端末の設定にそのまま従う＝見え方は変わらない）。
      if(d.settings.theme!=='light' && d.settings.theme!=='dark') d.settings.theme='auto';
      //
      // v12 → v13：ヘルスケア連携（体重・歩数・ランニング）の置き場所を足すだけ。
      // 中身は空のまま。iPhoneのショートカットからURLの#（フラグメント）経由で
      // 届いた値だけが、これから入っていく（applyHealthFragment参照）。
      if(!d.health || typeof d.health!=='object' || Array.isArray(d.health)) d.health={};
      if(!d.health.weight || typeof d.health.weight!=='object' || Array.isArray(d.health.weight)) d.health.weight={};
      if(!d.health.steps || typeof d.health.steps!=='object' || Array.isArray(d.health.steps)) d.health.steps={};
      if(!d.health.runs || typeof d.health.runs!=='object' || Array.isArray(d.health.runs)) d.health.runs={};
      //
      // v13 → v14（2026-11-02・9マスの作り直し）：足すだけの移行。
      // 見本のまま使っている人（sampleMode が true）の「見本のままの文字」だけを、新しい見本（448マス）に入れかえる。
      // 自分で書いた文字・記録・設定には一切さわらない（upgradeSampleToV14 の説明を参照）。
      if(!_prevVer || _prevVer<14) upgradeSampleToV14(d);
      // 既存の checkins / lifeLog / taskDone / 曼陀羅の文言には一切さわらない
      d.dataVersion = DATA_VERSION;
      if(_prevVer !== DATA_VERSION){ try{ localStorage.setItem('jibun-data', JSON.stringify(d)); }catch(e){} }
      return d;
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }catch(e){ return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}
function saveData(){ localStorage.setItem('jibun-data', JSON.stringify(DATA)); }

// ══════════════════════════════════════════
//  記録が消えないようにする（最優先の手当て）
//
//  iPhoneのSafariには「そのサイトを7日ひらかないと、保存した中身を消す」
//  という決まりがある（Apple自身が公表している仕様）。
//  ただし「ホーム画面に追加」したアプリはこの対象から外れる、とも書かれている。
//  出典：https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
//
//  そこでこのアプリは、
//   ① iPhoneでブラウザのまま開いている人には、消える危険と追加のしかたを大きく出す
//   ② いまどちらで開いているかを、レポート画面でいつでも確かめられるようにする
//   ③ 記録がたまってきたのにバックアップが古い人には、書き出しをうながす
//  の3つで守る。
// ══════════════════════════════════════════
function isStandalone(){
  try{
    if(window.navigator.standalone===true) return true;
    return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }catch(e){ return false; }
}
function isIOS(){
  const ua=navigator.userAgent||'';
  if(/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform==='MacIntel' && navigator.maxTouchPoints>1; // iPadOS
}
// 動作確認用：アドレスの末尾に ?homescreen=test を付けると、どの端末でも案内を出せる
function forceHomeScreenWarn(){ return location.search.indexOf('homescreen=test')>=0; }
// LINE・Facebook・Instagram・X などの「アプリの中のブラウザ」で開いているか。
// ここには「ホーム画面に追加」のボタンが無いので、先にSafariで開き直してもらう必要がある。
// 配ったリンクはLINEで回ることが多く、実際にいちばん多いつまずきになる。
function isInAppBrowser(){
  const ua=navigator.userAgent||'';
  return /Line\//i.test(ua) || /FBAN|FBAV|FB_IAB/i.test(ua)
      || /Instagram/i.test(ua) || /Twitter/i.test(ua);
}
// 「どうしても追加できない」を選んだ記録。この端末だけの事情なので、
// 記録の本体（書き出して持ち運ぶデータ）ではなくブラウザ側に置く。
function hsGateAcked(){ try{ return localStorage.getItem('hsGateAck')==='1'; }catch(e){ return false; } }

// ── さいしょの入口（2026-08-01）─────────────────────────────
// これまでは赤い注意書きを出すだけで、「あとで」を押せば先へ進めた。
// 進んだ人の記録は7日で黙って消える。消えたことに本人が気づく方法もない。
// そこで、iPhoneでブラウザのまま開いている人には、この入口でいったん止める。
//
// ただし完全にふさぐことはしない。LINEの中のブラウザ・会社から渡された端末など、
// 本当に追加できない場合があり、そこで閉め出すと「壊れて開けないアプリ」になって
// 二度と開かれなくなる。だから逃げ道は残すが、最初は見せない。
// 「追加できた」を押した人にだけ、そのあとで小さく出す。
function needHomeScreenGate(){
  if(forceHomeScreenWarn()) return true;
  return isIOS() && !isStandalone() && !hsGateAcked();
}
function renderHomeScreenGate(){
  const g=document.getElementById('hs-gate');
  if(!g) return;
  if(!needHomeScreenGate()){
    g.style.display='none';
    document.body.classList.remove('gated');
    return;
  }
  const steps = isInAppBrowser()
    ? `<div class="gate-lead">いまはLINEなどのアプリの中で開いています。この画面のままでは追加できないので、まずSafariで開き直してください。</div>
       <ol class="gate-steps">
         <li>画面の<b>右上か右下にある「…」</b>（点が3つ）を押す</li>
         <li><b>「Safariで開く」</b>（または「ブラウザで開く」）を押す</li>
         <li>Safariに切りかわったら、この画面の続きが出ます</li>
       </ol>`
    : `<ol class="gate-steps">
         <li>画面の下（機種によっては右上）の <b>共有ボタン</b>を押す<br><span class="gate-sub">四角から上向きの矢印が出ている絵です</span></li>
         <li>出てきた一覧を下へたどって <b>「ホーム画面に追加」</b> を押す</li>
         <li>右上の <b>「追加」</b> を押す</li>
         <li>ホーム画面にできた <b>Life Orbit のアイコン</b>から開く<br><span class="gate-sub">これからは毎回このアイコンから開きます</span></li>
       </ol>`;
  g.innerHTML=`
    <div class="gate-box">
      <div class="gate-title">はじめに、1分だけ</div>
      <div class="gate-lead2">
        iPhoneには「7日ひらかなかったサイトの中身を消す」という決まりがあります。
        いまの開き方だと、7日あけただけで、つけた記録が全部なくなります。<br>
        <b>ホーム画面に追加すると消えなくなります。</b>
      </div>
      ${steps}
      <button class="gate-done" onclick="checkHomeScreenGate()">追加できたので、つぎへ</button>
      <div class="gate-msg" id="gate-msg"></div>
    </div>`;
  g.style.display='block';
  document.body.classList.add('gated');
}
function checkHomeScreenGate(){
  // ホーム画面のアイコンから開き直せば、この入口はもう出ない。
  if(isStandalone()){ renderHomeScreenGate(); renderHomeScreenWarn(); renderIntroGuide(); return; }
  const m=document.getElementById('gate-msg');
  if(!m) return;
  m.innerHTML=`
    <div class="gate-next">
      <b>あとひとつです。</b><br>
      いったんこの画面を閉じて、ホーム画面にできた <b>Life Orbit のアイコン</b>から開いてください。
      アイコンから開くと、この案内はもう出ません。
    </div>
    <button class="gate-skip" onclick="ackHomeScreenGate()">どうしても追加できないので、このまま使う</button>`;
}
function ackHomeScreenGate(){
  const ok=confirm('ホーム画面に追加しないまま使うと、7日ひらかなかったときに記録が消えることがあります。\n\nそれでもこのまま使いますか？');
  if(!ok) return;
  try{ localStorage.setItem('hsGateAck','1'); }catch(e){}
  renderHomeScreenGate();
  renderHomeScreenWarn();
  renderIntroGuide();
}
function reopenHomeScreenGate(){
  try{ localStorage.removeItem('hsGateAck'); }catch(e){}
  renderHomeScreenGate();
  renderHomeScreenWarn();
  renderIntroGuide();
}
// ホームに出しつづける注意書き。「このまま使う」を選んだ人にだけ、消えない形で出す。
function renderHomeScreenWarn(){
  const sec=document.getElementById('hs-warn-section');
  if(!sec) return;
  const risky = isIOS() && !isStandalone() && hsGateAcked();
  sec.style.display = risky ? 'block' : 'none';
}

// ══════════════════════════════════════════
//  初回ガイド（3画面・2026-08-12）
//  正本：03_知性MGR/設計_20260807_初回ガイド.md（文言・画面数・順番・締めの一文はここに合わせる）
//  出す順番：ホーム画面追加の案内（↑renderHomeScreenGate）が先、こちらはあと。
//  needHomeScreenGate()がtrueの間（iPhoneでSafariのままかつ未承諾）は出さない。
//  理由は設計書4章の2点＝①hs-gateが画面全体を覆って先にブロックする作りなので、
//  技術的にも同時には見えない ②土台（データが消えない状態）を先に固めてから中身を見せる、
//  という順番がそもそも正しいため。
//  一度最後まで読むか「とばす」を押すと、次回からは自動では出ない
//  （hsGateAckと同じ考え方で、この端末のlocalStorageだけに'loGuideAck'を残す。書き出す
//  控えファイル・サーバーには一切乗らない）。
// ══════════════════════════════════════════
function introGuideAcked(){ try{ return localStorage.getItem('loGuideAck')==='1'; }catch(e){ return false; } }
// レポート画面の「使い方ガイドをもう一度見る」から開いたときだけtrueにする一時フラグ。
// ここをtrueにする代わりに'loGuideAck'を消してしまうと、まだ最後まで読み終える前に
// アプリを閉じた場合、次回起動時にも「初めて開いた人」と同じ扱いで自動的にまた出てしまう
// （もう一度見ただけの人を、また初見の人として扱う事故になる）。それを避けるため、
// 「もう一度見る」は保存済みの既読記録に触らない別ルートにした。
let introGuideForceOpen = false;
let introGuideStep = 0;
// 2026-11-02：初めて開いた人の「最初の記録は3タップ以内」を守るため、3画面のガイドを最初から全画面で出すのをやめた。
// 代わりに、9マスの下に小さな「はじめに」カードを出す（押さなくても、光っているマスをそのまま押せる）。
// 3画面のガイドは、カードの「使い方を見る」とレポート画面の「使い方ガイドをもう一度見る」から開く。
// 以前の動き（初めて開いたら全画面で3画面）に戻すには、下の true / false を入れかえるだけ。
const GUIDE_FIRST_RUN_FULLSCREEN = false;
function needIntroGuide(){
  return introGuideForceOpen || (GUIDE_FIRST_RUN_FULLSCREEN && !needHomeScreenGate() && !introGuideAcked());
}
function needGuideCard(){
  return !GUIDE_FIRST_RUN_FULLSCREEN && !introGuideForceOpen && !needHomeScreenGate() && !introGuideAcked();
}
function renderGuideCard(){
  const el=document.getElementById('guide-card');
  if(!el) return;
  if(!needGuideCard()){ el.innerHTML=''; return; }
  const s0=INTRO_GUIDE_SCREENS[0];
  el.innerHTML=`<div class="guide-card" role="region" aria-label="${esc(s0.title)}">
    <div class="gc-title">${esc(s0.title)}</div>
    <div class="gc-body">${esc(s0.body)}</div>
    <div class="gc-row">
      <button type="button" class="gc-btn" onclick="reopenIntroGuide(1)">使い方を見る</button>
      <button type="button" class="gc-btn quiet" onclick="skipIntroGuide()">とじる</button>
    </div>
  </div>`;
}
// 画面3のアイコン・名前・並び順は、使う人が資産を書きかえたり消したりしても変わらない
// 固定の説明用リストにしてある（DATA.assetsを直接見ると、名前を変えた人には
// 違う説明が出てしまうため）。並びは社長指示どおり、いつもの7資産の順番。
const INTRO_GUIDE_ASSETS = [
  {icon:'💰',name:'金融資産'}, {icon:'💪',name:'健康資産'}, {icon:'🧠',name:'認知資産'},
  {icon:'🏡',name:'生活資産'}, {icon:'❤️',name:'関係資産'}, {icon:'💼',name:'仕事資産'}, {icon:'📜',name:'制度資産'},
];
const INTRO_GUIDE_SCREENS = [
  {
    title:'はじめに',
    body:'Life Orbitは、今日ちゃんと動けたという手ごたえを、毎日感じるための道具です。目標を達成できたかどうかより、今日動いたかどうかを大事にします。',
    purple:true,
  },
  {
    title:'9つのマスのしくみ',
    // 2026-11-02：「押したマスは色が変わって残る」は実物と違っていた（緑になるのは押した日だけ。残るのは四角の色と回数）。実物どおりに直した。
    // 2026-11-03：知性MGR 6-2の1行目。「細かい画面」「中身」をやめ、コアゴール／サブゴールの意味をここで初めて言う。記録になるのは3段目の行動のマスだけ。
    body:'真ん中が目標（コアゴール）、まわりの8つがそのためにやること（サブゴール）です。サブゴールを押すと、その中にある8つの行動が開きます。やった行動のマスを押すと、緑になって今日の記録になります。押した回数は小さな四角と数字で残り、押せなかった日があっても減りません。',
    visual:'grid',
  },
  {
    title:'7つの資産がある',
    body:'金融資産（お金）・健康資産（体と心）・認知資産（学び）・生活資産（暮らし）・関係資産（人とのつながり）・仕事資産（仕事）・制度資産（使える制度）。この7つに、同じ9マスのしくみがあります。全部やらなくて大丈夫です。今日やったことがある資産を1つ選んで、マスを押してみましょう。',
    visual:'assets',
    closing:'今日動いた分は、消えずに積み上がっていく。',
    finishLabel:'はじめる',
  },
];
function renderIntroGuide(){
  renderGuideCard();
  const el=document.getElementById('lo-guide');
  if(!el) return;
  if(!needIntroGuide()){
    el.style.display='none';
    el.className='lo-guide';
    document.body.classList.remove('lo-guiding');
    return;
  }
  if(introGuideStep<0) introGuideStep=0;
  if(introGuideStep>INTRO_GUIDE_SCREENS.length-1) introGuideStep=INTRO_GUIDE_SCREENS.length-1;
  const s=INTRO_GUIDE_SCREENS[introGuideStep];
  const first=introGuideStep===0;
  const last=introGuideStep===INTRO_GUIDE_SCREENS.length-1;
  const dots=INTRO_GUIDE_SCREENS.map((_,i)=>`<span class="lo-guide-dot ${i===introGuideStep?'on':''}"></span>`).join('');
  let visualHtml='';
  if(s.visual==='grid'){
    // 3×3の図。中心を大きく、8マスのうち3つだけ色をつける（全部埋めない＝これから自分で
    // 埋めていく余地があると伝えるため。設計書2章の指示どおり、資産の7色から1色だけ使う）。
    visualHtml=`<div class="lo-guide-demo-grid" aria-hidden="true">
      <span class="lo-gd-cell lo-gd-fill"></span><span class="lo-gd-cell"></span><span class="lo-gd-cell lo-gd-fill"></span>
      <span class="lo-gd-cell"></span><span class="lo-gd-cell lo-gd-center">🔷</span><span class="lo-gd-cell"></span>
      <span class="lo-gd-cell"></span><span class="lo-gd-cell"></span><span class="lo-gd-cell lo-gd-fill"></span>
    </div>`;
  }else if(s.visual==='assets'){
    visualHtml=`<div class="lo-guide-assets" aria-hidden="true">${INTRO_GUIDE_ASSETS.map(a=>
      `<div class="lo-ga-item"><span class="lo-ga-icon">${a.icon}</span><span class="lo-ga-name">${esc(a.name)}</span></div>`
    ).join('')}</div>`;
  }
  el.className='lo-guide'+(s.purple?' lo-guide-purple':'');
  el.innerHTML=`
    <button type="button" class="lo-guide-skip" onclick="skipIntroGuide()">とばす</button>
    <div class="lo-guide-box">
      <div class="lo-guide-dots" aria-hidden="true">${dots}</div>
      <div class="lo-guide-title">${esc(s.title)}</div>
      <div class="lo-guide-body">${esc(s.body)}</div>
      ${visualHtml}
      ${s.closing?`<div class="lo-guide-closing">${esc(s.closing)}</div>`:''}
      <div class="lo-guide-nav">
        ${first?'':'<button type="button" class="lo-guide-btn back" onclick="introGuideBack()">← 戻る</button>'}
        <button type="button" class="lo-guide-btn next" onclick="${last?'finishIntroGuide()':'introGuideNext()'}">${esc(last?s.finishLabel:'次へ')}</button>
      </div>
    </div>`;
  el.style.display='block';
  document.body.classList.add('lo-guiding');
}
function introGuideNext(){ introGuideStep++; renderIntroGuide(); }
function introGuideBack(){ introGuideStep--; renderIntroGuide(); }
function skipIntroGuide(){
  try{ localStorage.setItem('loGuideAck','1'); }catch(e){}
  introGuideForceOpen=false;
  renderIntroGuide();
}
// 画面3「はじめる」。設計書5章の指示どおり、閉じて終わりにはしない。閉じた先は9マスの画面
// （このガイドの下にすでにある最初の画面）で、光っているマスを押せばそのまま最初の1回を記録できる。
// 別の説明画面・お知らせは一切挟まない。
function finishIntroGuide(){
  try{ localStorage.setItem('loGuideAck','1'); }catch(e){}
  introGuideForceOpen=false;
  introGuideStep=0;
  renderIntroGuide();
}
// レポート画面「使い方ガイドをもう一度見る」から呼ぶ。既読の記録は消さない
// （消すと、まだ読み終える前に閉じたときに次回また自動で出てしまうため）。
// 2026-11-03：カードの「使い方を見る」からは2画面目から始める（カードで1画面目の文を読んだばかりのため。
// 「戻る」で1画面目へ戻れる）。レポートからは引数なしで、今までどおり1画面目から。
function reopenIntroGuide(startStep){
  introGuideForceOpen=true;
  introGuideStep=(startStep>0)?startStep:0;
  renderIntroGuide();
}
// いまどうやって開いているか（レポート画面に出す）
function renderOpenMode(){
  const el=document.getElementById('open-mode');
  if(!el) return;
  if(isStandalone()){
    el.className='open-mode ok';
    el.textContent='✅ いまはホーム画面のアイコンから開いています。この開き方なら記録は消えません。';
  }else if(isIOS()){
    el.className='open-mode warn';
    el.textContent='⚠️ いまはSafariのタブから開いています。7日ひらかないと記録が消えることがあります。ホーム画面に追加してください。';
  }else{
    el.className='open-mode plain';
    el.textContent='いまはパソコンやAndroidのブラウザから開いています。記録はこのブラウザの中だけに残ります。';
  }
}
// 記録がある日数（バックアップをうながすかどうかの判断に使う）
function recordedDayCount(){
  const set={};
  ['checkins','lifeLog','taskDone','taskLog'].forEach(name=>{
    const o=DATA[name]||{};
    Object.keys(o).forEach(k=>{
      const v=o[k];
      const has = Array.isArray(v) ? v.length>0 : (v && typeof v==='object' ? Object.keys(v).length>0 : !!v);
      if(has) set[k]=1;
    });
  });
  return Object.keys(set).length;
}
function daysSinceDate(s){
  if(!s) return null;
  const t=new Date(String(s)+'T00:00:00');
  if(isNaN(t.getTime())) return null;
  const today=new Date(); today.setHours(0,0,0,0);
  return Math.round((today.getTime()-t.getTime())/86400000);
}
function renderBackupNudge(){
  const el=document.getElementById('backup-nudge');
  const sec=document.getElementById('backup-nudge-section');
  if(!el || !sec) return;
  const days=recordedDayCount();
  const since=daysSinceDate(DATA.lastBackup);
  const need = days>=3 && (since===null || since>=14);
  const s=Number(localStorage.getItem('bkSnooze')||0);
  const snoozed = s>0 && (Date.now()-s) < 3*86400000;
  if(!need || snoozed){ sec.style.display='none'; el.innerHTML=''; return; }
  const line = since===null
    ? `${days}日ぶんの記録がたまりました。まだ一度も控えを取っていません。`
    : `前に控えを取ってから${since}日たちました。`;
  sec.style.display='block';
  el.innerHTML=`
    <div class="nudge-title">📤 記録の控えを取りませんか</div>
    <div class="nudge-body">${line}<br>ボタンを押すとファイルが1つできます。スマホを変えたときや、記録が消えたときに、そこから元どおりに戻せます。</div>
    <div class="nudge-row">
      <button class="nudge-btn go" onclick="exportData()">いま控えを取る</button>
      <button class="nudge-btn later" onclick="snoozeBackupNudge()">あとで</button>
    </div>`;
}
function snoozeBackupNudge(){
  try{ localStorage.setItem('bkSnooze',String(Date.now())); }catch(e){}
  const sec=document.getElementById('backup-nudge-section');
  if(sec) sec.style.display='none';
}

// ══════════════════════════════════════════
//  継続のきろく（カレンダー＋ストリーク）
// ══════════════════════════════════════════
const CAL_WEEKS = 17;
function dkey(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
// 画面に文字を出すときの安全処理（< や > をそのまま文字として見せる）
// 画面に文字を出す前に、危ない記号を無害な文字に置き換える。
// 2026-08-09 セキュリティ部署の指摘を受けて引用符（" '）も対象に追加。
// これまでは <input value="${esc(x)}"> のような「属性値の中」に入れたとき、
// xの中に " が入っていると、そこで属性が終わったことになり、
// 偽のバックアップファイルを読み込んだ場合に画面のHTMLを壊せてしまっていた。
// エンティティ化しても、画面に表示されるときはブラウザが元の文字（" '）に戻して見せるので、
// 通常の文字（タスク名など）の見た目は今までと変わらない。
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
// その日に1つでも資産を機能させたか（旧形式 true も継続対応）
function dayCount(k){ const v=(DATA.checkins||{})[k]; return Array.isArray(v)?v.length:(v===true?1:0); }
function dayOn(k){ return dayCount(k)>0; }
// 今日その資産を機能させたか
function functionedToday(id){ const v=(DATA.checkins||{})[dkey()]; return Array.isArray(v)&&v.indexOf(id)>=0; }
// 今日その資産を「機能した／取り消し」する＝唯一の毎日アクション
function toggleAssetToday(id){
  if(!DATA.checkins) DATA.checkins={};
  const k=dkey();
  let arr=Array.isArray(DATA.checkins[k])?DATA.checkins[k]:[];
  const wasEmpty=arr.length===0;
  const i=arr.indexOf(id);
  const adding=i<0;
  if(adding) arr.push(id); else arr.splice(i,1);
  if(arr.length>0) DATA.checkins[k]=arr; else delete DATA.checkins[k];
  forgetAuto(id); // 自分の指で押した／消した印は、以後こちらの持ち物として扱う
  saveData(); renderStreak(); renderAssets(); renderBrief();
  if(adding && wasEmpty) celebrate(); // その日の最初の1タップだけお祝い
}
function monthCount(){
  const now=new Date();
  const pre=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  return Object.keys(DATA.checkins||{}).filter(k=>k.indexOf(pre)===0 && dayOn(k)).length;
}
function renderStreak(){
  // 2026-11-03 社長決定：連続日数（🔥N日連続）は画面に出さない。月の日数とカレンダーだけ残す。記録データは消していない
  const elMonth=document.getElementById('streak-month'); if(!elMonth) return;
  elMonth.textContent='今月 '+monthCount()+'日 機能';
  const today=new Date(); today.setHours(0,0,0,0); const tKey=dkey(today);
  const start=new Date(today); start.setDate(start.getDate()-(CAL_WEEKS*7-1)); start.setDate(start.getDate()-start.getDay());
  const end=new Date(today); end.setDate(end.getDate()+(6-today.getDay()));
  const cells=[]; const cur=new Date(start);
  while(cur<=end){
    const k=dkey(cur); const cnt=dayCount(k);
    const lv=cnt===0?'':cnt<=2?' lv1':cnt<=4?' lv2':' lv3';
    const cls='cal-cell'+(cur>today?' future':'')+(cnt>0?' on'+lv:'')+(k===tKey?' today':'');
    cells.push(`<div class="${cls}" title="${k}${cnt?'：'+cnt+'資産':''}"></div>`);
    cur.setDate(cur.getDate()+1);
  }
  document.getElementById('cal-grid').innerHTML=cells.join('');
}
// 達成演出（紙吹雪）
function celebrate(){
  let layer=document.getElementById('confetti-layer');
  if(!layer){ layer=document.createElement('div'); layer.id='confetti-layer'; document.body.appendChild(layer); }
  const E=['🎉','✨','🔥','⭐','💫','🟢'];
  const cx=window.innerWidth/2, cy=window.innerHeight*0.68;
  for(let i=0;i<28;i++){
    const s=document.createElement('span'); s.className='confetti'; s.textContent=E[i%E.length];
    const ang=Math.random()*Math.PI*2, dist=70+Math.random()*190;
    s.style.left=cx+'px'; s.style.top=cy+'px';
    s.style.setProperty('--dx',(Math.cos(ang)*dist).toFixed(0)+'px');
    s.style.setProperty('--dy',(Math.sin(ang)*dist-130).toFixed(0)+'px');
    s.style.setProperty('--rot',(Math.random()*720-360).toFixed(0)+'deg');
    s.style.setProperty('--dur',(0.9+Math.random()*0.6).toFixed(2)+'s');
    s.style.fontSize=(14+Math.random()*14).toFixed(0)+'px';
    layer.appendChild(s);
    setTimeout(()=>s.remove(),1700);
  }
}

// ══════════════════════════════════════════
//  生活リズム記録（起床・服薬・就寝の1タップ）
//  2026-07-24 実装：表示順は就寝→起床→服薬。既存の二値タップ操作は変えずに、
//  タップした瞬間の時刻だけ裏で自動記録するハイブリッド方式。
//  服薬の「決まった時刻にプッシュ通知でYes/Noを聞く」方式は、通知を本当に
//  端末へ届ける仕組みがこの環境で確認できず、実装コストに見合わないため見送り。
// ══════════════════════════════════════════
const LIFELOG_ITEMS = [
  {key:'sleep', icon:'🌙', label:'就寝'},
  {key:'wake',  icon:'☀️', label:'起床'},
  {key:'meds',  icon:'💊', label:'服薬'},
];
// 今日の記録（読み取り専用・存在しなければ空オブジェクト）
function lifeLogToday(){ return (DATA.lifeLog && DATA.lifeLog[dkey()]) || {}; }
// タップ＝記録／もう一度タップ＝取り消し（取り消すと時刻も消える）
function toggleLifeLog(key){
  if(!DATA.lifeLog) DATA.lifeLog={};
  const k=dkey();
  const rec = DATA.lifeLog[k] ? {...DATA.lifeLog[k]} : {};
  if(rec[key]){
    delete rec[key];
  }else{
    const t=new Date();
    rec[key]=String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
  }
  if(Object.keys(rec).length) DATA.lifeLog[k]=rec; else delete DATA.lifeLog[k];
  saveData(); renderLifeLog(); renderBrief();
}
// 直近7日でその項目を記録した日数
function lifeLogStreak(key){
  let days=0; const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<7;i++){ const rec=(DATA.lifeLog||{})[dkey(d)]; if(rec && rec[key]) days++; d.setDate(d.getDate()-1); }
  return days;
}
// ── 服薬のお知らせの時刻（2026-08-01）─────────────────────────
// のむ時刻は人によって違う。プログラムに書かず、使う人が選んでこの端末の中に持たせる。
// 決めていないあいだは、お知らせを出さない（見当違いの催促をしないため）。
function medsTime(){ return (DATA.settings && typeof DATA.settings.medsTime==='string') ? DATA.settings.medsTime : ''; }
function setMedsTime(v){
  if(!DATA.settings || typeof DATA.settings!=='object') DATA.settings={};
  DATA.settings.medsTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(v||'') ? v : '';
  saveData(); renderLifeLog();
}
function clearMedsTime(){ setMedsTime(''); }
function nowHHMM(){ const t=new Date(); return String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'); }

function renderLifeLog(){
  const el=document.getElementById('lifelog-grid');
  if(!el) return;
  const today=lifeLogToday();
  const mt=medsTime();
  const now=nowHHMM();
  el.innerHTML=LIFELOG_ITEMS.map(it=>{
    const on=!!today[it.key];
    const days=lifeLogStreak(it.key);
    // 服薬は、自分で決めた時刻をすぎてもまだ押していないときだけ、やわらかい目印を出す。
    // （本物の通知ではない。アプリを開いたときだけ効く）
    const due=(it.key==='meds' && !on && mt && now>=mt);
    return `<button class="lifelog-card ${on?'on':''} ${due?'due':''}" onclick="toggleLifeLog('${it.key}')">
      <div class="lifelog-icon">${it.icon}</div>
      <div class="lifelog-label">${it.label}</div>
      <div class="lifelog-time">${on?today[it.key]:(due?'そろそろ':'未記録')}</div>
      <div class="lifelog-days">直近7日 ${days}/7</div>
    </button>`;
  }).join('');

  const row=document.getElementById('meds-remind');
  if(row){
    row.innerHTML = mt
      ? `<div class="meds-line">
           <span class="meds-label">💊 おくすりの時間</span>
           <input type="time" class="meds-input" value="${esc(mt)}" onchange="setMedsTime(this.value)" aria-label="おくすりの時間">
           <button class="meds-clear" onclick="clearMedsTime()">やめる</button>
         </div>
         <div class="meds-note">${esc(mt)}をすぎても💊を押していないときだけ、「そろそろ」と出ます。この時刻はこの端末の中だけに保存されます。</div>`
      : `<div class="meds-line">
           <span class="meds-label">💊 おくすりの時間</span>
           <input type="time" class="meds-input" value="" onchange="setMedsTime(this.value)" aria-label="おくすりの時間">
           <span class="meds-off">まだ決めていません</span>
         </div>
         <div class="meds-note">のむ時間を決めると、その時間をすぎたときだけ「そろそろ」と出ます。決めなくても、💊を押して記録することはできます。</div>`;
  }
}

// ══════════════════════════════════════════
//  ヘルスケア連携（体重・歩数・ランニング、2026-09-25 追加）
//  iPhoneの「ショートカット」アプリから、ヘルスケアの数値をURLの#（フラグメント）に
//  のせて渡してもらい、ここで受け取ってlocalStorageに保存する。
//  クエリ文字列（?）は使わない。?の中身はサーバー（GitHub Pages）に送られてしまうため、
//  「個人データはlocalStorageのみ」の原則を守れない。#の中身はブラウザの中だけで
//  完結し、サーバーには一切送られない（ネットワークの通信にも乗らない）ため、こちらを使う。
//  受け取り後は成功・失敗にかかわらず history.replaceState でURLから消す。
//  （残したままだと、再読み込みや共有のたびに同じ数値が入り直してしまう）
// ══════════════════════════════════════════
function isHealthDateStr(s){
  if(typeof s!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  if(isNaN(Date.parse(s+'T00:00:00'))) return false;
  const y=parseInt(s.slice(0,4),10);
  return y>=2020 && y<=(new Date().getFullYear()+1);
}
function applyHealthFragment(){
  if(!location.hash || location.hash.length<2) return;
  let p;
  try{ p=new URLSearchParams(location.hash.slice(1)); }catch(e){ return; }
  if(!DATA.health || typeof DATA.health!=='object') DATA.health={weight:{},steps:{},runs:{}};
  let changed=false;

  // 体重（kg・日付つき）／hkwd=日付 / hkw=キログラム
  const wd=p.get('hkwd'), wv=p.get('hkw');
  if(isHealthDateStr(wd) && wv!=null){
    const w=parseFloat(wv);
    if(isFinite(w) && w>=30 && w<=250){ DATA.health.weight[wd]=Math.round(w*10)/10; changed=true; }
  }

  // 前日の歩数 ／hksd=日付 / hks=歩数
  const sd=p.get('hksd'), sv=p.get('hks');
  if(isHealthDateStr(sd) && sv!=null){
    const s=parseInt(sv,10);
    if(Number.isInteger(s) && String(s)===String(sv).trim() && s>=0 && s<=100000){ DATA.health.steps[sd]=s; changed=true; }
  }

  // 直近のランニング ／hkrd=日付 / hkrk=距離km / hkrh=平均心拍（無くてもよい）
  const rd=p.get('hkrd'), rk=p.get('hkrk'), rh=p.get('hkrh');
  if(isHealthDateStr(rd) && rk!=null){
    const km=parseFloat(rk);
    const hr=(rh!=null) ? parseInt(rh,10) : null;
    const kmOk = isFinite(km) && km>0 && km<=200;
    const hrOk = (rh==null) || (Number.isInteger(hr) && hr>=30 && hr<=230);
    if(kmOk && hrOk){
      const rec={km:Math.round(km*100)/100};
      if(hr!=null) rec.hr=hr;
      DATA.health.runs[rd]=rec;
      changed=true;
    }
  }

  if(changed) saveData();
  history.replaceState(null, '', location.pathname + location.search);
}
// 日付をキーにしたオブジェクトから、いちばん新しい日付のキーを返す（無ければnull）
function latestHealthKey(obj){
  const keys=Object.keys(obj||{}).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  return keys.length ? keys[keys.length-1] : null;
}
function renderHealthPanel(){
  const el=document.getElementById('health-panel');
  if(!el) return;
  const h=DATA.health||{};
  const weight=h.weight||{}, steps=h.steps||{}, runs=h.runs||{};

  const wKey=latestHealthKey(weight);
  let weightHtml;
  if(wKey){
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-30);
    const cutoffKey=dkey(cutoff);
    const recent=Object.keys(weight).filter(d=>d>=cutoffKey && d<=wKey).map(d=>weight[d]);
    let rangeText='30日分の記録はまだ足りません';
    if(recent.length>1){
      const lo=Math.min(...recent).toFixed(1), hi=Math.max(...recent).toFixed(1);
      rangeText = (lo===hi) ? `30日間 ${lo}kgのまま` : `30日の範囲　${lo}〜${hi}kg（${recent.length}日分）`;
    }
    weightHtml=`<div class="health-row"><span class="health-label">⚖️ 体重</span><span class="health-value">${weight[wKey].toFixed(1)}kg（${esc(wKey)}）</span></div><div class="health-sub">${rangeText}</div>`;
  }else{
    weightHtml=`<div class="health-row"><span class="health-label">⚖️ 体重</span><span class="health-value">まだ記録がありません</span></div>`;
  }

  const sKey=latestHealthKey(steps);
  let stepsHtml;
  if(sKey){
    const v=steps[sKey];
    const ranThatDay=!!runs[sKey];
    const label = ranThatDay ? '👟 歩数（走った日）' : '👟 走らない日の歩数';
    const diff=v-8000;
    const diffText = diff>=0 ? `目安8,000歩より${diff.toLocaleString()}歩多い` : `目安8,000歩まで${(-diff).toLocaleString()}歩`;
    stepsHtml=`<div class="health-row"><span class="health-label">${label}</span><span class="health-value">${v.toLocaleString()}歩（${esc(sKey)}）</span></div><div class="health-sub">${diffText}</div>`;
  }else{
    stepsHtml=`<div class="health-row"><span class="health-label">👟 走らない日の歩数</span><span class="health-value">まだ記録がありません</span></div>`;
  }

  el.innerHTML = weightHtml + stepsHtml;
}

// ── ヘルスケアの「貼り付けで取り込む」（2026-09-29 作り直し）─────────────
// COO検品で判明：iPhoneでは「ホーム画面に追加したWebアプリ」と「Safari」は
// 保存場所（localStorage）が別々（WebKitの仕様。bugs.webkit.org #181849でAppleが
// 「意図した仕様」と回答している）。ショートカットの「URLを開く」はSafari側で開くため、
// #（フラグメント）経由の値は、社長がふだん使うホーム画面のアプリには届かない。
// そこでショートカット側はURLを開かず、決まった形の文字（先頭が"LOHK1"）をクリップボードに
// コピーするだけにしてもらい、Life Orbit側（今使っているホーム画面のアプリ）で
// 「貼り付けて取り込む」ボタンを押して受け取る形にした。
//
// 文字の形（ショートカットが組み立てる）：
//   1行目 … "LOHK1"（この文字で始まっていないものは読み取らない）
//   見出し行 "WD"/"WV" … 体重の日付の並び／体重の値(kg)の並び（同じ順番で1行1件）
//   見出し行 "SD"/"SV" … 歩数の日付の並び／歩数（日ごとの合計）の並び
//   見出し行 "RD"/"RK"/"RH" … 直近のランニングの日付／距離km／平均心拍（RHは無くてもよい）
// 日付・数値の検査（範囲チェック）は#経由の受け取り（applyHealthFragment）と同じ基準。
// 形が崩れている行・範囲外の値は、その1行だけを静かに捨てる。
function importHealthText(text){
  const lines = String(text||'').split(/\r\n|\r|\n/).map(l=>l.trim());
  let i=0;
  while(i<lines.length && lines[i]==='') i++;
  if(lines[i]!=='LOHK1') return {count:0, weight:0, steps:0, run:false, badFormat:true};
  i++;
  const HEADERS=['WD','WV','SD','SV','RD','RK','RH'];
  const sec={WD:[],WV:[],SD:[],SV:[],RD:[],RK:[],RH:[]};
  let cur=null;
  for(; i<lines.length; i++){
    const l=lines[i];
    if(l==='') continue;
    if(HEADERS.indexOf(l)>=0){ cur=l; continue; }
    if(cur) sec[cur].push(l);
  }
  if(!DATA.health || typeof DATA.health!=='object') DATA.health={weight:{},steps:{},runs:{}};

  let wCount=0;
  const n1=Math.min(sec.WD.length, sec.WV.length);
  for(let k=0;k<n1;k++){
    const d=sec.WD[k], v=parseFloat(sec.WV[k]);
    if(isHealthDateStr(d) && isFinite(v) && v>=30 && v<=250){ DATA.health.weight[d]=Math.round(v*10)/10; wCount++; }
  }

  let sCount=0;
  const n2=Math.min(sec.SD.length, sec.SV.length);
  for(let k=0;k<n2;k++){
    // ショートカットは「9,876」「9876 歩」「9876.0」のように単位や区切りつきで出すことがあるので、数字と小数点だけ残して読む
    const d=sec.SD[k], sv=String(sec.SV[k]).replace(/[,\s]/g,'').replace(/(歩|count|steps)$/i,'');
    const s=/^\d+(\.\d+)?$/.test(sv) ? Math.round(parseFloat(sv)) : NaN;
    if(isHealthDateStr(d) && Number.isInteger(s) && s>=0 && s<=100000){ DATA.health.steps[d]=s; sCount++; }
  }

  let hasRun=false;
  if(sec.RD.length && sec.RK.length){
    const d=sec.RD[0], km=parseFloat(sec.RK[0]);
    const rh=sec.RH.length ? parseInt(sec.RH[0],10) : null;
    const kmOk=isFinite(km) && km>0 && km<=200;
    const hrOk=(rh==null) || (Number.isInteger(rh) && rh>=30 && rh<=230);
    if(isHealthDateStr(d) && kmOk && hrOk){
      const rec={km:Math.round(km*100)/100};
      if(rh!=null) rec.hr=rh;
      DATA.health.runs[d]=rec;
      hasRun=true;
    }
  }

  const count=wCount+sCount+(hasRun?1:0);
  if(count>0){ saveData(); renderHealthPanel(); }
  return {count, weight:wCount, steps:sCount, run:hasRun, badFormat:false};
}
function reportHealthImport(result){
  if(result.badFormat){ alert('この内容は読み取れませんでした。ショートカットでコピーした文字を、そのまま貼り付けてください。'); return; }
  if(result.count>0){
    const parts=[];
    if(result.weight) parts.push(`体重${result.weight}件`);
    if(result.steps) parts.push(`歩数${result.steps}件`);
    if(result.run) parts.push('ランニング1件');
    alert(`取り込みました（${parts.join('・')}）`);
  }else{
    alert('取り込める値が見つかりませんでした。ショートカットの内容をもう一度確認してください。');
  }
}
function showHealthPasteBox(){
  const box=document.getElementById('health-paste-box');
  if(box) box.style.display='block';
}
function hideHealthPasteBox(){
  const box=document.getElementById('health-paste-box');
  if(box) box.style.display='none';
  const ta=document.getElementById('health-paste-input');
  if(ta) ta.value='';
}
// まず自動で読もうとする（iPhoneでは「ペースト」の吹き出しをタップする形になる見込み）。
// 対応していない・許可されない場合は、貼り付け用の入力欄を出す。
async function importHealthFromClipboard(){
  if(navigator.clipboard && navigator.clipboard.readText){
    try{
      const text = await navigator.clipboard.readText();
      if(text && text.trim()){
        reportHealthImport(importHealthText(text));
        return;
      }
    }catch(e){ /* 読めなかった → 下の貼り付け欄で受け取る */ }
  }
  showHealthPasteBox();
}
function importHealthFromTextarea(){
  const ta=document.getElementById('health-paste-input');
  const result=importHealthText(ta ? ta.value : '');
  reportHealthImport(result);
  if(result.count>0) hideHealthPasteBox();
}

// ══════════════════════════════════════════
//  今日のブリーフ（2026-07-24 追加・無料簡易版）
//  使うデータは①localStorage内の本人のタップ記録 ②data/report.json（既存の公開ニュース）のみ。
//  会社の内部記録は一切参照しない（公開アプリのため）
// ══════════════════════════════════════════
function pickBriefNews(){
  const valid=(DATA.summaries||[]).filter(s=>{
    const it=s.items && s.items[0];
    const t=typeof it==='object'?(it&&it.text):it;
    return t && !String(t).includes('取得中');
  });
  if(!valid.length) return null;
  const dayIdx=Math.floor(Date.now()/86400000); // 日替わりで違うカテゴリを見せる
  return valid[dayIdx % valid.length];
}
function renderBrief(){
  const el=document.getElementById('brief-card');
  if(!el) return;
  // 2026-11-03 社長決定：連続日数（🔥N日連続）と「まだ：○件」の催促は画面に出さない。ブリーフに残るのはニュース1行。記録データは消していない
  let newsHtml='';
  const src=pickBriefNews();
  if(src){
    const it=src.items[0];
    const text=typeof it==='object'?it.text:it;
    newsHtml=`<div class="brief-row brief-news">📰 ${esc(src.icon)} ${esc(text)}</div>`;
  }

  el.innerHTML=newsHtml;
  // 出すものが無いとき（ニュースがまだ届いていない）は、空の枠だけが残らないよう、見出しごと隠す
  if(el.parentElement) el.parentElement.style.display=newsHtml?'':'none';
}

// ══════════════════════════════════════════
//  PULL TO REFRESH
// ══════════════════════════════════════════
let ptStartY = 0;
let ptTriggered = false;
const ptrWrap = document.getElementById('ptr-wrap');
const ptrLabel = document.getElementById('ptr-label');
const ptrIcon = document.getElementById('ptr-icon');
// 引っ張っている間は静止したマーク（記号として）、離して更新が始まったら回す
if(ptrIcon) ptrIcon.innerHTML = markSpinnerSVG(false);

document.addEventListener('touchstart', e => {
  if(window.scrollY === 0) ptStartY = e.touches[0].clientY;
  ptTriggered = false;
}, {passive: true});

document.addEventListener('touchmove', e => {
  if(!ptStartY) return;
  const dy = e.touches[0].clientY - ptStartY;
  if(dy > 0){
    const pull = Math.min(dy, 100);
    ptrWrap.style.top = `${pull - 56}px`;
    if(dy > 72){
      ptTriggered = true;
      ptrLabel.textContent = '離して更新';
    } else {
      ptTriggered = false;
      ptrLabel.textContent = '引っ張って更新';
    }
  }
}, {passive: true});

document.addEventListener('touchend', () => {
  if(ptTriggered){
    ptrWrap.style.top = '0';
    ptrLabel.textContent = '更新中...';
    const icon = document.querySelector('#ptr-icon .mark-spinner');
    if(icon) icon.classList.add('lo-loader'); // 読み込み中＝点が順に光る（回転はしない）
    setTimeout(()=>{
      DATA = loadData();
      renderAll();
      ptrWrap.style.top = '-56px';
      ptrLabel.textContent = '引っ張って更新';
      if(icon) icon.classList.remove('lo-loader');
    }, 600);
  } else {
    ptrWrap.style.top = '-56px';
  }
  ptStartY = 0;
  ptTriggered = false;
});

// ══════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════
function renderDate(){
  const d=new Date(), days=['日','月','火','水','木','金','土'];
  document.getElementById('today-date').textContent=
    `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function renderWave(){
  const b=document.getElementById('wave-badge');
  b.textContent=DATA.wave.label;
  b.className='wave-badge editable '+(DATA.wave.status==='stable'?'wave-stable':DATA.wave.status==='caution'?'wave-caution':'wave-alert');
}

// 今日のタスクは「その日のもの」。チェックした日が今日かどうかで見る。
function taskDoneTodayFlag(t){ return !!(t && t.doneDate===dkey()); }
function renderTasks(){
  const el=document.getElementById('task-list');
  if(!DATA.tasks.length){el.innerHTML='<div class="task-empty">タスクがありません。右下の ✏️編集 を押すと追加できます</div>';return;}
  el.innerHTML=DATA.tasks.map((t,i)=>{
    const done=taskDoneTodayFlag(t);
    return `<div class="task-item">
      <div class="task-check ${done?'done':''}" onclick="toggleTask(${i})"></div>
      <div class="task-text ${done?'done':''} editable" onclick="editTask(${i})">${esc(t.text)}</div>
      <button class="task-del" onclick="deleteTask(${i})">×</button>
    </div>`;
  }).join('');
}

function renderAssets(){
  document.getElementById('assets-grid').innerHTML=DATA.assets.map((a,i)=>{
    const on=functionedToday(a.id);
    return `<div class="asset-card ${on?'on-today':''}">
      <button class="asset-del" onclick="event.stopPropagation();deleteAsset(${i})">×</button>
      <div class="asset-top" onclick="assetClick(${i})">
        <span class="asset-icon editable">${esc(a.icon)}</span>
        <div class="asset-name editable">${esc(a.name)}</div>
      </div>
      <button class="today-toggle ${on?'on':''}" data-id="${esc(a.id)}" onclick="event.stopPropagation();toggleAssetToday(this.dataset.id)">${on?'✓ 今日やった':'今日やった？'}</button>
    </div>`;
  }).join('');
}

function assetClick(i){
  if(editMode){ editAsset(i); return; }
  showField(i);        // その資産の9マスの画面を開く
}

function renderSummaries(){
  document.getElementById('summary-list').innerHTML=DATA.summaries.map((s,i)=>{
    const first=s.items[0];
    const firstText=typeof first==='object'?first.text:(first||'');
    // 見出しに「"」や「'」が入っていても壊れないよう、文字を埋め込まず番号で受け渡す
    const itemsHtml=s.items.map((it,j)=>{
      const text=typeof it==='object'?it.text:it;
      const desc=typeof it==='object'?(it.desc||''):'';
      const url=typeof it==='object'?(it.url||''):'';
      const hasDetail=desc||url;
      return hasDetail
        ?`<div class="summary-item tappable" onclick="openNewsItem(${i},${j})"><span>${esc(text)}</span><span class="item-arrow">›</span></div>`
        :`<div class="summary-item">${esc(text)}</div>`;
    }).join('');
    return `
    <div class="summary-card">
      <div class="summary-header" onclick="toggleSummary(${i})">
        <div class="summary-left">
          <div class="summary-icon-wrap">${esc(s.icon)}</div>
          <div class="summary-text-wrap">
            <div class="summary-title">${esc(s.title)}</div>
            <div class="summary-preview">${esc(firstText)}</div>
          </div>
        </div>
        <div class="summary-ctrl">
          <div class="summary-count">${s.items.length}</div>
          <div class="summary-arrow" id="sarr-${i}">▼</div>
        </div>
      </div>
      <div class="summary-body" id="sbody-${i}">
        ${itemsHtml}
        <div class="summary-source">出典：${esc(s.source)}</div>
      </div>
    </div>`;
  }).join('');
}
function toggleSummary(i){
  document.getElementById(`sbody-${i}`).classList.toggle('open');
  document.getElementById(`sarr-${i}`).classList.toggle('open');
}
function decodeHtml(s){
  const t=document.createElement('textarea');
  t.innerHTML=s; return t.value;
}
// ニュース一覧から1件開く（何番目のカードの何番目か、で受け渡す）
function openNewsItem(si,ii){
  const s=(DATA.summaries||[])[si];
  if(!s || !s.items) return;
  const it=s.items[ii];
  if(!it) return;
  const text=typeof it==='object'?(it.text||''):String(it);
  const desc=typeof it==='object'?(it.desc||''):'';
  const url=typeof it==='object'?(it.url||''):'';
  openNewsPopup(text,desc,url,s.source||'');
}
function openNewsPopup(text,desc,url,source){
  document.getElementById('popup-source').textContent=source||'';
  document.getElementById('popup-title').textContent=text;
  const clean=decodeHtml(desc||'').trim();
  const isSameAsTitle=clean.startsWith(text.slice(0,30));
  document.getElementById('popup-desc').textContent=(!clean||isSameAsTitle)?'':clean;
  const link=document.getElementById('popup-link');
  // 2026-08-09 セキュリティ部署の指摘：受け取ったURLを開く前に、
  // http:// か https:// で始まっているかをもう一度確認する（二重の備え）。
  // 今のニュースデータは全件正常だが、取得元（Google News等）が将来
  // 変な形式のリンクを返しても、そのまま画面に反映しないようにする。
  if(url && /^https?:\/\//i.test(String(url).trim())){link.href=url;link.style.display='block';}
  else{link.style.display='none';}
  document.getElementById('news-popup-overlay').classList.add('open');
}
function closeNewsPopup(e){
  if(e&&e.target!==document.getElementById('news-popup-overlay')) return;
  document.getElementById('news-popup-overlay').classList.remove('open');
}

// ── 9マス（3段の曼陀羅）─────────────────────────────────
//  2026-11-02 試作の動きを本体に入れた
//  正本の試作：08_テックMGR/試作_20261031_直感版.html（社長「とりあえず一旦それでいこう」）
//
//  3つの画面（mView）：
//    0 = 全体（真ん中＝わたし、まわり＝資産）
//    1 = 資産（真ん中＝コアゴール、まわり＝8つのサブゴール。押すと中が開く）
//    2 = サブゴール（真ん中＝サブゴール、まわり＝8つのタスク。押すと今日の分が記録される）
//
//  記録の持ち方は前の版のまま（DATA.mandala と DATA.taskDone）。
//  だから、前の版までに押した記録も、そのまま四角・回数・カレンダーに積み上がる。
//  ここで新しく保存する項目は無い（どの画面にいたかは、保存せず記録から求める）。
//
//  「後で戻せる」ための目印：前の版の本体は、コミット 00685cc の
//  index.html / app.js / style.css / sw.js。
// ─────────────────────────────────────────────────────────
const NS = 8, NT = 8;                          // サブゴールの数・タスクの数（どの盤も、真ん中を除く8マス）
const POS = [0,1,2,3,5,6,7,8];                 // まわりの8マスが並ぶ場所（真ん中=4をとばす）
const TAG_CORE = 'コアゴール', TAG_SUB = 'サブゴール';   // 真ん中のマスの上に出す小さな名前（社長決定 11/2：画面に出す）
const DOT_MAX = 10, TINT_MAX = 30;

// 資産の色（面は --asset-*、文字や細い線は --ink-*。どちらもデザイン班のトークン）
const ASSET_VARS = {
  finance:['--asset-finance','--ink-finance'], health:['--asset-health','--ink-health'],
  intel:['--asset-cognition','--ink-cognition'], life:['--asset-living','--ink-living'],
  relation:['--asset-relationships','--ink-relationships'], career:['--asset-work','--ink-work'],
  system:['--asset-systems','--ink-systems']
};
// 自分で足した資産は、決まった色が無いので、リンクの色（トークン）で出す
function colorVars(m){
  const v = m && ASSET_VARS[m.id];
  return v ? `--c:var(${v[0]});--ink:var(${v[1]});` : '--c:var(--link);--ink:var(--link);';
}

// ── 文字の扱い ──
// 前の版の見本は、サブゴール名に「\n」で区切りが入っていた。画面では折り返してよい場所として扱う。
function plainT(t){ return String(t==null?'':t).replace(/\n/g,''); }
function brkT(t){
  t = String(t==null?'':t);
  const h = SAMPLE_HINTS[plainT(t)];            // 見本のままの文字は、決めてある位置で折り返す
  if(h) return h.split('|').map(esc).join('<wbr>');
  return t.split('\n').map(esc).join('<wbr>');  // 自分で書いた文字は、書いたまま
}
function hasText(t){ return !!(t && String(t).trim()); }
function sgOf(m,s){ return (m && m.subGoals && m.subGoals[s]) || {text:'', subSubGoals:[]}; }
function taskText(m,s,t){ const sg = sgOf(m,s); return (sg.subSubGoals && sg.subSubGoals[t]) || ''; }

// ── 今の状態（描くたびに、記録から数え直す）──
let mView = 0;           // どの画面か（0=全体 1=資産 2=サブゴール）
let mAnim = '', mFx = null, mNote = false;
let MI = null;           // 記録の集計
function buildIndex(){
  const today = dkey();
  const td = DATA.taskDone || {}, ck = DATA.checkins || {}, au = DATA.autoCheckins || {};
  const ids = Object.create(null);
  (DATA.mandala||[]).forEach(m=>{ if(m && m.id!=null) ids[m.id] = 1; });
  const I = { cell:Object.create(null), sub:Object.create(null), field:Object.create(null), all:0,
              todaySet:Object.create(null), subToday:Object.create(null), fieldToday:Object.create(null), allToday:0,
              dayTotal:Object.create(null), last:null };
  Object.keys(td).sort().forEach(day=>{
    const arr = Array.isArray(td[day]) ? td[day] : [];
    const seen = Object.create(null);
    let n = 0;
    arr.forEach(key=>{
      key = String(key);
      if(seen[key]) return;
      seen[key] = 1;
      const p = key.split('|');
      if(p.length!==3) return;
      const sg = Number(p[1]), ss = Number(p[2]);
      if(!Number.isInteger(sg) || !Number.isInteger(ss) || sg<0 || sg>=NS || ss<0 || ss>=NT) return;
      n++;                                        // カレンダーの日の数には、いま無い資産の記録も数える（記録は消さない）
      if(!ids[p[0]]) return;
      const sk = p[0]+'|'+sg;
      I.cell[key] = (I.cell[key]||0) + 1;
      I.sub[sk] = (I.sub[sk]||0) + 1;
      I.field[p[0]] = (I.field[p[0]]||0) + 1;
      I.all++;
      if(day===today){
        I.todaySet[key] = 1;
        I.subToday[sk] = (I.subToday[sk]||0) + 1;
        I.fieldToday[p[0]] = (I.fieldToday[p[0]]||0) + 1;
        I.allToday++;
      }
      I.last = {id:p[0], s:sg};                   // 日付の順に見ているので、最後に残るのが「いちばん新しく押した場所」
    });
    if(n) I.dayTotal[day] = n;
  });
  // 資産ボタン（ほかの記録）だけで押した日も、カレンダーでは「押した日」として数える（前の版までの記録を落とさないため）
  Object.keys(ck).forEach(day=>{
    const v = ck[day];
    let manual = 0;
    if(Array.isArray(v)){
      const a = Array.isArray(au[day]) ? au[day] : [];
      const tds = Array.isArray(td[day]) ? td[day] : [];
      v.forEach(id=>{
        if(a.indexOf(id)>=0) return;                                            // マスを押して自動でついた印は、二重に数えない
        if(tds.some(k=>String(k).indexOf(id+'|')===0)) return;                  // 同じ日に同じ資産のマスも押している
        manual++;
      });
    }else if(v===true){ manual = 1; }                                           // 古い形（true）の記録
    if(manual) I.dayTotal[day] = (I.dayTotal[day]||0) + manual;
  });
  return I;
}
// いちばん新しく押したサブゴール。次に開いたとき、そこから始める（毎日同じマスを押す人は1タップ）
function lastPlace(){
  if(!MI || !MI.last) return null;
  const f = (DATA.mandala||[]).findIndex(m=>m && m.id===MI.last.id);
  if(f<0) return null;
  if(!hasText(sgOf(DATA.mandala[f], MI.last.s).text)) return null;
  return {f:f, s:MI.last.s};
}
// 画面が指している場所が無くなっていたら（資産を消した・復元したとき）、近い場所に寄せる
function mClamp(){
  const n = (DATA.mandala||[]).length;
  if(!n){ mView = 0; currentMandala = 0; currentSubGoal = 0; return; }
  if(!(currentMandala>=0)) currentMandala = 0;
  if(currentMandala>=n) currentMandala = n-1;
  if(!(currentSubGoal>=0) || currentSubGoal>=NS) currentSubGoal = 0;
  if(mView<0 || mView>2) mView = 0;
}

// ── 小さな3×3：中にある8つの回数を、濃さで見せる ──
// sc=1：タスク（1〜2／3〜5／6〜10／11〜20／21〜の5段階）、sc=2：サブゴール（回数の合計なので、段階を2倍にのばす）
function lvl(n,sc){ return n<=0?0:(n<3*sc?1:(n<6*sc?2:(n<11*sc?3:(n<21*sc?4:5)))); }
function miniHtml(items,sc){
  const m = [];
  for(let a=0;a<8;a++){
    const it = items[a] || {n:0, td:false}, l = lvl(it.n,sc);
    m[POS[a]] = '<span class="mq'+(l>0?' m'+l:'')+(it.td?' td':'')+'"></span>';
  }
  m[4] = '<span class="mq mid"></span>';
  return '<span class="mini" aria-hidden="true">'+m.join('')+'</span>';
}
const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const LEFT_SVG  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const RIGHT_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
function gridIcon(){
  let s = '<svg class="gi" viewBox="0 0 20 20" aria-hidden="true">';
  for(let r=0;r<3;r++) for(let c=0;c<3;c++) s += '<rect class="'+(r===1&&c===1?'mid':'')+'" x="'+(c*7)+'" y="'+(r*7)+'" width="6" height="6" rx="1.6"/>';
  return s+'</svg>';
}

// ── はじめの1回だけ光るマス：記録が1つも無いとき、光るところを順に押していけば最初の記録になる ──
function mHintOn(){ return !editMode && !!MI && MI.all===0; }
function firstFilledSub(m){ for(let s=0;s<NS;s++) if(hasText(sgOf(m,s).text)) return s; return -1; }
function firstFilledTask(m,s){ for(let t=0;t<NT;t++) if(hasText(taskText(m,s,t))) return t; return -1; }

// 押すと中が開くマス（全体の画面の資産／資産の画面のサブゴール）
function openCellHtml(o){
  const tint = Math.round(Math.min(TINT_MAX, o.total*TINT_MAX/(10*o.tintK))*10)/10;
  return '<button type="button" class="cell'+(o.hint?' hint':'')+'" '+o.attr+' aria-label="'+esc(o.aria)+'" style="'+colorVars(o.m)+'--tint:'+tint+'%">'+
    '<span class="ct1">'+o.mini+(o.total>0?'<span class="cnt"><b>'+o.total+'</b>回</span>':'<span class="cnt"></span>')+'</span>'+
    '<span class="lb"><span>'+o.labelHtml+'</span></span>'+
    '<span class="ovt">'+(o.tdn>0?'今日 <b>'+o.tdn+'</b>マス':'')+'</span></button>';
}
// まだ書いていないマス：押すと書く画面が開く（押しても何も起きないマスは作らない）
function blankCellHtml(m,attr,aria){
  return '<button type="button" class="cell blank" '+attr+' style="'+colorVars(m)+'" aria-label="'+esc(aria)+'"><span class="blank-plus" aria-hidden="true">＋</span><span class="lb"><span>書く</span></span></button>';
}

// ── 画面2：サブゴールの9マス ──
function taskCellHtml(m,s,t){
  const txt = taskText(m,s,t);
  const sgName = plainT(sgOf(m,s).text);
  if(!hasText(txt)) return blankCellHtml(m,'data-t="'+t+'"', assetLabel(m)+'　'+sgName+'　まだ書いていないマス。押すと書けます');
  const key = taskKey(m.id,s,t), n = MI.cell[key]||0, done = !!MI.todaySet[key];
  const isFx = !!(mFx && mFx.k===key && mFx.on);
  const hint = mHintOn() && t===firstFilledTask(m,s) && !done;
  // 1〜10回：四角が1つずつ色づく／11〜20回：四角の中に点がついていく／21回〜：丸になっていく
  const lap = n>0 ? Math.floor((n-1)/DOT_MAX) : 0, inLap = n>0 ? n-DOT_MAX*lap : 0;
  const sty = l => l<=0 ? '' : (l===1 ? ' s1' : ' s2');
  let dots = '';
  for(let j=0;j<DOT_MAX;j++){
    const on = n>0 && (lap>0 || j<inLap), nw = isFx && n>0 && j===inLap-1;
    const st = on ? sty(j<inLap ? lap : lap-1) : '';
    dots += '<span class="dt'+(on?' on':'')+st+(nw?' new':'')+'"></span>';
  }
  let tint = (n<=DOT_MAX) ? n*TINT_MAX/DOT_MAX : TINT_MAX+Math.min(n-DOT_MAX,20)*0.5;
  tint = Math.round(tint*10)/10;
  const numHtml = n>0 ? '<span class="cnt"><b class="'+(isFx && n>DOT_MAX?'bump':'')+'">'+n+'</b>回</span>' : '<span class="cnt"></span>';
  const label = assetLabel(m)+'　'+sgName+'　'+plainT(txt)+'。'+(done?'今日は記録ずみ':'今日はまだ記録していません')+'。これまで'+n+'回';
  return '<button type="button" class="cell'+(done?' done':'')+(hint?' hint':'')+(isFx?' pop':'')+'" data-t="'+t+'" aria-pressed="'+done+'" aria-label="'+esc(label)+'" '+
    'style="'+colorVars(m)+'--tint:'+tint+'%">'+
    '<span class="ct1"><span class="ring">'+CHECK_SVG+'</span>'+numHtml+'</span>'+
    '<span class="lb"><span>'+brkT(txt)+'</span></span>'+
    '<span class="dots" aria-hidden="true">'+dots+'</span></button>';
}
function subCenterHtml(m,s){
  const name = sgOf(m,s).text, t = MI.subToday[m.id+'|'+s]||0, all = (t===NT);
  const editable = editMode || !hasText(name);
  const inner = '<span class="ctag">'+TAG_SUB+'</span>'+
    (hasText(name) ? '<span class="cn">'+brkT(name)+'</span>' : '<span class="cn ph">＋ 名前を書く</span>')+
    '<span class="cd">今日 <b>'+t+'</b>マス</span>';
  const aria = assetLabel(m)+'の'+TAG_SUB+'：'+(hasText(name)?plainT(name):'まだ書いていません')+'。今日 '+t+'マス';
  if(editable) return '<button type="button" class="center sub editable'+(all?' all':'')+'" data-edit="sub" style="'+colorVars(m)+'" aria-label="'+esc(aria)+'。押すと書きかえられます">'+inner+'</button>';
  return '<div class="center sub'+(all?' all':'')+'" style="'+colorVars(m)+'" role="group" aria-label="'+esc(aria)+'">'+inner+'</div>';
}
function subBoardHtml(m,s){
  const cells = [];
  for(let t=0;t<NT;t++) cells[POS[t]] = taskCellHtml(m,s,t);
  cells[4] = subCenterHtml(m,s);
  return cells.join('');
}

// ── 画面1：資産の9マス ──
function subOpCellHtml(m,s){
  const sg = sgOf(m,s);
  if(!hasText(sg.text)) return blankCellHtml(m,'data-s="'+s+'"', assetLabel(m)+'　'+(s+1)+'つ目の'+TAG_SUB+'。まだ書いていません。押すと書けます');
  const items = [];
  for(let t=0;t<NT;t++){ const k = taskKey(m.id,s,t); items.push({n:MI.cell[k]||0, td:!!MI.todaySet[k]}); }
  const sk = m.id+'|'+s, tot = MI.sub[sk]||0, tdn = MI.subToday[sk]||0;
  return openCellHtml({m:m, attr:'data-s="'+s+'"', labelHtml:brkT(sg.text), mini:miniHtml(items,1), total:tot, tdn:tdn, tintK:2,
    hint: mHintOn() && s===firstFilledSub(m),
    aria: assetLabel(m)+'の「'+plainT(sg.text)+'」をひらく。今日 '+tdn+'マス。これまで'+tot+'回'});
}
function coreCenterHtml(m){
  const t = MI.fieldToday[m.id]||0, goal = hasText(m.center) ? m.center : '';
  const lab = assetLabel(m);
  const editable = editMode || !goal;
  const inner = '<span class="ctag">'+TAG_CORE+'</span><span class="cn">'+esc(lab)+'</span>'+
    (goal ? '<span class="cg">'+brkT(goal)+'</span>' : '<span class="cg ph">＋ 目指すことを書く</span>')+
    '<span class="cd">今日 <b>'+t+'</b>マス</span>';
  const aria = lab+'の'+TAG_CORE+'：'+(goal?plainT(goal):'まだ書いていません')+'。今日 '+t+'マス';
  if(editable) return '<button type="button" class="center editable" data-edit="core" style="'+colorVars(m)+'" aria-label="'+esc(aria)+'。押すと書きかえられます">'+inner+'</button>';
  return '<div class="center" style="'+colorVars(m)+'" role="group" aria-label="'+esc(aria)+'">'+inner+'</div>';
}
function coreBoardHtml(m){
  const cells = [];
  for(let s=0;s<NS;s++) cells[POS[s]] = subOpCellHtml(m,s);
  cells[4] = coreCenterHtml(m);
  return cells.join('');
}

// ── 画面0：全体の9マス（真ん中＝わたし、まわり＝資産）──
function fieldOpCellHtml(m,f){
  const items = [];
  for(let s=0;s<NS;s++) items.push({n:MI.sub[m.id+'|'+s]||0, td:(MI.subToday[m.id+'|'+s]||0)>0});
  const tot = MI.field[m.id]||0, tdn = MI.fieldToday[m.id]||0;
  return openCellHtml({m:m, attr:'data-f="'+f+'"', labelHtml:'<span class="ic" aria-hidden="true">'+esc(m.icon||'')+'</span>'+esc(assetLabel(m)), mini:miniHtml(items,2), total:tot, tdn:tdn, tintK:4,
    hint: mHintOn() && f===0,
    aria: assetLabel(m)+'をひらく。今日 '+tdn+'マス。これまで'+tot+'回'});
}
function overviewCenterHtml(list){
  let dots = '';
  const cx = 50, cy = 50, r = 34, n = Math.max(1, list.length);
  list.forEach((m,i)=>{
    const ang = (-90+i*360/n)*Math.PI/180;
    const v = ASSET_VARS[m.id] ? 'var('+ASSET_VARS[m.id][0]+')' : 'var(--link)';
    dots += '<circle cx="'+(cx+r*Math.cos(ang)).toFixed(1)+'" cy="'+(cy+r*Math.sin(ang)).toFixed(1)+'" r="10" fill="'+v+'" class="'+((MI.fieldToday[m.id]||0)>0?'on':'off')+'"/>';
  });
  return '<div class="center me" role="group" aria-label="わたし。今日 '+MI.allToday+'マス。これまで'+MI.all+'回">'+
    '<svg class="orbit" viewBox="0 0 100 100" aria-hidden="true">'+dots+'</svg>'+
    '<span class="cn">わたし</span>'+
    '<span class="cd">今日 <b>'+MI.allToday+'</b>マス</span></div>';
}
function overviewBoardHtml(){
  const list = DATA.mandala.slice(0,8);              // 盤に置けるのは8つまで。それより多いときは、資産の画面の「となりへ」で見られる
  const cells = [];
  list.forEach((m,f)=>{ cells[f<4?f:f+1] = fieldOpCellHtml(m,f); });
  cells[4] = overviewCenterHtml(list);
  for(let i=0;i<9;i++) if(!cells[i]) cells[i] = '<div class="cell empty" aria-hidden="true"></div>';
  return cells.join('');
}

// ── 上の行・盤の下の1行・となりへ ──
// 全体 › 資産 › サブゴール。前の段は押すとその段へ戻る。いまの段は文字だけ。
// サブゴールの画面だけは2行にする：1行目＝全体 › 資産（押して戻る）、2行目＝サブゴールの名前（全文）。
// 資産の名前は「金融資産」など4文字で、1行に並べるとサブゴールの名前が「…」で欠けるため（320pxで確認）。
function locHtml(){
  const m = DATA.mandala[currentMandala];
  if(mView===0 || !m){
    return '<span class="crumb" aria-current="page"><span class="cname" style="color:var(--text-primary)">全体</span></span>'+
           (DATA.mandala.length ? '<span class="ovhint">押すと中が開きます</span>' : '');
  }
  const lab = assetLabel(m);
  let h = '<button type="button" class="up" data-go="0" aria-label="全体にもどる">'+gridIcon()+'<span>全体</span></button>'+
          '<span class="sep" aria-hidden="true">›</span>';
  if(mView===1){
    h += '<span class="crumb" style="--ink:var('+(ASSET_VARS[m.id]?ASSET_VARS[m.id][1]:'--link')+')" aria-current="page"><span class="cname"><span aria-hidden="true">'+esc(m.icon||'')+'</span> '+esc(lab)+'</span></span>';
  }else{
    const nmRaw = sgOf(m,currentSubGoal).text;
    h += '<button type="button" class="up" data-go="1" style="'+colorVars(m)+'" aria-label="'+esc(lab)+'にもどる"><span class="dotc" aria-hidden="true"></span><span>'+esc(lab)+'</span></button>'+
         '<span class="crumb s2" style="'+colorVars(m)+'" aria-current="page"><span class="sep" aria-hidden="true">›</span><span class="cname">'+(hasText(nmRaw)?brkT(nmRaw):'（まだ書いていない）')+'</span></span>';
  }
  return h;
}
function pagerHtml(){
  if(mView===0) return '';
  const nf = DATA.mandala.length;
  const n = (mView===1) ? nf : NS, i = (mView===1) ? currentMandala : currentSubGoal;
  if(n<2) return '';
  const md = (j) => ((j%n)+n)%n;
  const raw = (j) => (mView===1) ? assetLabel(DATA.mandala[md(j)]) : sgOf(DATA.mandala[currentMandala],md(j)).text;
  const plain = (j) => plainT(raw(j)) || '（まだ書いていない）';
  const html  = (j) => hasText(raw(j)) ? brkT(raw(j)) : '（まだ書いていない）';
  const pv = plain(i-1), nx = plain(i+1);
  const pa = (mView===1) ? '前の資産（'+pv+'）へ' : '前の「'+pv+'」へ', na = (mView===1) ? '次の資産（'+nx+'）へ' : '次の「'+nx+'」へ';
  return '<button type="button" class="pg" data-act="prev" aria-label="'+esc(pa)+'">'+LEFT_SVG+'<span>'+html(i-1)+'</span></button>'+
         '<button type="button" class="pg" data-act="next" aria-label="'+esc(na)+'"><span>'+html(i+1)+'</span>'+RIGHT_SVG+'</button>';
}
function capHtml(){
  const at = MI.all;
  if(!DATA.mandala.length){
    return '資産がありません。<br><span class="sub">ホームの「＋ 資産を追加」から作れます</span>';
  }
  const m = DATA.mandala[currentMandala], lab = assetLabel(m);
  if(mView===0){
    const more = DATA.mandala.length>8 ? '<br><span class="sub">ほかの資産は、資産の画面の「となりへ」で見られます</span>' : '';
    if(mHintOn()) return '<span aria-hidden="true">まず光っているところを押してみてください</span><span class="sr">まず「'+esc(assetLabel(DATA.mandala[0]))+'」を押してみてください</span>'+more;
    return (at>0?'全体で <b>'+at+'</b>回<br>':'')+'<span class="sub">小さな四角は、押すほど色が濃くなります<br>今日押したマスは、丸になります</span>'+more;
  }
  if(editMode){
    return mView===1
      ? '<span class="sub">書きかえ中です。直したいマスを押してください</span>'
      : '<span class="sub">書きかえ中です。直したいマスを押してください</span>';
  }
  if(mView===1){
    if(mHintOn()) return '<span aria-hidden="true">押すと中が開きます。まず光っているところから</span><span class="sr">押すと中が開きます。まず「'+esc(lab)+'　'+esc(plainT(sgOf(m,Math.max(0,firstFilledSub(m))).text))+'」から</span>';
    const ft = MI.field[m.id]||0;
    const head1 = (ft>0) ? esc(lab)+'は、これまで<b>'+ft+'</b>回' : esc(lab)+'は、まだこれから';
    const tail1 = (at>ft) ? '<span class="sub nw">　／　全体で'+at+'回</span>' : '';
    return head1+tail1+'<br><span class="sub">押すと中が開きます</span>';
  }
  const sname = plainT(sgOf(m,currentSubGoal).text);
  if(mHintOn()) return '<span aria-hidden="true">やったら、マスを押して記録します。まず光っているマスから</span><span class="sr">やったら、マスを押して記録します。まず「'+esc(lab)+'　'+esc(sname)+'　'+esc(plainT(taskText(m,currentSubGoal,Math.max(0,firstFilledTask(m,currentSubGoal)))))+'」のマスから</span>';
  const st = MI.sub[m.id+'|'+currentSubGoal]||0, sn = '「'+esc(sname)+'」';
  const head = (st>0) ? sn+'は、これまで<b>'+st+'</b>回' : sn+'は、まだこれから';
  const tail = (at>st) ? '<span class="sub nw">　／　全体で'+at+'回</span>' : '';
  const note = mNote ? '<br><span class="sub">押しまちがえたら、同じマスをもう一度押すと取り消せます</span>' : '';
  return head+tail+'<br><span class="sub">やったことを押して記録します</span>'+note;
}
// 盤の下の道具：まとめて入力（サブゴールの画面）と、書きかえの切りかえ。毎日押すマスから離して置く
function toolsHtml(){
  if(mView===0 || !DATA.mandala.length) return '';
  let h = '';
  if(mView===2) h += '<button type="button" class="mb-btn" onclick="openBulkInput()">まとめて入力</button>';
  h += '<button type="button" class="mb-btn'+(editMode?' on':'')+'" onclick="toggleEditMode()" aria-pressed="'+editMode+'">'+(editMode?'✅ 書きかえ完了':'✏️ 書きかえる')+'</button>';
  return h;
}

// ── 押した日のカレンダー（17週）：9マスの下。押した日に色がつき、あとから消えない ──
function renderRecCal(){
  const cal = document.getElementById('rec-cal'), mon = document.getElementById('rec-months'), sub = document.getElementById('rec-sub');
  if(!cal || !mon || !sub) return;
  const td = new Date(); td.setHours(0,0,0,0);
  const st = new Date(td.getTime()); st.setDate(st.getDate()-(CAL_WEEKS*7-1)); st.setDate(st.getDate()-st.getDay());
  const en = new Date(td.getTime()); en.setDate(en.getDate()+(6-td.getDay()));
  let cells = '', col = 0, nDays = 0, nMonth = 0;
  const cur = new Date(st.getTime()), marks = [];
  const tKey = dkey(td), mPre = tKey.slice(0,7);
  while(cur<=en){
    const k = dkey(cur), cnt = MI.dayTotal[k]||0;
    const cls = 'cc'+(cur>td?' fu':'')+(cnt>0?(cnt<=1?' l1':(cnt<=3?' l2':' l3')):'')+(k===tKey?' tdy':'');
    cells += '<div class="'+cls+'" title="'+(cur.getMonth()+1)+'月'+cur.getDate()+'日'+(cnt?'：'+cnt+'マス':'')+'"></div>';
    // 月の名前：その月の1日がある列の上に出す（先頭の列は、次の月の名前と近すぎなければ出す）
    if(cur.getDate()===1) marks.push([Math.floor(col/7), cur.getMonth()+1]);
    if(col===0) marks.unshift([0, cur.getMonth()+1]);
    col++;
    cur.setDate(cur.getDate()+1);
  }
  const nCols = Math.round(col/7);
  if(marks.length>1 && marks[0][0]===0 && marks[1][0]-marks[0][0]<3) marks.shift();
  if(marks.length>1 && marks[0][0]===0 && marks[1][0]===0) marks.shift();
  mon.style.gridTemplateColumns = 'repeat('+nCols+',minmax(0,1fr))';
  mon.innerHTML = marks.map(m=>'<span style="grid-column:'+(m[0]+1)+'">'+m[1]+'月</span>').join('');
  Object.keys(MI.dayTotal).forEach(k=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(k) || MI.dayTotal[k]<=0 || k>tKey) return;
    nDays++;
    if(k.slice(0,7)===mPre) nMonth++;
  });
  cal.style.gridTemplateColumns = 'repeat('+nCols+',minmax(0,1fr))';
  cal.innerHTML = cells;
  cal.setAttribute('aria-label','押した日のカレンダー。マスを押した日は色がつきます。'+(nDays>0?'今月は'+nMonth+'日、全部で'+nDays+'日':'まだこれからです'));
  sub.innerHTML = nDays>0 ? '今月 <b>'+nMonth+'</b>日 ／ 全部で <b>'+nDays+'</b>日' : 'まだこれから';
}

// ── 画面を描く ──
function renderBoard(focusT){
  const board = document.getElementById('board');
  if(!board) return;
  mClamp();
  MI = buildIndex();
  board.className = 'board'+(mAnim?' '+mAnim:'');
  const m = DATA.mandala[currentMandala];
  board.innerHTML = (mView===0 || !m) ? overviewBoardHtml() : (mView===1 ? coreBoardHtml(m) : subBoardHtml(m,currentSubGoal));
  const loc = document.getElementById('loc');
  loc.innerHTML = locHtml();
  loc.className = 'loc'+((mView===2 && m) ? ' two' : '');
  document.getElementById('cap').innerHTML = capHtml();
  document.getElementById('pager').innerHTML = pagerHtml();
  document.getElementById('tools').innerHTML = toolsHtml();
  renderSampleNotice(); renderGuideCard(); renderRecCal();
  if(mView===2 && focusT!==undefined && focusT!==null){
    const b = board.querySelector('[data-t="'+focusT+'"]');
    if(b){ mFocus(b); if(mFx && mFx.on) cellBurst(b); }
  }
  mFx = null; mAnim = '';
}
function mFocus(el){ if(!el) return; try{ el.focus({preventScroll:true}); }catch(e){ el.focus(); } }
// 同じ文が続けて出ても読み上げられるよう、いったん空にしてから入れる
function mSay(t){ const el = document.getElementById('live'); if(!el) return; el.textContent = ''; setTimeout(()=>{ el.textContent = t; },40); }
// 押した瞬間の小さな紙ふぶき
function cellBurst(btn){
  const n = 9;
  for(let i=0;i<n;i++){
    const p = document.createElement('span'); p.className = 'pt';
    const ang = (i/n)*Math.PI*2+Math.random()*0.5, dist = 30+Math.random()*30;
    p.style.setProperty('--dx',(Math.cos(ang)*dist).toFixed(1)+'px');
    p.style.setProperty('--dy',(Math.sin(ang)*dist).toFixed(1)+'px');
    btn.appendChild(p);
    setTimeout(()=>{ if(p.parentNode) p.parentNode.removeChild(p); },700);
  }
}

// ── 押す ──
// 押すとその日の記録（taskDone）に入る。もう一度押すと取り消し。前の版と同じ記録の形。
// 押した資産は、ほかの記録の「今日、機能した資産は？」にも自動で印がつく（前の版と同じ）。
function pressTask(t){
  const m = DATA.mandala[currentMandala];
  if(!m) return;
  if(!hasText(taskText(m,currentSubGoal,t))){ openTaskPicker(t); return; }
  if(!DATA.taskDone) DATA.taskDone = {};
  const firstEver = !!MI && MI.all===0;
  const k = dkey(), key = taskKey(m.id,currentSubGoal,t);
  const arr = Array.isArray(DATA.taskDone[k]) ? DATA.taskDone[k] : [];
  const i = arr.indexOf(key), adding = i<0;
  if(adding) arr.push(key); else arr.splice(i,1);
  if(arr.length) DATA.taskDone[k] = arr; else delete DATA.taskDone[k];
  if(adding) markAssetFunctioned(m.id); else unmarkAssetIfAuto(m.id);
  saveData();
  mFx = {k:key, on:adding};
  mNote = adding && firstEver;
  if(adding && !introGuideAcked()){ try{ localStorage.setItem('loGuideAck','1'); }catch(e){} }   // 押してみた人には、はじめにカードはもう要らない
  try{ if(adding && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(12); }catch(e){}
  renderBoard(t);
  // ほかの記録（継続のきろく・資産カード・ブリーフ）も一緒に更新する
  renderStreak(); renderAssets(); renderBrief();
  const nm = assetLabel(m)+'「'+plainT(taskText(m,currentSubGoal,t))+'」';
  mSay(adding ? nm+'を記録しました。これまで'+(MI.cell[key]||0)+'回。'+(mNote?'押しまちがえたら、同じマスをもう一度押すと取り消せます':'') : nm+'の今日の記録を取り消しました');
}

// ── 端末の「戻る」：「全体」→「資産」→「サブゴール」を、1回の「戻る」で1段ずつ上がる。全体から戻るとアプリの外へ ──
// 2026-11-03 作り直し（社長「全体に戻れない」）。前の作りは、画面のボタンが history.go(段の差) で履歴をたどっていた。
//   → ボタンを続けて2回押すと、2回目がアプリの外まで戻る／ホームの資産カードから開いたあとは1回目が何も起きない、の2つが起きた。
// 今の作り：履歴の中のアプリの持ち分は、いつも「土台（R）」と「いまの画面（T）」の最大2つだけ。
//   ・画面のボタン（全体・資産）は、履歴をたどらず、その段を直接描く。だから履歴がどんな状態でも、必ず戻れて、外へ出ない
//   ・端末の「戻る」は土台（R）に着く。そこで1段上げて、Tを積み直す。全体（0段）のとき土台に着いたら、もう1回戻ってアプリの外へ
let histOK = !!(window.history && history.pushState && history.replaceState);
function mState(){ return {lo:1, k:'t', v:mView, f:currentMandala, s:currentSubGoal}; }
function hKind(st){ if(!st || !st.lo) return null; return st.k || (st.v>0 ? 't' : 'r'); }   // k無し＝前の版の履歴：v=0は土台、それ以外はいまの画面
// 画面が変わったあとに呼ぶ。履歴の「いまの項目」を、見ている画面に合わせる（足すのは土台の上に1つだけ）
function histSync(){
  if(!histOK) return;
  try{
    const k = hKind(history.state);
    if(k==='t') history.replaceState(mState(),'');
    else if(mView>0) history.pushState(mState(),'');
  }catch(e){ histOK = false; }
}
function mActiveAct(){ const a = document.activeElement; return (a && a.getAttribute) ? a.getAttribute('data-act') : null; }
function mAfterDown(act){
  // 画面が入れかわっても、キーボードの位置を見失わない（となりへ→同じ矢印、下の段へ→直前の段のボタン）
  let el = null;
  if(act==='prev' || act==='next') el = document.querySelector('#pager [data-act="'+act+'"]');
  if(!el){ const gos = document.querySelectorAll('#loc [data-go]'); el = gos.length ? gos[gos.length-1] : null; }
  mFocus(el);
  const m = DATA.mandala[currentMandala];
  if(m) mSay(mView===1 ? assetLabel(m)+'を開きました' : assetLabel(m)+'の「'+plainT(sgOf(m,currentSubGoal).text)+'」を開きました');
}
function mAfterUp(){
  if(mView===0){ mFocus(document.querySelector('#board [data-f="'+currentMandala+'"]')); mSay('全体にもどりました'); }
  else{ mFocus(document.querySelector('#board [data-s="'+currentSubGoal+'"]')); mSay(assetLabel(DATA.mandala[currentMandala])+'にもどりました'); }
}
function openField(f){
  const n = DATA.mandala.length;
  if(!n) return;
  const act = mActiveAct();
  mView = 1; currentMandala = ((f%n)+n)%n; mAnim = 'zin'; mNote = false; renderBoard();
  histSync();
  mAfterDown(act);
}
function openSub(s){
  if(!DATA.mandala.length) return;
  const act = mActiveAct();
  mView = 2; currentSubGoal = ((s%NS)+NS)%NS; mAnim = 'zin'; mNote = false; renderBoard();
  histSync();
  mAfterDown(act);
}
// 前の段へ戻る（上の行の「全体」「資産」ボタン）。履歴はたどらず、その段を直接描く。
// すでにその段か、それより上にいるときは何もしない（続けて2回押されても、1回分だけ）
function goUp(target){
  if(!(target<mView)) return;
  mView = target; mAnim = 'zout'; mNote = false; renderBoard(); histSync(); mAfterUp();
}
window.addEventListener('popstate', e=>{
  if(!histOK) return;
  const st = e.state, k = st && st.lo ? hKind(st) : 'r';      // 状態の無い項目＝このページ自身の最初の項目＝土台
  mNote = false;
  const onMandala = document.getElementById('page-mandala').classList.contains('active');
  if(k==='r'){
    // 土台に着いた＝「戻る」が押された。1段上げる。全体のときは、もう1回戻ってアプリの外へ
    if(mView<=0){ try{ history.back(); }catch(err){} return; }
    mView = mView-1; mAnim = 'zout';
    if(!onMandala) switchPage('mandala'); else renderBoard();
    histSync(); mAfterUp();
    return;
  }
  // いまの画面の項目に着いた（進む操作・前の版の履歴・再読み込み前の状態）：項目の内容どおりに描く
  const nv = st.v|0, nf = st.f|0, ns = st.s|0;
  if(onMandala && nv===mView && nf===currentMandala && ns===currentSubGoal) return;
  const down = nv>mView;
  mView = nv; currentMandala = nf; currentSubGoal = ns; mAnim = down ? 'zin' : 'zout';
  mClamp();
  if(!onMandala) switchPage('mandala'); else renderBoard();
  if(down) mAfterDown(null); else mAfterUp();
});
// 開いたとき、どの画面から始めるか：いちばん新しく押したサブゴールの画面から（無ければ全体から）
function mInitView(){
  mView = 0; currentMandala = 0; currentSubGoal = 0;
  MI = buildIndex();
  let st = null;
  try{ st = history.state; }catch(e){}
  const k = hKind(st);
  if(histOK && k){                    // 再読み込み：履歴の途中にいるので、その場所のまま。履歴を足さない
    if(k==='t'){ mView = st.v|0; currentMandala = st.f|0; currentSubGoal = st.s|0; }
    mClamp();
    return;
  }
  const lp = lastPlace();
  if(lp){ currentMandala = lp.f; currentSubGoal = lp.s; mView = 2; }
  if(histOK){
    try{
      history.replaceState({lo:1,k:'r',v:0,f:0,s:0},'');     // 土台
      if(mView>0) history.pushState(mState(),'');            // いまの画面
    }catch(e){ histOK = false; }
  }
}
function sideStep(d){ if(mView===1) openField(currentMandala+d); else if(mView===2) openSub(currentSubGoal+d); }

// ── 操作の受け口 ──
(function(){
  const board = document.getElementById('board'), loc = document.getElementById('loc'), pager = document.getElementById('pager');
  if(!board || !loc || !pager) return;
  board.addEventListener('click', e=>{
    const el = e.target.closest ? e.target.closest('button') : null;
    if(!el) return;
    const ed = el.getAttribute('data-edit');
    if(ed==='core'){ editCoreGoal(); return; }
    if(ed==='sub'){ editSubGoal(currentSubGoal); return; }
    if(mView===0 && el.hasAttribute('data-f')){ openField(parseInt(el.getAttribute('data-f'),10)); return; }
    if(mView===1 && el.hasAttribute('data-s')){
      const s = parseInt(el.getAttribute('data-s'),10);
      // 書きかえ中と、まだ書いていないマスは、名前を決める画面。そうでなければ中を開く
      if(editMode || !hasText(sgOf(DATA.mandala[currentMandala],s).text)) editSubGoal(s); else openSub(s);
      return;
    }
    if(mView===2 && el.hasAttribute('data-t')){
      const t = parseInt(el.getAttribute('data-t'),10);
      if(editMode) openTaskPicker(t); else pressTask(t);
    }
  });
  loc.addEventListener('click', e=>{
    const el = e.target.closest ? e.target.closest('button') : null;
    if(!el || !el.hasAttribute('data-go')) return;
    goUp(parseInt(el.getAttribute('data-go'),10));
  });
  pager.addEventListener('click', e=>{
    const el = e.target.closest ? e.target.closest('button') : null;
    if(!el) return;
    const act = el.getAttribute('data-act');
    if(act==='prev') sideStep(-1); else if(act==='next') sideStep(1);
  });
  // 左右になぞると、となりへ（資産の画面＝となりの資産、サブゴールの画面＝となりのサブゴール）
  let sx = 0, sy = 0, on = false;
  board.addEventListener('touchstart', e=>{ if(e.touches.length!==1){ on = false; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true; }, {passive:true});
  board.addEventListener('touchend', e=>{
    if(!on || mView===0) return;
    on = false;
    const t = e.changedTouches[0], dx = t.clientX-sx, dy = t.clientY-sy;
    if(Math.abs(dx)>70 && Math.abs(dy)<45) sideStep(dx<0 ? 1 : -1);
  }, {passive:true});
})();

// ほかの記録の資産カードから、その資産の画面（9マス）を開く
function showField(i){
  currentMandala = i; mView = 1; mNote = false;
  switchPage('mandala');
  histSync();
}

// ══════════════════════════════════════════
//  見本の案内（見本が入っている人だけに、9マスの下に出る）
// ══════════════════════════════════════════
function renderSampleNotice(){
  const el = document.getElementById('sample-notice');
  if(!el) return;
  el.style.display = DATA.sampleMode ? 'block' : 'none';
}
// 「書きかえる」＝書きかえ中にして、マスを押せば文字を直せる状態にする
function startEditFromSample(){
  if(DATA.mandala.length && mView===0) openField(0);
  if(!editMode) toggleEditMode();
  const g = document.getElementById('board');
  if(g && g.scrollIntoView) g.scrollIntoView({behavior:'smooth',block:'center'});
}
// 「この見本を使う」＝中身はそのまま、案内だけ消す
function keepSample(){
  DATA.sampleMode = false; saveData(); renderSampleNotice();
}
// 「全部消す」＝9マスの文字だけ空にする（記録・継続のきろく・生活リズム・やった記録には手をつけない）
function clearSample(){
  if(!confirm('曼陀羅に入っている見本の文字を、全部消してまっさらにします。よろしいですか？')) return;
  DATA.mandala.forEach(m=>{
    m.center = '';
    (m.subGoals||[]).forEach(sg=>{ sg.text = ''; sg.subSubGoals = Array(8).fill(''); });
  });
  DATA.sampleMode = false;
  saveData();
  renderBoard();
}


// ══════════════════════════════════════════
//  曼陀羅タスクの「やった」記録（2026-07-27 追加・v8）
//  データの形は継続のきろく（checkins）と同じ日付ごとの配列。
//    DATA.taskDone = {"2026-07-27":["health|3|0", ...]}
//  中身は「資産id|サブゴール番号|タスク番号」。
//  押した日だけ増える。押さない日があっても何も減らない。
// ══════════════════════════════════════════
const TASK_RECENT_DAYS = 7;
function taskKey(assetId,sgIdx,ssIdx){ return assetId+'|'+sgIdx+'|'+ssIdx; }
function taskDoneOnDay(dayKey,key){ const v=(DATA.taskDone||{})[dayKey]; return Array.isArray(v)&&v.indexOf(key)>=0; }
function taskDoneToday(assetId,sgIdx,ssIdx){ return taskDoneOnDay(dkey(),taskKey(assetId,sgIdx,ssIdx)); }
// そのタスクを直近◯日で何回やったか
function taskDoneCount(assetId,sgIdx,ssIdx,span){
  const key=taskKey(assetId,sgIdx,ssIdx);
  let n=0; const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<(span||TASK_RECENT_DAYS);i++){ if(taskDoneOnDay(dkey(d),key)) n++; d.setDate(d.getDate()-1); }
  return n;
}
// サブゴール単位：直近7日でやったタスク数 ÷ 書いてあるタスク数
function subGoalRecent(m,sgIdx){
  const sg=(m.subGoals&&m.subGoals[sgIdx])||{};
  const list=sg.subSubGoals||[];
  let total=0, done=0;
  for(let i=0;i<list.length;i++){
    if(list[i]&&list[i].trim()){
      total++;
      if(taskDoneCount(m.id,sgIdx,i,TASK_RECENT_DAYS)>0) done++;
    }
  }
  return {done,total};
}
// 資産まるごと：直近7日でやったタスク数 ÷ 書いてあるタスク数
function assetTaskRecent(m){
  let done=0,total=0;
  (m.subGoals||[]).forEach((sg,i)=>{ const r=subGoalRecent(m,i); done+=r.done; total+=r.total; });
  return {done,total};
}
// ══════════════════════════════════════════
//  曼陀羅 ⇄ ホームの連動
//  曼陀羅でタスクを押したら、ホームの「今日、機能した資産は？」にも印をつける。
//  そのとき「これは曼陀羅から自動でついた印」という目印を autoCheckins に残しておき、
//  曼陀羅で取り消したときだけ、その印も一緒に消す。
//  ホームで自分の指で押した印は、曼陀羅の操作では絶対に消さない。
// ══════════════════════════════════════════
function autoSet(k){ if(!DATA.autoCheckins) DATA.autoCheckins={}; return Array.isArray(DATA.autoCheckins[k])?DATA.autoCheckins[k]:[]; }
function autoSave(k,arr){ if(arr.length) DATA.autoCheckins[k]=arr; else delete DATA.autoCheckins[k]; }
// ホーム側の印を自分の持ち物にする（本人が指で押したとき）
function forgetAuto(id){ const k=dkey(); const a=autoSet(k); const i=a.indexOf(id); if(i>=0){ a.splice(i,1); autoSave(k,a); } }
// 今日この資産の曼陀羅タスクを1つでも記録しているか
function anyTaskDoneToday(assetId){
  const v=(DATA.taskDone||{})[dkey()];
  return Array.isArray(v) && v.some(x=>String(x).indexOf(assetId+'|')===0);
}
function markAssetFunctioned(id){
  if(!DATA.checkins) DATA.checkins={};
  const k=dkey();
  const arr=Array.isArray(DATA.checkins[k])?DATA.checkins[k]:[];
  if(arr.indexOf(id)>=0) return false;   // すでに印あり（本人が押したもの）→ 目印は付けない
  arr.push(id);
  DATA.checkins[k]=arr;
  const a=autoSet(k); if(a.indexOf(id)<0) a.push(id); autoSave(k,a);
  return true;
}
function unmarkAssetIfAuto(id){
  const k=dkey();
  if(anyTaskDoneToday(id)) return;           // ほかのタスクがまだ残っている → 印は消さない
  const a=autoSet(k);
  const ai=a.indexOf(id);
  if(ai<0) return;                            // 本人が押した印 → さわらない
  a.splice(ai,1); autoSave(k,a);
  const arr=Array.isArray(DATA.checkins[k])?DATA.checkins[k]:[];
  const ci=arr.indexOf(id);
  if(ci>=0) arr.splice(ci,1);
  if(arr.length) DATA.checkins[k]=arr; else delete DATA.checkins[k];
}
// ══════════════════════════════════════════
//  タスクの候補（一般的な行動の言葉だけ・個人の情報は入れない）
// ══════════════════════════════════════════
const TASK_SUGGESTIONS = {
  finance:["家計簿に今日の使ったお金を書く","口座の残高を見る","積立の設定を確認する","固定費をひとつ見直す","資産の合計をメモする","お金の記事を10分読む","買う前に一晩考える","使っていないサブスクを解約する"],
  health:["朝に体重をはかる","30分歩く","決まった時間に薬をのむ","日付が変わる前に布団に入る","水をこまめに飲む","ストレッチを5分する","階段を使う","今日の体調を10点満点でメモする"],
  intel:["本を10ページ読む","学んだことを3行でメモする","気になったニュースを1つ調べる","AIに1つ質問して試す","新しい言葉を1つ覚える","動画の講座を15分見る","今日考えたことを書き出す","1週間の学びをふり返る"],
  life:["使ったものを元の場所に戻す","5分だけ片づける","寝る前に明日の予定を見る","洗い物をためない","ゴミを出す","明日着る服を決めておく","冷蔵庫の中身を確認する","買い物リストを作る"],
  relation:["ありがとうを言葉にして伝える","家族に連絡する","友だちにメッセージを送る","相手の話を最後まで聞く","一緒にごはんを食べる","誕生日をカレンダーに入れる","会いたい人に予定を聞く","今日あったことを話す"],
  career:["今日やった仕事を記録する","明日やることを3つ決める","分からないことを人に聞く","仕事の手順をメモに残す","勉強を15分する","困っていることを相談する","できるようになったことを書き足す","1か月の働き方をふり返る"],
  system:["使える制度がないか調べる","更新の期限をカレンダーに入れる","必要な書類を1か所にまとめる","相談できる窓口の連絡先を控える","医療費の領収書をとっておく","申請できるものを見直す","制度のニュースを確認する","分からない点を窓口に聞く"],
};
const TASK_SUGGESTIONS_COMMON = ["5分だけ手をつける","今日やったことを記録する","次にやることを1つ決める","続けやすい大きさに小さくする","調べたことをメモに残す","人に相談する","期限をカレンダーに入れる","1週間に1回ふり返る"];
function suggestionsFor(assetId){ return TASK_SUGGESTIONS[assetId] || TASK_SUGGESTIONS_COMMON; }


// ══════════════════════════════════════════
//  タスクを決める画面（自分で書く／候補から選ぶ）
// ══════════════════════════════════════════
let pickTarget=null;
function openTaskPicker(ssIdx){
  const m=DATA.mandala[currentMandala];
  const sg=m.subGoals[currentSubGoal];
  pickTarget=ssIdx;
  document.getElementById('pick-label').textContent=`タスク ${ssIdx+1}（${(sg.text||'').replace(/\n/g,' ')}）`;
  const inp=document.getElementById('pick-input');
  inp.value=(sg.subSubGoals&&sg.subSubGoals[ssIdx])||'';
  const list=suggestionsFor(m.id);
  const box=document.getElementById('pick-list');
  box.innerHTML=list.map((t,i)=>`<button type="button" class="pick-chip" data-i="${i}">${esc(t)}</button>`).join('');
  box.querySelectorAll('.pick-chip').forEach(b=>{
    b.onclick=()=>{ inp.value=list[+b.dataset.i]; inp.focus(); };
  });
  document.getElementById('pick-modal').classList.add('open');
  setTimeout(()=>inp.focus(),100);
}
function closeTaskPicker(){ document.getElementById('pick-modal').classList.remove('open'); pickTarget=null; }
function saveTaskPicker(){
  if(pickTarget===null) return;
  const v=document.getElementById('pick-input').value.trim();
  const sg=DATA.mandala[currentMandala].subGoals[currentSubGoal];
  if(!sg.subSubGoals) sg.subSubGoals=["","","","","","","",""];
  sg.subSubGoals[pickTarget]=v;
  DATA.sampleMode=false;
  saveData();
  closeTaskPicker();
  renderBoard();
}

// ══════════════════════════════════════════
//  まとめて入力（8マスを1画面で・貼り付けの振り分けつき）
// ══════════════════════════════════════════
function openBulkInput(){
  const m=DATA.mandala[currentMandala];
  const sg=m.subGoals[currentSubGoal];
  document.getElementById('bulk-label').textContent=`${assetLabel(m)} ／ ${(sg.text||'').replace(/\n/g,' ')} の8マス`;
  const list=sg.subSubGoals||[];
  document.getElementById('bulk-fields').innerHTML=Array.from({length:8},(_,i)=>
    `<div class="bulk-row">
       <div class="bulk-no">${i+1}</div>
       <textarea class="bulk-input" id="bulk-in-${i}" rows="1" placeholder="やることを1つ">${esc(list[i]||'')}</textarea>
     </div>`).join('');
  document.getElementById('bulk-paste-input').value='';
  document.getElementById('bulk-modal').classList.add('open');
}
function closeBulkInput(){ document.getElementById('bulk-modal').classList.remove('open'); }
function bulkFieldValues(){ return Array.from({length:8},(_,i)=>document.getElementById('bulk-in-'+i).value.trim()); }
// 貼り付けた文章を改行で区切って上から順に入れる
function bulkDistribute(){
  const raw=document.getElementById('bulk-paste-input').value||'';
  const lines=raw.split(/\r?\n/)
    .map(s=>s.trim().replace(/^[-−–—・*•]\s*/,'').replace(/^\d+[.)．、:：]\s*/,'').trim())
    .filter(s=>s)
    .slice(0,8);
  if(!lines.length){ alert('文章が入っていません。1行に1つずつ書いて（貼り付けて）ください。'); return; }
  const cur=bulkFieldValues();
  const willOverwrite=cur.slice(0,lines.length).some(v=>v);
  if(willOverwrite && !confirm(`上から${lines.length}マスに入れます。すでに書いてあるマスは上書きされます。よろしいですか？`)) return;
  lines.forEach((t,i)=>{ document.getElementById('bulk-in-'+i).value=t; });
  document.getElementById('bulk-paste-input').value='';
}
// 空いているマスだけ候補で埋める（保存前に自分の言葉に直せる）
function bulkFillSuggestions(){
  const m=DATA.mandala[currentMandala];
  const list=suggestionsFor(m.id);
  const cur=bulkFieldValues();
  let n=0;
  for(let i=0;i<8;i++){
    if(cur[i]) continue;
    const cand=list.find(t=>t && cur.indexOf(t)<0 && bulkFieldValues().indexOf(t)<0);
    if(!cand) break;
    document.getElementById('bulk-in-'+i).value=cand;
    n++;
  }
  if(!n) alert('空いているマスがありません。');
}
function saveBulkInput(){
  const sg=DATA.mandala[currentMandala].subGoals[currentSubGoal];
  sg.subSubGoals=bulkFieldValues();
  DATA.sampleMode=false;
  saveData();
  closeBulkInput();
  renderBoard();
}

// ── Dashboard ──
// 直近7日のうち、何か1つでも記録した日の数
function activeDays7(){
  let n=0; const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<7;i++){
    const k=dkey(d);
    const lg=(DATA.lifeLog||{})[k];
    const td=(DATA.taskDone||{})[k];
    const tl=(DATA.taskLog||{})[k];
    if(dayOn(k) || (lg&&Object.keys(lg).length) || (Array.isArray(td)&&td.length) || (Array.isArray(tl)&&tl.length)) n++;
    d.setDate(d.getDate()-1);
  }
  return n;
}
// 直近7日で自分の指でタップした回数（曼陀羅から自動でついた印は二重に数えない）
function taps7(){
  let n=0; const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<7;i++){
    const k=dkey(d);
    n+=dayCount(k);
    const au=(DATA.autoCheckins||{})[k]; if(Array.isArray(au)) n-=au.length;
    const lg=(DATA.lifeLog||{})[k]; if(lg) n+=Object.keys(lg).length;
    const td=(DATA.taskDone||{})[k]; if(Array.isArray(td)) n+=td.length;
    const tl=(DATA.taskLog||{})[k]; if(Array.isArray(tl)) n+=tl.length;
    d.setDate(d.getDate()-1);
  }
  return n<0?0:n;
}
function renderDashboard(){
  const d=new Date();
  const wk=Math.ceil((((d-new Date(d.getFullYear(),0,1))/86400000)+new Date(d.getFullYear(),0,1).getDay()+1)/7);
  document.getElementById('dash-week-label').textContent=`${d.getFullYear()}年 第${wk}週`;

  // 一番上に出すのは「達成率」ではなく「動いた日数」。
  // このアプリは目標に着いたかどうかを測る道具ではないため（達成しなくても手応えが返る形にする）。
  document.getElementById('dash-total-score').innerHTML=`${activeDays7()}<span class="ts-unit">/7日</span>`;
  const tlab=document.getElementById('dash-total-label');
  if(tlab) tlab.textContent='直近7日で、記録をつけた日';
  const tsub=document.getElementById('dash-taps');
  if(tsub) tsub.textContent=`この7日でタップした回数 ${taps7()}回`;

  // 2026-11-03 社長決定：連続日数と、資産ごとの7日の行動バーはレポートにも出さない（記録データは消していない）

  // 直近7日に終わらせた「今日のタスク」を、日付つきで並べる
  const logRows=[];
  {
    const d2=new Date(); d2.setHours(0,0,0,0);
    for(let i=0;i<7;i++){
      const k=dkey(d2);
      const arr=(DATA.taskLog||{})[k];
      if(Array.isArray(arr)) arr.forEach(t=>logRows.push({date:k,text:t}));
      d2.setDate(d2.getDate()-1);
    }
  }
  document.getElementById('dash-tasks').innerHTML=logRows.length
    ? `<div class="dash-note">直近7日で ${logRows.length} 件 終わりました</div>`
      + logRows.map(r=>`<div class="achievement-card">
          <div class="achievement-icon">✅</div>
          <div><div class="achievement-text">${esc(r.text)}</div><div class="achievement-sub">${esc(r.date)}</div></div>
        </div>`).join('')
    : `<div class="empty-achieve">直近7日で終わったタスクはまだありません<br>ホームの「今日のタスク」で丸を押すと、ここに並びます</div>`;

  // 曼陀羅の実行（直近7日）
  // 「いくつ書いたか」ではなく「書いたタスクのうち、いくつ実際にやったか」を出す。
  // タスクを1つも書いていない資産は「未設定」と正直に出す（0%の棒にして責めない）。
  const sgStats=DATA.mandala.map(m=>{
    const r=assetTaskRecent(m);
    const pct=r.total?Math.round(r.done/r.total*100):0;
    return {icon:m.icon,name:m.name,done:r.done,total:r.total,pct};
  });
  const written=sgStats.reduce((s,x)=>s+x.total,0);
  const dashNote=document.getElementById('dash-subgoals-note');
  if(dashNote){
    dashNote.textContent = written
      ? '書いたタスクのうち、直近7日でタップして記録したものの割合です'
      : 'まだタスクが1つも書かれていません。曼陀羅の「まとめて入力」から書けます';
  }
  document.getElementById('dash-subgoals').innerHTML=sgStats.map(s=>`
    <div class="dash-bar-row">
      <div class="dash-bar-icon">${esc(s.icon)}</div>
      <div class="dash-bar-name">${esc(s.name.replace('資産',''))}</div>
      <div class="dash-bar-wrap"><div class="dash-bar-fill" style="width:${s.pct}%;background:${s.total?'var(--green)':'var(--text3)'};"></div></div>
      <div class="dash-bar-val">${s.total?s.done+'/'+s.total:'未設定'}</div>
    </div>`).join('');

  renderReports();
  renderBackupMeta();
  renderOpenMode();
  renderThemePicker();
}

function renderReports(){
  const reports=(typeof REPORTS_DATA!=='undefined' && Array.isArray(REPORTS_DATA))?REPORTS_DATA:[];
  // 過去の記録が1件もないときは、空っぽの見出しだけ残らないように section ごと隠す
  const sec=document.getElementById('dash-reports-section');
  if(sec) sec.style.display=reports.length?'block':'none';
  if(!reports.length){ document.getElementById('report-list').innerHTML=''; return; }
  document.getElementById('report-list').innerHTML=reports.map((r,i)=>`
    <div class="report-card">
      <div class="report-card-header" onclick="toggleReport(${i})">
        <div style="flex:1;">
          <h3>${r.title}</h3>
          <p>${r.summary}</p>
          <div class="report-meta">${r.date}</div>
        </div>
        ${r.detail?`<div class="report-arrow" id="rarr-${i}">▼</div>`:''}
      </div>
      ${r.detail?`<div class="report-detail" id="rdetail-${i}">${r.detail}</div>`:''}
    </div>`).join('');
}
function toggleReport(i){
  const det=document.getElementById(`rdetail-${i}`);
  const arr=document.getElementById(`rarr-${i}`);
  if(!det) return;
  det.classList.toggle('open');
  if(arr) arr.classList.toggle('open');
}

function renderAll(){
  renderDate(); renderWave(); renderStreak(); renderTasks(); renderAssets(); renderSummaries(); renderLifeLog(); renderHealthPanel(); renderBrief();
  renderHomeScreenGate(); renderHomeScreenWarn(); renderBackupNudge(); renderIntroGuide();
  renderBoard();       // 最初の画面（9マス）はいつも描き直す
  if(document.getElementById('page-report').classList.contains('active')) renderDashboard();
}

// ══════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════
function switchPage(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`page-${id}`).classList.add('active');
  document.body.setAttribute('data-tab', id);   // 書きかえボタン（右下）は9マスの画面では出さない（盤の下に専用のボタンがある）
  const nb=document.querySelector('.nav-btn[data-page="'+id+'"]');
  if(nb) nb.classList.add('active');
  if(id==='mandala'){ renderBoard(); }
  if(id==='home'){ renderStreak(); renderAssets(); renderBrief(); renderTasks(); }
  if(id==='report'){ renderDashboard(); }
}

// ══════════════════════════════════════════
//  EDIT MODE
// ══════════════════════════════════════════
function toggleEditMode(){
  editMode=!editMode;
  document.body.classList.toggle('edit-mode',editMode);
  const fab=document.getElementById('edit-fab');
  fab.textContent=editMode?'✅ 完了':'✏️ 編集';
  fab.classList.toggle('active',editMode);
  renderBoard();       // 9マスの説明の文と、書きかえボタンの表示を、今のモードに合わせて出し直す
}

let modalIsMandala=false;   // 曼陀羅の文字を書きかえる画面かどうか
function openModal(label, value, cb, multiline=true){
  modalIsMandala=false;
  document.getElementById('modal-label').textContent=label;
  const inp=document.getElementById('modal-input');
  inp.value=value||'';
  inp.rows=multiline?4:2;
  modalCallback=cb;
  document.getElementById('modal').classList.add('open');
  setTimeout(()=>inp.focus(),100);
}
function closeModal(){ document.getElementById('modal').classList.remove('open'); modalCallback=null; }
function saveModal(){
  const val=document.getElementById('modal-input').value.trim();
  if(modalCallback) modalCallback(val);
  if(modalIsMandala) DATA.sampleMode=false; // 曼陀羅を自分で書きかえたら、それはもう見本ではない
  saveData(); renderAll(); closeModal();   // 見ている画面（mView）は変わらないので、書きかえたあともそのまま
}

// ── 波の状態（🟢🟡🔴）は選ぶだけにする ──
const WAVE_CHOICES=[
  {status:'stable',  label:'🟢 安定', note:'いつもどおり動ける'},
  {status:'caution', label:'🟡 注意', note:'少し重い・無理はしない'},
  {status:'alert',   label:'🔴 要注意', note:'休むことを優先する'},
];
function openWavePicker(){
  const box=document.getElementById('wave-list');
  if(box){
    box.innerHTML=WAVE_CHOICES.map((w,i)=>
      `<button type="button" class="wave-choice ${w.status} ${DATA.wave.status===w.status?'now':''}" onclick="setWave(${i})">
        <span class="wc-label">${w.label}</span><span class="wc-note">${w.note}</span>
      </button>`).join('');
  }
  document.getElementById('wave-modal').classList.add('open');
}
function closeWavePicker(){ document.getElementById('wave-modal').classList.remove('open'); }
function setWave(i){
  const w=WAVE_CHOICES[i];
  if(!w) return;
  DATA.wave={status:w.status,label:w.label};
  saveData(); renderWave(); closeWavePicker();
}
function editTask(i){
  if(!editMode) return;
  openModal('タスクを編集',DATA.tasks[i].text,v=>{ DATA.tasks[i].text=v; },false);
}
function addTask(){
  openModal('新しいタスク','',v=>{ if(v) DATA.tasks.push({text:v,done:false}); },false);
}
// コアゴールとサブゴールの文字は、編集モードに入らなくても書きかえられる
// （押しても何も起きないマスをなくすため）
function editCoreGoal(){
  openModal(`コアゴール（${assetLabel(DATA.mandala[currentMandala])}）`,DATA.mandala[currentMandala].center,v=>{ DATA.mandala[currentMandala].center=v; });
  modalIsMandala=true;
}
function editSubGoal(i){
  const m=DATA.mandala[currentMandala];
  if(!m.subGoals[i]) return;
  openModal(`サブゴール ${i+1}（${assetLabel(m)}）`,m.subGoals[i].text,v=>{ m.subGoals[i].text=v; });
  modalIsMandala=true;
}
// タスクの文字を決めるのは openTaskPicker（自分で書く／候補から選ぶ）に一本化した
function editSubSub(i){ openTaskPicker(i); }
function editAsset(i){
  const a=DATA.assets[i];
  openModal(`資産名を編集`,`${a.icon} ${a.name}`,v=>{
    const parts=v.split(' ');
    if(parts.length>=2){ a.icon=parts[0]; a.name=parts.slice(1).join(' '); }
    else{ a.name=v; }
    const mi=DATA.mandala.findIndex(m=>m.id===a.id);
    if(mi>=0){ DATA.mandala[mi].icon=a.icon; DATA.mandala[mi].name=a.name; }
  },false);
}
function addAsset(){
  openModal('新しい資産（例：🌍 海外資産）','',v=>{
    if(!v) return;
    const parts=v.split(' ');
    const icon=parts[0]||'⭐';
    const name=parts.slice(1).join(' ')||v;
    const id='asset_'+Date.now();
    DATA.assets.push({id,icon,name,status:'gray',behavior:0,behaviorLabel:'未入力',subjective:0,subjectiveLabel:'未入力'});
    DATA.mandala.push({id,icon,name,center:'',subGoals:Array(8).fill(null).map(()=>({text:'',subSubGoals:Array(8).fill('')}))});
    DATA.summaries.push({id,icon,title:`${name} — サマリー`,items:['情報収集中'],source:'—'});
  },false);
}
function deleteAsset(i){
  if(!editMode) return;
  if(!DATA.assets[i]) return;
  if(!confirm(`「${DATA.assets[i].name}」を削除しますか？\n曼陀羅に書いた中身も一緒に消えます。`)) return;
  const id=DATA.assets[i].id;
  DATA.assets.splice(i,1);
  DATA.mandala=DATA.mandala.filter(m=>m.id!==id);
  DATA.summaries=DATA.summaries.filter(s=>s.id!==id);
  // 消した資産を開いたままだと、次に曼陀羅を描くときに中身が無くて落ちる。
  // 見ている場所を必ず戻しておく。
  if(currentMandala>=DATA.mandala.length) currentMandala=Math.max(0,DATA.mandala.length-1);
  currentSubGoal=0;
  if(mView>0 && !DATA.mandala[currentMandala]) mView=0;
  saveData(); renderAll(); histSync();
}

function toggleTask(i){
  const t=DATA.tasks[i];
  if(!t) return;
  if(!DATA.taskLog) DATA.taskLog={};
  const k=dkey();
  const was=taskDoneTodayFlag(t);
  const arr=Array.isArray(DATA.taskLog[k])?DATA.taskLog[k]:[];
  if(was){
    t.done=false; t.doneDate='';
    const j=arr.indexOf(t.text); if(j>=0) arr.splice(j,1);
  }else{
    t.done=true; t.doneDate=k;
    if(arr.indexOf(t.text)<0) arr.push(t.text);
  }
  if(arr.length) DATA.taskLog[k]=arr; else delete DATA.taskLog[k];
  saveData(); renderTasks(); renderBrief();
  if(!was) celebrateTask(i);
}
function deleteTask(i){
  const t=DATA.tasks[i];
  if(!t) return;
  if(!confirm(`「${t.text}」を消しますか？`)) return;
  DATA.tasks.splice(i,1);
  saveData(); renderTasks(); renderBrief();
}

function celebrateTask(i){
  const wrap=document.createElement('div');
  wrap.className='confetti-wrap';
  const colors=['var(--accent)','var(--green)','var(--yellow)','var(--accent2)','#fd79a8','#00cec9'];
  for(let c=0;c<30;c++){
    const p=document.createElement('div');
    p.className='confetti-piece';
    p.style.cssText=`left:${Math.random()*100}%;top:-10px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${.8+Math.random()*.8}s;animation-delay:${Math.random()*.3}s;transform:rotate(${Math.random()*360}deg);width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>.5?'50%':'2px'};`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(),1800);
}

// ══════════════════════════════════════════
//  FETCH REPORT (auto-daily + manual)
// ══════════════════════════════════════════
async function fetchReport(manual=false){
  const btn=document.getElementById('report-refresh-btn');
  const updEl=document.getElementById('report-updated');
  const today=new Date().toISOString().slice(0,10);
  const lastFetch=localStorage.getItem('reportLastFetch');
  if(!manual && lastFetch===today) return; // 今日はもう取得済み
  // 一瞬で終わることが多い操作ではないため（外部との通信を待つ）、読み込み中マークを出す
  if(btn){ btn.innerHTML=markSpinnerSVG(true)+' 取得中...'; btn.disabled=true; btn.classList.add('is-loading'); }
  try{
    const res=await fetch('./data/report.json?t='+Date.now());
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json=await res.json();
    if(json.summaries && Array.isArray(json.summaries)){
      DATA.summaries=json.summaries;
      saveData();
      renderSummaries();
      renderBrief();
      localStorage.setItem('reportLastFetch',today);
      if(updEl) updEl.textContent=' · '+json.updatedAt;
    }
  }catch(e){
    if(manual) alert('取得失敗: '+e.message);
  }finally{
    if(btn){ btn.textContent='↻ 更新'; btn.disabled=false; btn.classList.remove('is-loading'); }
  }
}

// ══════════════════════════════════════════
//  BACKUP（書き出し・復元）
// ══════════════════════════════════════════
function backupText(){ return JSON.stringify({app:'life-orbit',exportedAt:new Date().toISOString(),data:DATA},null,2); }
function backupFileName(){ return `life-orbit-backup-${dkey()}.json`; }
function markBackupDone(){
  DATA.lastBackup=dkey();
  saveData();
  try{ localStorage.setItem('lastBackup',DATA.lastBackup); }catch(e){}
  renderBackupMeta(); renderBackupNudge();
}
function exportData(){
  const blob=new Blob([backupText()],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=backupFileName();
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000);
  markBackupDone();
}
// スマホの共有メニューへそのまま渡す（自分あてのメール・LINE・ファイルアプリへ置ける）
function shareBackup(){
  try{
    const file=new File([backupText()],backupFileName(),{type:'application/json'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:'Life Orbit の控え'}).then(markBackupDone).catch(()=>{});
      return;
    }
  }catch(e){}
  alert('この端末では「送って保存」が使えません。左の「バックアップを書き出す」を使ってください。');
}

function importData(input){
  const file=input.files&&input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const json=JSON.parse(reader.result);
      const d=json.data||json;
      // 2026-08-09 セキュリティ部署の指摘：中身が「本物のバックアップの形」をしているかを、
      // これまでより少しだけ厳しく確かめる（assets・mandalaが存在するだけでなく、
      // Life Orbitが実際に作る形＝配列であることまで見る）。
      if(!Array.isArray(d.assets) || !Array.isArray(d.mandala) || d.assets.length===0 || d.mandala.length===0){
        throw new Error('Life Orbitのバックアップファイルではありません');
      }
      // 2026-11-03 セキュリティ部署の指摘：資産・曼陀羅のidは、アプリが作る形（英数字と_だけ）か確かめる
      // （idは画面の部品に埋め込まれるため、記号の混じったバックアップは受け付けない）
      const idOK = x => x && typeof x.id==='string' && /^[A-Za-z0-9_]{1,64}$/.test(x.id);
      if(!d.assets.every(idOK) || !d.mandala.every(idOK)){
        throw new Error('資産の名前の目印（id）に使えない文字が入っています');
      }
      if(!confirm('今のデータを上書きして、このバックアップに戻しますか？')){ input.value=''; return; }
      // 2026-11-03 セキュリティ部署の指摘：上書きの直前に、今の記録を別の名前で1つだけ控えておく（取り違えても戻せるように）
      try{
        const cur = localStorage.getItem('jibun-data');
        if(cur) localStorage.setItem('jibun-data-prev', cur);
      }catch(e){}
      localStorage.setItem('jibun-data',JSON.stringify(d));
      DATA=loadData();
      renderAll(); histSync();
      alert('復元しました ✅');
    }catch(e){
      alert('復元できませんでした：'+e.message);
    }
    input.value='';
  };
  reader.readAsText(file);
}

// ══════════════════════════════════════════
//  画面の明るさ（2026-08-05 追加）
//  auto=端末に合わせる／light=明るい／dark=暗い。この端末のDATA.settings.themeにだけ保存する。
// ══════════════════════════════════════════
function getThemeMode(){
  const t = DATA.settings && DATA.settings.theme;
  return (t==='light' || t==='dark') ? t : 'auto';
}
function applyTheme(mode){
  const root = document.documentElement;
  if(mode==='light' || mode==='dark'){ root.setAttribute('data-theme', mode); }
  else { root.removeAttribute('data-theme'); }
  // スマホの上端のバーの色（theme-color）も合わせて書きかえる
  let effective = mode;
  if(effective==='auto'){
    let prefersLight=false;
    try{ prefersLight = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches); }catch(e){}
    effective = prefersLight ? 'light' : 'dark';
  }
  const mc = document.getElementById('theme-color-meta');
  if(mc) mc.setAttribute('content', effective==='light' ? '#F6F4FB' : '#391F5C');
}
function setThemeMode(mode){
  if(mode!=='light' && mode!=='dark') mode='auto';
  DATA.settings.theme = mode;
  saveData();
  applyTheme(mode);
  renderThemePicker();
}
function renderThemePicker(){
  const mode = getThemeMode();
  document.querySelectorAll('#theme-picker .theme-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.themeMode===mode);
  });
  renderThemeQuickToggle();
}
// 2026-08-07（作り直し）：ヘッダー右上の「☀️/🌙が並んだ2択スイッチ」。
// 「端末に合わせる」を選んでいる間は、いま画面に見えている明るさの側だけを選ばれた状態で見せる
// （どちらが画面に反映されているかが一目でわかるのが自然、という判断。詳細は技術判断ログ）。
// ☀️か🌙を直接押すと、その明るさに固定される（＝setThemeModeを直接呼ぶだけで切り替わる）。
function effectiveThemeNow(){
  const mode = getThemeMode();
  if(mode==='light' || mode==='dark') return mode;
  let prefersLight=false;
  try{ prefersLight = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches); }catch(e){}
  return prefersLight ? 'light' : 'dark';
}
function renderThemeQuickToggle(){
  const effective = effectiveThemeNow();
  const lightBtn = document.getElementById('theme-switch-light');
  const darkBtn = document.getElementById('theme-switch-dark');
  if(lightBtn) lightBtn.classList.toggle('is-active', effective==='light');
  if(darkBtn) darkBtn.classList.toggle('is-active', effective==='dark');
}
// 「端末に合わせる」を選んでいる間は、端末の設定が変わったらその場で追従する
try{
  window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', ()=>{
    if(getThemeMode()==='auto'){ applyTheme('auto'); renderThemeQuickToggle(); }
  });
}catch(e){}

function renderBackupMeta(){
  const el=document.getElementById('backup-meta');
  if(!el) return;
  let last=DATA.lastBackup;
  if(!last){ try{ last=localStorage.getItem('lastBackup')||''; }catch(e){} }
  const since=daysSinceDate(last);
  el.textContent = last
    ? `最後に控えを取った日：${last}${since!==null?`（${since}日前）`:''}`
    : 'まだ一度も控えを取っていません。月に1回の書き出しがおすすめです';
  // 「送って保存」はスマホの共有メニューが使える端末だけ出す
  const sb=document.getElementById('backup-share-btn');
  if(sb){
    let ok=false;
    try{ ok=!!(navigator.canShare && navigator.canShare({files:[new File(['{}'],'t.json',{type:'application/json'})]})); }catch(e){ ok=false; }
    sb.style.display=ok?'block':'none';
  }
}

// ══════════════════════════════════════════
//  SERVICE WORKER（オフライン対応）
// ══════════════════════════════════════════
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

// ══════════════════════════════════════════
//  開幕画面（splash）を閉じる／読み込み中へ切り替える
//  2026-08-11 社長判断（回し続ける・2286ms）に基づく設計：
//  ・SPLASH_MIN_MS（最低表示）＝style.cssの--splash-minと同じ値をCSSから読む
//  ・SPLASH_MAX_MS（上限）＝--splash-maxと同じ値。支度がここまで長引いたら、
//    ブランドを見せる開幕画面をやめて「読み込み中」の表示（点が順に光る＋文言）に切り替える
//  「アプリの支度が整った瞬間」と「最低これだけは見せる時間」の遅いほうに合わせて消す。
//  支度（renderAll）は一瞬で終わるため、実際にはほぼ毎回SPLASH_MIN_MSぶんだけ表示される。
//  第2引数はcssMsが失敗したとき用の保険値。style.cssの値と同じ数字にしておくこと
//  （ずれるとCSSアニメーションとJSの消すタイミングが食い違う）。
//
//  2026-08-12 テックMGR検品：2つの不具合を実機で見つけて直した。
//  【不具合1】上の保険値が2026-08-11のCSS変更（1100→2286／2400→3600）に追随しておらず、
//    style.cssの読み込みがJSの実行に間に合わなかった場合（実測で毎回発生していた。読み込みを
//    速くする仕組み＝<head>のmedia="print"の都合で、そういうことが起こる作りになっている）、
//    古い値（1100/2400）にこっそり戻ってしまっていた。つまり「2286ms見せる」つもりが、
//    実際には多くの場合1100msしか見せていなかった。→保険値を2286/3600に修正。
//  【不具合2（本題）】「51.43°の倍数の時間だけ見せれば、開始時と同じ向きで消える」という
//    考え方は正しいが、「splashStartedAtから2286ms後」という計算のしかたが誤っていた。
//    回転のアニメーション（.lo-mark-spin）はHTMLに最初から書かれているため、
//    ページの読み込みが始まった瞬間（0ms地点）を基準に動く。ところがsplashStartedAtは
//    それより後（index.html下部の<script>までブラウザが読み進んだ時刻）に記録される値で、
//    実機で数十ms〜のズレを確認した。このズレを足さずに「2286ms後」で消すと、回転そのものの
//    経過時間は2286msぴったりにならず、51.43°の倍数からずれる。
//    →直し方：performance.now()自体が、回転と同じ0ms地点を基準にした時計であることを
//    実機で確認できたので、「splashStartedAtから何ms後か」ではなく「performance.now()が
//    51.43°の倍数になる時刻まで待つ」よう計算し直した（下のreadySplash参照）。
//  ・視差軽減設定（prefers-reduced-motion）がオンの人には回転を見せないため、
//    「51.43°の倍数で消す」理由がそもそも当てはまらない。そのため専用の短い時間
//    （--splash-min-still）を使う。回転なしの静止画を2秒以上見せ続けるのは間延びするため。
// ══════════════════════════════════════════
const REDUCE_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const SPLASH_MIN_MS = REDUCE_MOTION ? cssMs('--splash-min-still', 1100) : cssMs('--splash-min', 2286);
const SPLASH_MAX_MS = cssMs('--splash-max', 3600);
const SPLASH_EXIT_MS = cssMs('--duration-exit', 420);
// マーク1点ぶんの角度に相当する時間（=51.43°）。回転しない設定の人には不要なのでnull。
const ORBIT_STEP_MS = REDUCE_MOTION ? null : cssMs('--orbit-step', 1142.857);
let splashMaxTimer = null;

function hideSplash(){
  const el = document.getElementById('splash');
  if(!el || el.dataset.hiding) return;
  // 2026-11-03：style.cssがまだ届いていないうちは消さない（消すと、飾りの無い素の画面が見える）。
  // 届かないままでも、index.html側の安全策が15秒で必ず消す。
  const css = document.querySelector('link[rel="stylesheet"]');
  if(css && css.media === 'print'){ setTimeout(hideSplash, 50); return; }
  // ここまでの間は、index.htmlの<style>が全部品の transition を止めている。開幕が消えるいまから、ふだんの動きに戻す
  document.documentElement.classList.add('lo-go');
  el.dataset.hiding = '1';
  if(splashMaxTimer){ clearTimeout(splashMaxTimer); splashMaxTimer = null; }
  const content = el.querySelector('.splash-content');
  if(content) content.classList.add('lo-splash-out'); // マーク・文字だけ消える。紫の背景は最後まで残す
  setTimeout(()=>{ el.remove(); }, SPLASH_EXIT_MS + 30); // 消える動きが終わるのを待ってからDOMから消す
}

// 支度がSPLASH_MAX_MSを超えても終わらなかったときだけ動く保険。
// 通常のアプリの支度（renderAll）は一瞬で終わるため、ふだんはここまで待たされることは無い。
function splashToLoading(){
  const el = document.getElementById('splash');
  if(!el || el.dataset.hiding) return; // すでに閉じ始めていたら何もしない
  const mark = el.querySelector('.splash-mark .mark-spinner');
  // 開幕の動き（回転／据わる のどちらでも）を外して、点が順に光る表示へ切り替える
  if(mark){ mark.classList.remove('lo-mark-spin', 'lo-splash-in'); mark.classList.add('lo-loader'); }
  const sub = el.querySelector('.splash-sub');
  if(sub) sub.textContent = '読み込み中…'; // 動きを止める設定の人にも文字で伝わるようにする
}

function readySplash(){
  const now = (window.performance && performance.now) ? performance.now() : Date.now();
  const elapsed = now - splashStartedAt;
  let wait;
  if(ORBIT_STEP_MS){
    // 回転マークはページ読み込み開始（0ms）を基準に動いている。performance.now()も
    // 同じ0ms基準の時計なので、「いま」からではなく「0msから見て51.43°の倍数になる、
    // 直近の時刻」を目標にする。これなら消える瞬間、マークは必ず開始時と同じ向きになる。
    // ※SPLASH_MIN_MS（2286ms）はorbit-step（1142.857ms）の「ちょうど2倍」を人が読める
    // 数字に丸めた値で、真の2倍（2285.714ms）よりわずかに大きい。丸め込み無しでceilすると
    // このわずかな差だけで「2倍」のつもりが「3倍（3428.571ms）」に繰り上がってしまう
    // バグを実機で発見したため、5ms分だけ先に差し引いてから倍数を決めている。
    const EPS = 5;
    const steps = Math.ceil((SPLASH_MIN_MS - EPS) / ORBIT_STEP_MS);
    const target = steps * ORBIT_STEP_MS;
    wait = Math.max(0, target - now);
  } else {
    // 視差軽減設定など、回転が無いとき＝向きを気にする必要が無いので、従来どおり
    // 「支度がここまで進んでから何ms待つか」で決める。
    wait = Math.max(0, SPLASH_MIN_MS - elapsed);
  }
  setTimeout(hideSplash, wait);
  const maxWait = Math.max(0, SPLASH_MAX_MS - elapsed);
  splashMaxTimer = setTimeout(splashToLoading, maxWait);
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
applyTheme(getThemeMode());
applyHealthFragment();
mInitView();           // どの画面から始めるか（いちばん新しく押したサブゴール／無ければ全体）
renderAll();
readySplash();
renderThemePicker();
// 更新日ラベルをlocalStorageから復元
(()=>{
  const updEl=document.getElementById('report-updated');
  const last=localStorage.getItem('reportLastFetch');
  if(updEl && last) updEl.textContent=' · '+last;
})();
// 毎日自動取得
fetchReport(false);
// 日付が変わったあとに、開いたままのアプリへ戻ってきたとき（ホーム画面から開き直さなくても）、
// 「今日」の印を新しい日に合わせて描き直す
let shownDay = dkey();
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden) return;
  const k = dkey();
  if(k!==shownDay){ shownDay = k; renderDate(); renderAll(); }
});
