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
const DATA_VERSION = 12;

// ══════════════════════════════════════════
//  はじめて開いたときに入っている「見本」
//  ここに書くのは、だれにでも当てはまる一般的な言葉だけ。
//  個人の目標・金額・病名・会社名などは1文字も書かない。
//  使う人は編集（✏️）で自分の言葉に書きかえるか、
//  「見本を消してまっさらにする」でゼロから始められる。
// ══════════════════════════════════════════
function starterSubGoals(list){
  return list.map(item=>{
    if(typeof item === 'string') return {text:item, subSubGoals:Array(8).fill('')};
    const tasks = ["","","","","","","",""];
    (item.tasks||[]).forEach((t,i)=>{ if(i<8) tasks[i]=t; });
    return {text:item.text, subSubGoals:tasks};
  });
}
const STARTER_MANDALA = [
  {id:"finance",icon:"💰",name:"金融資産",center:"お金の流れを整えて、\nほうっておいても増える形をつくる",
   subGoals:starterSubGoals([
     {text:"使ったお金を\n記録する",tasks:["レシートを財布から出す","家計簿に今日の金額を書く","今週使った合計を出す"]},
     "毎月の積立を\n続ける","固定費を\n見直す","貯金の目標を\n決める",
     "使えるお金の\n制度を知る","お金の勉強を\nする","資産の合計を\n見える化する","買う前に\n一度考える",
   ])},
  {id:"health",icon:"💪",name:"健康資産",center:"無理なく続けられる形で、\n体と心を整える",
   subGoals:starterSubGoals([
     {text:"体を動かす\n習慣をつくる",tasks:["20分歩く","ストレッチを5分する","階段を使う"]},
     "睡眠の時間を\n守る","食事のリズムを\n整える","体調を\n記録する",
     "定期的に\n検診を受ける","休む日を\nつくる","疲れのサインに\n気づく","こころの調子を\n書きとめる",
   ])},
  {id:"intel",icon:"🧠",name:"認知資産",center:"学び続けて、\n考える力を伸ばす",
   subGoals:starterSubGoals([
     {text:"本を読む",tasks:["本を10ページ読む","気になった一文をメモする","読んだ内容を人に話す"]},
     "学んだことを\nメモする","ニュースを\n追いかける","新しい道具を\n試す",
     "資格や検定に\n挑戦する","人の話を\n聞きに行く","考えを\n文章にする","ふり返りの\n時間をとる",
   ])},
  {id:"life",icon:"🏡",name:"生活資産",center:"毎日の仕組みを整えて、\n暮らしを楽にする",
   subGoals:starterSubGoals([
     {text:"朝の流れを\n決める",tasks:["起きたらカーテンを開ける","朝ごはんを食べる","出かける前に持ち物を確認する"]},
     "夜の流れを\n決める","部屋を\n片づける","明日の予定を\n確認する",
     "買い物と食事を\n計画する","持ち物を\n減らす","困ったときの\n備えをする","崩れた日の\n最小の行動を決める",
   ])},
  {id:"relation",icon:"❤️",name:"関係資産",center:"大事な人とのつながりを、\n無理なく続ける",
   subGoals:starterSubGoals([
     {text:"家族と話す",tasks:["今日あったことを話す","ありがとうを言葉にする","一緒にごはんを食べる"]},
     "友だちに\n連絡する","感謝を\n言葉にする","一緒に過ごす\n時間をつくる",
     "新しい場所に\n顔を出す","相手の話を\n聞く","記念日を\n覚えておく","ひとりの時間も\n大切にする",
   ])},
  {id:"career",icon:"💼",name:"仕事資産",center:"今の仕事を続けながら、\n次の選択肢を増やす",
   subGoals:starterSubGoals([
     {text:"今日の仕事を\n記録する",tasks:["やった仕事を3行で書く","明日やることを3つ決める","うまくいったことを1つ書く"]},
     "できることを\n増やす","職場の人に\n相談する","手順をメモに\n残す",
     "勉強の時間を\nつくる","働き方を\nふり返る","収入のたねを\n探す","5年後の自分を\n考える",
   ])},
  {id:"system",icon:"📜",name:"制度資産",center:"使える仕組みは調べて、\nもれなく使う",
   subGoals:starterSubGoals([
     {text:"使える制度を\n調べる",tasks:["自治体のページを見る","気になった制度をメモする","窓口の連絡先を控える"]},
     "申請の期限を\n管理する","書類を1か所に\nまとめる","相談できる窓口を\n控える",
     "税金の控除を\n確認する","保険の内容を\n確認する","制度のニュースを\n見る","分からない点を\n聞きに行く",
   ])},
];

// ══════════════════════════════════════════
//  DEFAULT DATA
// ══════════════════════════════════════════
const DEFAULT_DATA = {
  dataVersion: DATA_VERSION,
  updatedAt:"2026-07-29",
  sampleMode:true,        // 見本が入っている状態（自分で決めたら false になる）
  wave:{status:"stable",label:"🟢 安定"},
  checkins:{},
  autoCheckins:{},
  lifeLog:{},
  taskDone:{},
  taskLog:{},
  lastBackup:'',
  settings:{medsTime:'', theme:'auto'},   // この端末だけの設定。medsTime=服薬の時刻（最初は空）／theme=画面の明るさ（auto=端末に合わせる／light/dark=手で選んだ設定）
  tasks:[
    {text:"曼陀羅を開いて、資産をひとつ選ぶ",done:false,doneDate:''},
    {text:"コアゴールを自分の言葉に書きかえる",done:false,doneDate:''},
    {text:"サブゴールをひとつ選んで、やることを書く",done:false,doneDate:''},
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
let currentSubGoal = null;
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
function needIntroGuide(){
  return introGuideForceOpen || (!needHomeScreenGate() && !introGuideAcked());
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
    body:'真ん中が目標、まわりの8つが小さな行動です。やった日にマスを押すと、色が変わって残ります。押せなかった日があっても、消えたり減ったりしません。',
    visual:'grid',
  },
  {
    title:'7つの分野がある',
    body:'金融資産（お金）・健康資産（体と心）・認知資産（学び）・生活資産（暮らし）・関係資産（人とのつながり）・仕事資産（仕事）・制度資産（使える制度）。この7つに、同じ9マスのしくみがあります。全部やらなくて大丈夫です。今日やったことがある分野を1つ選んで、マスを押してみましょう。',
    visual:'assets',
    closing:'今日動いた分は、消えずに積み上がっていく。',
    finishLabel:'はじめる',
  },
];
function renderIntroGuide(){
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
// 画面3「はじめる」。設計書5章の指示どおり、閉じて終わりにはしない。閉じた先はホーム画面
// （このガイドの下にすでにある画面）で、「今日、機能した資産は？」のカードをタップすれば
// そのままマスを1回押せる。別の説明画面・お知らせは一切挟まない。
function finishIntroGuide(){
  try{ localStorage.setItem('loGuideAck','1'); }catch(e){}
  introGuideForceOpen=false;
  introGuideStep=0;
  renderIntroGuide();
}
// レポート画面「使い方ガイドをもう一度見る」から呼ぶ。既読の記録は消さない
// （消すと、まだ読み終える前に閉じたときに次回また自動で出てしまうため）。
function reopenIntroGuide(){
  introGuideForceOpen=true;
  introGuideStep=0;
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
// 資産の行動指標：直近7日で機能した日数（手入力ではなく自動算出）
function assetBehavior(id){
  const c=DATA.checkins||{}; let days=0; const d=new Date(); d.setHours(0,0,0,0);
  for(let i=0;i<7;i++){ const v=c[dkey(d)]; if(Array.isArray(v)&&v.indexOf(id)>=0) days++; d.setDate(d.getDate()-1); }
  return {days, pct:Math.round(days/7*100)};
}
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
function calcStreak(){
  let n=0; const d=new Date(); d.setHours(0,0,0,0);
  if(!dayOn(dkey(d))) d.setDate(d.getDate()-1); // 今日未記録なら昨日までの連続を数える
  while(dayOn(dkey(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function monthCount(){
  const now=new Date();
  const pre=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  return Object.keys(DATA.checkins||{}).filter(k=>k.indexOf(pre)===0 && dayOn(k)).length;
}
function renderStreak(){
  const elDays=document.getElementById('streak-days'); if(!elDays) return;
  elDays.textContent=calcStreak();
  document.getElementById('streak-month').textContent='今月 '+monthCount()+'日 機能';
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
  const streak=calcStreak();
  const todayLog=lifeLogToday();
  const missingLife=LIFELOG_ITEMS.filter(it=>!todayLog[it.key]).map(it=>it.label);
  const doneAssetsCount=((DATA.checkins||{})[dkey()]||[]).length;
  const missingAssetsCount=Math.max(0, (DATA.assets||[]).length - doneAssetsCount);
  const missingTaskCount=(DATA.tasks||[]).filter(t=>!taskDoneTodayFlag(t)).length;

  let promptHtml;
  if(missingLife.length===0 && missingAssetsCount===0 && missingTaskCount===0){
    promptHtml=`<div class="brief-row brief-ok">✅ 今日の記録はすべて完了しています</div>`;
  }else{
    const parts=[];
    if(missingLife.length) parts.push(missingLife.join('・'));
    if(missingAssetsCount>0) parts.push('資産チェック'+missingAssetsCount+'件');
    if(missingTaskCount>0) parts.push('今日のタスク'+missingTaskCount+'件');
    promptHtml=`<div class="brief-row brief-todo">⏳ まだ：${parts.join('、')}</div>`;
  }

  let newsHtml='';
  const src=pickBriefNews();
  if(src){
    const it=src.items[0];
    const text=typeof it==='object'?it.text:it;
    newsHtml=`<div class="brief-row brief-news">📰 ${esc(src.icon)} ${esc(text)}</div>`;
  }

  el.innerHTML=`
    <div class="brief-row brief-streak">🔥 <b>${streak}</b>日連続</div>
    ${promptHtml}
    ${newsHtml}
  `;
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
  const bc=(s)=>s==='green'?'bar-green':s==='yellow'?'bar-yellow':'bar-gray';
  document.getElementById('assets-grid').innerHTML=DATA.assets.map((a,i)=>{
    const on=functionedToday(a.id);
    const beh=assetBehavior(a.id);
    const st=beh.pct>=60?'green':beh.pct>0?'yellow':'gray';
    return `<div class="asset-card ${st} ${on?'on-today':''}">
      <button class="asset-del" onclick="event.stopPropagation();deleteAsset(${i})">×</button>
      <div class="asset-top" onclick="assetClick(${i})">
        <span class="asset-icon editable">${esc(a.icon)}</span>
        <div class="asset-name editable">${esc(a.name)}</div>
      </div>
      <div class="score-row">
        <div class="score-label">行動</div>
        <div class="score-bar-wrap"><div class="score-bar ${bc(st)}" style="width:${beh.pct}%"></div></div>
        <div class="score-val">${beh.days}/7日</div>
      </div>
      <button class="today-toggle ${on?'on':''}" onclick="event.stopPropagation();toggleAssetToday('${a.id}')">${on?'✓ 今日やった':'今日やった？'}</button>
    </div>`;
  }).join('');
}

function assetClick(i){
  if(editMode){ editAsset(i); return; }
  currentMandala=i; switchPage('mandala',document.querySelectorAll('.nav-btn')[1]);
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

// ── Mandala ──
const SG_ORDER = [0,1,2,3,null,4,5,6,7];

// 資産ごとの固有色（のっぺり解消・色分け）
const ASSET_COLORS = {
  finance:'#D3A813', health:'#77C566', intel:'#74ADFF', life:'#F2943C',
  relation:'#EC86CC', career:'#FE8674', system:'#00CBC3'
};
function assetColor(m){ return (m && ASSET_COLORS[m.id]) || 'var(--accent)'; }
// 文字・細い線に使うとき用の色（面には↑のassetColor＝--asset-*を使う。文字はこちら＝--ink-*）
// 2026-08-06：デザイン班のトークン(--ink-*)に接続。ASSET_COLORS自体は変えていない。
const ASSET_INK_VARS = {
  finance:'var(--ink-finance)', health:'var(--ink-health)', intel:'var(--ink-cognition)', life:'var(--ink-living)',
  relation:'var(--ink-relationships)', career:'var(--ink-work)', system:'var(--ink-systems)'
};
function assetInk(m){ return (m && ASSET_INK_VARS[m.id]) || 'var(--text-secondary)'; }

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
// タップ＝今日やった／もう一度タップ＝取り消し
function toggleTaskDone(ssIdx){
  const m=DATA.mandala[currentMandala];
  const sg=m.subGoals[currentSubGoal];
  const text=(sg.subSubGoals&&sg.subSubGoals[ssIdx])||'';
  if(!text.trim()) return; // 空のマスは記録できない
  if(!DATA.taskDone) DATA.taskDone={};
  const k=dkey(), key=taskKey(m.id,currentSubGoal,ssIdx);
  const arr=Array.isArray(DATA.taskDone[k])?DATA.taskDone[k]:[];
  const i=arr.indexOf(key);
  const adding=i<0;
  if(adding) arr.push(key); else arr.splice(i,1);
  if(arr.length) DATA.taskDone[k]=arr; else delete DATA.taskDone[k];
  if(adding) markAssetFunctioned(m.id); else unmarkAssetIfAuto(m.id);
  saveData();
  renderLayer2Grid();
  // ホーム側（継続カレンダー・資産カード・ブリーフ）も一緒に更新する
  renderStreak(); renderAssets(); renderBrief();
  if(adding) celebrate();
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

function renderMandala(){
  const strip=document.getElementById('asset-strip');
  strip.innerHTML=DATA.mandala.map((m,i)=>`
    <div class="strip-btn ${i===currentMandala?'active':''}" style="--mc:${assetColor(m)};--mc-ink:${assetInk(m)}" onclick="selectMandala(${i})">${esc(m.icon)} ${esc(m.name)}</div>`).join('');
  renderLayer1Grid();
  showLayer(1);
}

// サブゴールのテキストを「主タイトル＋補足」の二段で表示（見やすさ）
function sgHtml(text){
  const parts=(text||'').split('\n');
  const main=parts[0]||'';
  const sub=parts.slice(1).join(' ');
  return `<div class="m-sg-main">${esc(main)}</div>${sub?`<div class="m-sg-sub">${esc(sub)}</div>`:''}`;
}

// ══════════════════════════════════════════
//  見本の案内（はじめて開いた人だけに出る）
// ══════════════════════════════════════════
function renderSampleNotice(){
  const el=document.getElementById('sample-notice');
  if(!el) return;
  el.style.display = DATA.sampleMode ? 'block' : 'none';
}
// 「書きかえる」＝編集モードに入れて、マスをタップすれば文字を直せる状態にする
function startEditFromSample(){
  if(!editMode) toggleEditMode();
  const g=document.getElementById('mandala-grid-main');
  if(g && g.scrollIntoView) g.scrollIntoView({behavior:'smooth',block:'center'});
}
// 「この見本を使う」＝中身はそのまま、案内だけ消す
function keepSample(){
  DATA.sampleMode=false; saveData(); renderSampleNotice();
}
// 「全部消してまっさらにする」＝曼陀羅の文字だけ空にする
// （継続のきろく・生活リズム・やった記録には手をつけない）
function clearSample(){
  if(!confirm('曼陀羅に入っている見本の文字を、全部消してまっさらにします。よろしいですか？')) return;
  DATA.mandala.forEach(m=>{
    m.center='';
    (m.subGoals||[]).forEach(sg=>{ sg.text=''; sg.subSubGoals=Array(8).fill(''); });
  });
  DATA.sampleMode=false;
  saveData();
  renderSampleNotice(); renderLayer1Grid();
}

function renderLayer1Grid(){
  renderSampleNotice(); // 1階層目を描くたびに、見本の案内を出すか消すか決め直す
  if(currentMandala>=DATA.mandala.length) currentMandala=Math.max(0,DATA.mandala.length-1);
  const m=DATA.mandala[currentMandala];
  const grid=document.getElementById('mandala-grid-main');
  if(!grid) return;
  if(!m){ // 資産をすべて消したとき
    grid.innerHTML='';
    const b0=document.getElementById('mandala-core-banner');
    if(b0) b0.innerHTML='<div class="mcb-text">資産がありません。ホームの「＋ 資産を追加」から作れます</div>';
    return;
  }
  grid.style.setProperty('--mc', assetColor(m));
  grid.style.setProperty('--mc-ink', assetInk(m));
  const setCount=m.subGoals.filter(sg=>sg.text&&sg.text.trim()).length;
  // コアゴールは上のバナーに大きく表示（中心マスに押し込まない）
  const banner=document.getElementById('mandala-core-banner');
  if(banner){
    banner.style.setProperty('--mc', assetColor(m));
    banner.style.setProperty('--mc-ink', assetInk(m));
    banner.innerHTML=`<div class="mcb-label">${esc(m.icon||'🔷')} ${esc(m.name)} のコアゴール（タップで書きかえ）</div>
      <div class="mcb-text">${esc((m.center||'タップして、この資産で目指すことを書いてください').replace(/\n/g,' '))}</div>`;
  }
  grid.innerHTML=SG_ORDER.map((sgIdx)=>{
    if(sgIdx===null){
      return `<div class="m-cell center editable" onclick="editCoreGoal()">
        <div class="m-core-icon">${esc(m.icon||'🔷')}</div>
        <div class="m-core-cap">コアゴール</div>
        <div class="m-core-badge">${setCount}/8 設定</div>
      </div>`;
    }
    const sg=m.subGoals[sgIdx]||{text:'',subSubGoals:[]};
    const filled=sg.text&&sg.text.trim();
    // 進み具合＝「直近7日でやったタスクの数 ÷ 書いてあるタスクの数」（書いた数ではなく、やった数）
    const rec=subGoalRecent(m,sgIdx);
    const pct=rec.total?Math.round(rec.done/rec.total*100):0;
    const prog = rec.total>0
      ? `<div class="m-prog"><i style="width:${pct}%"></i></div><div class="m-prog-label">7日で ${rec.done}/${rec.total} 実行</div>`
      : (filled?`<div class="m-add">＋ タスク</div>`:'');
    return `<div class="m-cell ${filled?'filled':'empty'} editable" onclick="subGoalClick(${sgIdx})">
      <div class="m-sg-text">${filled?sgHtml(sg.text):'＋ サブゴールを書く'}</div>
      ${prog}
    </div>`;
  }).join('');
}

function renderLayer2Grid(){
  const m=DATA.mandala[currentMandala];
  const sg=m && m.subGoals ? m.subGoals[currentSubGoal] : null;
  // 開いていた資産やサブゴールが無くなっていたら、1階層目へ戻す（画面が止まらないように）
  if(!m || !sg){ currentSubGoal=null; showLayer(1); renderLayer1Grid(); return; }
  const grid=document.getElementById('mandala-grid-sub');
  grid.style.setProperty('--mc', assetColor(m));
  grid.style.setProperty('--mc-ink', assetInk(m));
  document.getElementById('detail-title').textContent=`${m.name} › ${(sg.text||'').replace(/\n/g,' ')}`;

  // 上に出す説明とまとめ（通常モードと編集モードで言うことを変える）
  const rec=subGoalRecent(m,currentSubGoal);
  const sum=document.getElementById('layer2-summary');
  if(sum){
    sum.innerHTML = rec.total
      ? `直近7日で <b>${rec.done}</b> / ${rec.total} 個 実行`
      : `まだタスクが1つも書かれていません。「まとめて入力」から始められます`;
  }
  const hint=document.getElementById('layer2-hint');
  if(hint){
    hint.textContent = editMode
      ? '編集モードです。マスをタップすると文字を直せます'
      : `やったマスをタップすると緑になります（もう一度タップで取り消し）。ホームの「${m.name}」にも印がつきます`;
  }

  grid.innerHTML=SG_ORDER.map((ssIdx)=>{
    if(ssIdx===null){
      const txt=sg.text||'サブゴール\n未設定';
      return `<div class="m-cell center editable" onclick="editSubGoal(${currentSubGoal})">
        <div class="m-core-text">${esc(txt).replace(/\n/g,'<br>')}</div>
        <div class="m-core-cap2">タップで書きかえ</div>
      </div>`;
    }
    const s=(sg.subSubGoals&&sg.subSubGoals[ssIdx])||'';
    const filled=!!(s&&s.trim());
    const on=filled&&taskDoneToday(m.id,currentSubGoal,ssIdx);
    const n7=filled?taskDoneCount(m.id,currentSubGoal,ssIdx,TASK_RECENT_DAYS):0;
    const state=!filled?'' :
      on ? `<div class="m-task-state on">今日やった</div>`
         : `<div class="m-task-state">${n7?`7日で${n7}回`:'タップで記録'}</div>`;
    return `<div class="m-cell ${filled?'filled':'empty'}${on?' done-today':''} editable" onclick="taskCellClick(${ssIdx})">
      ${on?'<div class="m-done-mark">✓</div>':''}
      <div class="m-sg-text">${filled?esc(s).replace(/\n/g,'<br>'):'＋ タスクを書く'}</div>
      ${state}
    </div>`;
  }).join('');
}

// マスをタップしたとき：ふだんは「今日やった」の記録、編集モード（と空マス）は文字を決める画面
function taskCellClick(ssIdx){
  if(currentSubGoal===null) return; // サブゴールを開いていないときは何もしない
  const m=DATA.mandala[currentMandala];
  const sg=m.subGoals[currentSubGoal];
  if(!sg) return;
  const s=(sg.subSubGoals&&sg.subSubGoals[ssIdx])||'';
  if(editMode || !s.trim()){ openTaskPicker(ssIdx); return; }
  toggleTaskDone(ssIdx);
}

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
  renderLayer2Grid();
}

// ══════════════════════════════════════════
//  まとめて入力（8マスを1画面で・貼り付けの振り分けつき）
// ══════════════════════════════════════════
function openBulkInput(){
  const m=DATA.mandala[currentMandala];
  const sg=m.subGoals[currentSubGoal];
  document.getElementById('bulk-label').textContent=`${m.name} ／ ${(sg.text||'').replace(/\n/g,' ')} の8マス`;
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
  renderLayer2Grid();
}

function selectMandala(i){ currentMandala=i; currentSubGoal=null; renderMandala(); }

function subGoalClick(i){
  const m=DATA.mandala[currentMandala];
  const sg=(m.subGoals&&m.subGoals[i])||{};
  // まだ何も書かれていないマスは、いきなり中へ入れても中身が空で困るので、
  // その場で名前を決める画面を出す（編集モードに入らなくても書ける）
  if(editMode || !(sg.text && sg.text.trim())){ editSubGoal(i); return; }
  currentSubGoal=i;
  renderLayer2Grid();
  showLayer(2);
}

function showLayer(n){
  document.getElementById('mandala-layer1').style.display=n===1?'block':'none';
  document.getElementById('mandala-layer2').style.display=n===2?'block':'none';
}
// 2階層目で「やった」を押した結果を1階層目の進捗に反映するため、戻るときに描き直す
function backToLayer1(){ currentSubGoal=null; renderLayer1Grid(); showLayer(1); renderStreak(); renderAssets(); renderBrief(); }

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

  document.getElementById('dash-streak').textContent=`🔥 いま ${calcStreak()} 日連続`;

  const barColor=s=>s==='green'?'var(--green)':s==='yellow'?'var(--yellow)':s==='red'?'var(--red)':'var(--text3)';
  document.getElementById('dash-asset-bars').innerHTML=DATA.assets.map(a=>{
    const beh=assetBehavior(a.id);
    const st=beh.pct>=60?'green':beh.pct>0?'yellow':'gray';
    return `<div class="dash-bar-row">
      <div class="dash-bar-icon">${esc(a.icon)}</div>
      <div class="dash-bar-name">${esc(a.name.replace('資産',''))}</div>
      <div class="dash-bar-wrap"><div class="dash-bar-fill" style="width:${beh.pct}%;background:${barColor(st)};"></div></div>
      <div class="dash-bar-val">${beh.days}/7日</div>
    </div>`;
  }).join('');

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
      <div class="dash-bar-icon">${s.icon}</div>
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
  renderDate(); renderWave(); renderStreak(); renderTasks(); renderAssets(); renderSummaries(); renderLifeLog(); renderBrief();
  renderHomeScreenGate(); renderHomeScreenWarn(); renderBackupNudge(); renderIntroGuide();
  if(document.getElementById('page-mandala').classList.contains('active')) renderMandala();
  if(document.getElementById('page-report').classList.contains('active')) renderDashboard();
}

// ══════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════
function switchPage(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`page-${id}`).classList.add('active');
  if(btn) btn.classList.add('active');
  else{ const idx=['home','mandala','report'].indexOf(id); document.querySelectorAll('.nav-btn')[idx]?.classList.add('active'); }
  if(id==='mandala'){ currentSubGoal=null; renderMandala(); }
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
  // 曼陀羅の2階層目を開いていたら、説明の文を今のモードに合わせて出し直す
  const l2=document.getElementById('mandala-layer2');
  if(l2 && l2.style.display!=='none' && currentSubGoal!==null) renderLayer2Grid();
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
  // 曼陀羅の2階層目を開いたまま書きかえたときに、1階層目へ戻されないようにする
  const l2=document.getElementById('mandala-layer2');
  const wasLayer2 = !!(l2 && l2.style.display!=='none' && currentSubGoal!==null);
  const keepSubGoal = currentSubGoal;
  if(modalCallback) modalCallback(val);
  if(modalIsMandala) DATA.sampleMode=false; // 曼陀羅を自分で書きかえたら、それはもう見本ではない
  saveData(); renderAll(); closeModal();
  if(wasLayer2 && DATA.mandala[currentMandala] && DATA.mandala[currentMandala].subGoals[keepSubGoal]){
    currentSubGoal=keepSubGoal;
    renderLayer2Grid();
    showLayer(2);
  }
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
  openModal(`コアゴール（${DATA.mandala[currentMandala].name}）`,DATA.mandala[currentMandala].center,v=>{ DATA.mandala[currentMandala].center=v; });
  modalIsMandala=true;
}
function editSubGoal(i){
  const m=DATA.mandala[currentMandala];
  if(!m.subGoals[i]) return;
  openModal(`サブゴール ${i+1}（${m.name}）`,m.subGoals[i].text,v=>{ m.subGoals[i].text=v; });
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
  currentSubGoal=null;
  showLayer(1);
  saveData(); renderAll();
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
      if(!confirm('今のデータを上書きして、このバックアップに戻しますか？')){ input.value=''; return; }
      localStorage.setItem('jibun-data',JSON.stringify(d));
      DATA=loadData();
      renderAll();
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
