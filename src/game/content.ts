import { assertPatterns } from "./patterns";

export type QuestionId = "morning" | "slang" | "y2003" | "body" | "drink" | "family";

export type Persona = {
  id: string;
  name: string;
  handle: string;
  tag: string;
  color: string;
  image: string;
  opens: readonly string[];
};

export type Inner = {
  id: string;
  codename: string;
  age: string;
  role: string;
  quote: string;
  bitten: string;
  join: string;
  stampEmoji: string;
  stamp: string;
  upload: string;
  leak: string;
  portrait: string | null;
  days: readonly [string, string, string];
  dm: Record<QuestionId, string>;
  archive: string;
  voice: string;
  cross: string;
};

export const QUESTIONS: { id: QuestionId; label: string; hint: string; ask: string }[] = [
  { id: "morning", label: "今朝のルーティン", hint: "起きた時間と朝ごはん", ask: "おはよう。今朝、何時に起きて何を食べた？" },
  { id: "slang", label: "界隈語で近況", hint: "言葉の使い方", ask: "『えぐい』『それな』『推せる』を使って、最近の近況を話して。" },
  { id: "y2003", label: "2003年の夏", hint: "その頃の記憶", ask: "急なんだけど、2003年の夏って何してた？" },
  { id: "body", label: "体の調子", hint: "最近の不調", ask: "最近、体の調子どう？正直に教えて。" },
  { id: "drink", label: "ご褒美ドリンク", hint: "配信のあと", ask: "配信が終わったあとのご褒美、何にしてる？" },
  { id: "family", label: "家族と配信", hint: "誰が見ているか", ask: "家族は、この配信を見てくれてる？" },
];

export type ChannelId = "zatsu" | "join" | "profile" | "media" | "stamp" | "react" | "dm";

export const CHANNELS: { id: ChannelId; name: string; topic: string }[] = [
  { id: "zatsu", name: "雑談", topic: "コラボの本番。口調は演技" },
  { id: "join", name: "入退室", topic: "参加、ボイス、監査ログ" },
  { id: "profile", name: "プロフィール", topic: "ステータス、自己紹介、ピン" },
  { id: "media", name: "画像", topic: "写真とファイル" },
  { id: "stamp", name: "スタンプ", topic: "気分スタンプ" },
  { id: "react", name: "リアクション", topic: "反応" },
  { id: "dm", name: "ダイレクト", topic: "調査の結果だけ、事実" },
];

export const DAYS = [
  { label: "1日目", title: "開幕トーク", topic: "意気込みとマイブーム" },
  { label: "2日目", title: "若者文化", topic: "今の言葉について" },
  { label: "3日目", title: "本音ナイト", topic: "配信のあと、本当は" },
] as const;

export const PERSONAS: Persona[] = [
  { id: "luna", name: "星乃ルナ", handle: "@luna_moon", tag: "月の歌姫", color: "#8eb4ff", image: "/cast/luna.jpg", opens: ["ふふ、", "ねぇ、", "あのね、"] },
  { id: "mike", name: "猫俣ミケ", handle: "@mike_nyan", tag: "にゃんこ", color: "#ffb15a", image: "/cast/mike.jpg", opens: ["にゃん、", "えへ、", "みて、"] },
  { id: "hina", name: "桜庭ヒナ", handle: "@hina_sakura", tag: "さくら", color: "#ff9ec4", image: "/cast/hina.jpg", opens: ["えへ、", "あの、", "こんにちは、"] },
  { id: "shia", name: "黒羽シア", handle: "@shia_night", tag: "闇の令嬢", color: "#c9a6ff", image: "/cast/shia.jpg", opens: ["ふん、", "聞いて、", "別に、"] },
  { id: "sora", name: "陽葵ソラ", handle: "@sora_sun", tag: "太陽っ娘", color: "#ffd36a", image: "/cast/sora.jpg", opens: ["やっほー、", "いくよ、", "ねぇ、"] },
  { id: "rei", name: "氷室レイ", handle: "@rei_ice", tag: "クール", color: "#9ad7ff", image: "/cast/rei.jpg", opens: ["……", "ええ、", "そう、"] },
  { id: "momo", name: "桃瀬モモ", handle: "@momo_peach", tag: "ギャル", color: "#ffb3c7", image: "/cast/momo.jpg", opens: ["ねーねー、", "聞いて、", "えー、"] },
  { id: "chihiro", name: "森崎チヒロ", handle: "@chi_mori", tag: "森の妖精", color: "#9dce8a", image: "/cast/chihiro.jpg", opens: ["うん、", "あの、", "ねぇ、"] },
  { id: "kaguya", name: "紅蓮カグヤ", handle: "@kaguya_red", tag: "魔王", color: "#ff7a7a", image: "/cast/kaguya.jpg", opens: ["ふふっ、", "聞きなさい、", "今日も、"] },
  { id: "yuki", name: "白兎ユキ", handle: "@yuki_usa", tag: "うさぎ", color: "#e7dcff", image: "/cast/yuki.jpg", opens: ["あのね、", "うさ、", "えっと、"] },
];

export const INNERS: Record<string, Inner> = {
  girl: {
    id: "girl",
    codename: "本人",
    age: "22",
    role: "デビュー8ヶ月の本当の女の子",
    quote: "加工してないのは、たぶんわたしだけ。",
    bitten: "",
    join: "招待ありがとう。授業のあと、いま来れた。",
    stampEmoji: "🥺",
    stamp: "これ、友だちがよく送ってくる顔。かわいいから置いとく。",
    upload: "部屋、こんな感じ。プリントが端から落ちそう。あとで甘いもの買いに出る。",
    leak: "プリンと、母のLINE",
    portrait: null,
    days: [
      "意気込みは、噛まずに名前を言うこと。最近のマイブームは振り付けの反復。地味だけど、今はそれが一番楽しい。",
      "若者文化って括られると、自分の日常みたいで恥ずかしい。えぐいときは、えぐいって言う。それな、は友だちにしか送らない。説明されると授業みたいで嫌だな。",
      "本音、昨日の練習で足をつった。配信自体は楽しい。終わったら甘いもの買って帰ろうかな。実家から『寝なさい』って来てた。",
    ],
    dm: {
      morning: "11時すぎまで二度寝。残ってたプリンと、ぬるいカフェラテ。立派な朝とは言えない。",
      slang: "昨日の練習、えぐいくらい足が重い。友だちには『それな、わたしも』って返した。この振付、自分では推せる。",
      y2003: "2004年生まれだから、その夏はまだいない。母に聞いても、お腹にいたかどうかも怪しいって。",
      body: "練習で足をつったのと、寝不足。腰が引退するとかは、まだ早いよ。肩こりは少しある。",
      drink: "配信のあとはコンビニスイーツ。お酒は強くないから、飲むとしても半分で終わる。",
      family: "実家のお母さんがアーカイブをたまに見て、『可愛い』じゃなくて『寝なさい』って送ってくる。",
    },
    archive: "デビュー2週目の雑談。噛んで笑って、母からの『寝なさい』を読み上げて照れてる。机の端にプリンの容器。",
    voice: "くしゃみで加工が落ちても声は高いまま。横にプリンの空き容器が映っていた。年齢をごまかした感じはない。",
    cross: "{name}の今日の入り、好きだった。ちょっと言葉が硬いときもあったけど、頑張ってる感じがした。",
  },
  it: {
    id: "it",
    codename: "情シス",
    age: "46",
    role: "社内システムの人",
    quote: "回線は安定させた。語尾だけが、不安定だった。",
    bitten: "通知が鳴ったと思ったら、回線ごと持っていかれた。こういう喰われ方は、仕様にない。",
    join: "参加しました。音声の遅延だけ、あとで見ます。",
    stampEmoji: "🖥️",
    stamp: "画面が二つあると安心する。了解の代わりに、これ。",
    upload: "いまの机。モニタが二つあると、配信が落ちてないか見やすい。",
    leak: "自宅サーバと、文字サイズ",
    portrait: "/cast/inner-it.jpg",
    days: [
      "最近のマイブームは、配信が落ちない環境づくり。お部屋のネット、地味に大事でしょ。",
      "若者の言葉、勉強したの。面白いと『草』。これは笑う意味で、植物じゃないからね。わたしの環境は、たぶん『えぐい』側。",
      "本音、深夜は目が乾く。画面の文字、こっそり大きくしてる。歳のせいには、まだしたくないんだけど。",
    ],
    dm: {
      morning: "5時起き。ブラックコーヒーと、昨日の作り置き。血圧を測ってからコメント返し。",
      slang: "近況はえぐい。自宅の機械が熱を持って。『それな』はそうだね、で合ってる？ 『推せる』は推すに可能、だよね。",
      y2003: "2003年の夏は、回線をADSLから変えるか悩んでた。ブログも書いてた。もちろんリアルタイム。",
      body: "ドライアイと肩甲骨。文字がにじむから、配信画面の文字サイズを上げてる。",
      drink: "配信後は糖質オフのビール。気の向かない日はノンアル。",
      family: "妻には『またパソコン？』って言われる。子どもは大学生で、配信の話はあまりしない。",
    },
    archive: "3ヶ月前の歌枠。サビの直前、低い声で『OBSが落ちた、再起動』。すぐに可愛い声へ戻している。",
    voice: "通知に驚いた拍子、作り声が落ちた。低い声で『OBS、再起動』。戻るまで、0.6秒。",
    cross: "{name}、たまに配信がもっさりするよね。ビットレートの話、してあげようかと思った。",
  },
  boss: {
    id: "boss",
    codename: "部長",
    age: "52",
    role: "部下の多い会社員",
    quote: "根回しは完璧だった。腰が裏切った。",
    bitten: "夜の一件、接待の延長かと思った。気づいたら、腰ごと持っていかれてた。",
    join: "遅れてすみません。直前まで別件でした。",
    stampEmoji: "🥃",
    stamp: "一日の終わりにこれを置く。接待のあと、気持ちがまとまる。",
    upload: "上着を掛けたところ。明日の朝は、ゴルフが入ってる。",
    leak: "承知、接待、腰",
    portrait: "/cast/inner-boss.jpg",
    days: [
      "意気込みは、まずは挨拶を丁寧に。最初が肝心なの。最近のマイブームは朝のストレッチ。",
      "なるほど、若者文化ね。『それな』は同意の相槌、メモにはそう書いてある。皆の言葉は下調べしてから使う主義。",
      "本音を言うと、長く座ると腰が重い。明日に響くのは姿勢の問題。早めに整体へ行かなきゃ。",
    ],
    dm: {
      morning: "6時。新聞と黒コーヒー、軽く背中を伸ばす。今朝は腰が重かった。",
      slang: "承知した。近況は『えぐい』案件続き。『それな』は相槌。『推せる』はポジティブ評価、という整理。",
      y2003: "2003年は役職が上がる直前で、夏は接待のゴルフが多かった。背中が棒みたいだった。",
      body: "腰と背中。整体に通ってる。階段だと膝も鳴る。",
      drink: "家ではハイボール。配信のあとも、結局そっち。",
      family: "妻と、社会人の息子。息子にはこの配信、内緒にしてる。",
    },
    archive: "半年前の雑談。『明日は朝から出張』と言いかけて、『朝活ヨガ』に直している。背景にゴルフバッグが一瞬。",
    voice: "咳払いが、完全に会議室。『失礼、喉が』のあとの声が、一段低い。",
    cross: "{name}は感じがいい。次の枠は事前に調整…連絡しておきたいタイプ。",
  },
  gamer: {
    id: "gamer",
    codename: "元ゲーマー",
    age: "44",
    role: "夜型の元廃人",
    quote: "コンティニューは、人生のほうにも欲しい。",
    bitten: "『もうちょっと』が最後だった。コンティニューは押せない。喰われたのは、君の方じゃない。",
    join: "入れた。直前までコントローラー持ってた。",
    stampEmoji: "🎮",
    stamp: "深夜の自分はこれ。カップ麺のタイマーと同時に押す。",
    upload: "光ってる机。麺のカップが、まだ残ってる。",
    leak: "レトロと、君",
    portrait: "/cast/inner-gamer.jpg",
    days: [
      "マイブームは、昔やったゲームを引っ張り出すこと。今の子はラグに厳しいよね。わたしも負けないようにする。",
      "『推せる』は、おすすめできる、で合ってる？ わたしが推せるのはどうしても昔の作品。君たちの流行りは、追いかけるよ。",
      "本音、朝まで起きてるのはもう無理。昔はパーティでオールナイトできた。今は2時間で目が死ぬ。",
    ],
    dm: {
      morning: "昼前に起きて、レトルトカレー。夜型が抜けない。",
      slang: "近況、古いゲームがえぐい。それな、君もそう思うでしょ。推せる作品は2000年代に集中してる。",
      y2003: "2003年の夏は据え置きの前から動かなかった。何時間やったか、今でも語れる。",
      body: "首と、マウスを持つ肩。長く座ると膝の裏がしびれる。",
      drink: "エナジーかビール。かわいく言うなら、大人のジュース。",
      family: "独身。実家の母がたまに心配するくらい。一緒に住む人は、いない。",
    },
    archive: "去年のゲーム枠。操作説明が異常に詳しく、最後に『この作品、発売日に店頭で買った』。",
    voice: "ミスった瞬間『くそっ』。可愛い声の皮が剥がれて、実況の低い声が漏れた。",
    cross: "{name}、反応が君たち世代で見てて楽しい。レトロは、やらなそう。",
  },
  baseball: {
    id: "baseball",
    codename: "元球児",
    age: "49",
    role: "社会人野球あがり",
    quote: "ヒーローインタビューは、一杯目だった。",
    bitten: "ナイターのあと、お持ち帰り。肩じゃなくて、本体の方を喰われた。",
    join: "ナイター見てから来た。延長だった。",
    stampEmoji: "🍺",
    stamp: "試合終わりの一杯。これがないと、一日が終わらない。",
    upload: "グラブと、今夜の缶。スコアは見ないでほしい。",
    leak: "ナイター、肩、ビール",
    portrait: "/cast/inner-baseball.jpg",
    days: [
      "意気込みは、最後まで声を出すこと。最近は朝に軽く体を動かしてる。終わったあとの一杯は、果汁にしておく。",
      "若者文化は新戦力ってところ。『えぐい』はすごい、でいいんだよね。監督目線で、みんなを応援したい。",
      "本音、肩が鳴る。昔やってたせい。夜のご褒美が一杯、って果汁の話だからね。念のため。",
    ],
    dm: {
      morning: "5時半に起きて素振り。朝食はご飯と味噌汁と卵。",
      slang: "近況は肩の張りがえぐい。それな、はベンチの相槌みたいなやつ。推せる選手は、どうしても昔の世代。",
      y2003: "2003年の夏は社会人の大会。延長の末に負けて、あとで缶ビールを何本も。",
      body: "肩、肘、膝。全部、音がする。翌日がつらい。",
      drink: "とりあえず生。本日のヒーローインタビューは、一杯目。",
      family: "妻と娘。娘にはパパの趣味で通してる。この見た目のことは、そのうち。",
    },
    archive: "春のコラボ。ハイタッチのあと、独り言で『甲子園みたいだな』。笑い声が低い。",
    voice: "笑いが『がはは』になり、慌てて『ふふっ』を上書き。地の笑いが勝っていた。",
    cross: "{name}は最後まで声が出てる。ベンチに欲しいガッツだ。",
  },
  family: {
    id: "family",
    codename: "お父さん",
    age: "47",
    role: "予定帳が先に埋まる人",
    quote: "上の子にアバターを見られて、心臓が止まった。",
    bitten: "『今夜、来る？』のあと、帰ってない。弁当だけ、机に残った。",
    join: "遅くなってすみません。家の用事が終わってから。",
    stampEmoji: "🍱",
    stamp: "明日の朝の弁当を詰めた。上の子が、彩りにうるさい。",
    upload: "冷蔵庫。絵が貼ってある。描いたのは、うちの子。",
    leak: "うちの子、弁当、老眼鏡",
    portrait: "/cast/inner-family.jpg",
    days: [
      "最近は予定帳と相談ばかり。みんなの時間に合わせるの、自分の生活との両立が大変で。",
      "『それな』って、うちの子も使ってた。同意するとき、だよね。わたしが言うと、まだ気恥ずかしい。",
      "本音、家の予定が先に埋まる。この楽しみは、家の者にまだうまく言えてない。",
    ],
    dm: {
      morning: "6時。自分の弁当を作ってコーヒー。人を送り出してから、がもう癖。",
      slang: "近況、送り迎えでえぐい。それな、は友達…いや、よく聞く。推せる参考書を、この前選んだ。",
      y2003: "2003年は結婚した翌年。夏は旅行の支払いが残ってて、そわそわしてた。",
      body: "腰痛と、近い字が見えにくい。配信のときだけ、眼鏡を外してる。",
      drink: "発泡酒が定位置。たまのワインは、妻と。",
      family: "妻と、中学生と小学生。上の子にアバターを見られて、心臓が止まった。",
    },
    archive: "子どもの日の配信。『うちは今日、運動会で』と言いかけて、『運動会っていいよね、一般論として』に修正。",
    voice: "宅配に出て『はい、鈴木です』。苗字と、加工なしの声が、まるごと漏れた。",
    cross: "{name}、うちの子が好きみたいで。同世代に見える。",
  },
  stock: {
    id: "stock",
    codename: "証券マン",
    age: "51",
    role: "数字が頭から離れない人",
    quote: "配信収益も、お小遣い勘定だった。",
    bitten: "夜食の請求が来た。支払ったのは配当じゃなくて、この身の方。",
    join: "数字を見てから来ました。今日は荒れてます。",
    stampEmoji: "📈",
    stamp: "画面がこの形の日は、夜まで落ち着かない。",
    upload: "時計と、数字の画面。配当の日は、少し気が緩む。",
    leak: "配当、老後、日経",
    portrait: "/cast/inner-stock.jpg",
    days: [
      "マイブームは、長く続けるための計画。毎日少しずつ、積み立てるみたいに配信したい。",
      "若者文化は、今のうちに触れておくもの。言葉も仕込み。『えぐい』はプラス意味、で合ってる？",
      "本音、将来のお金が頭から離れない。配信で入った分も、お小遣いみたいに数えちゃう。重い話、ごめん。",
    ],
    dm: {
      morning: "5時に経済ニュース。朝食はオートミール。数字を見てから、配信の準備。",
      slang: "近況、含み益がえぐい日があった。それな、は同意の成立。推せる対象は、長く配当が続くもの。",
      y2003: "2003年は営業の夏。相場が安くて、今思えば仕込み時だった。肌で覚えてる。",
      body: "目の疲れと、座りすぎの腰。健康診断の数字を、少し指摘された。",
      drink: "焼酎をお湯で薄める。ビールは糖が気になって。",
      family: "妻と、高校生の息子。教育費が一番大きい。配信はお小遣いの範囲。",
    },
    archive: "確定申告の時期の雑談。『これは経費で落ちるか』を、本気で3分解説している。",
    voice: "通知音に『お、来た』。株のアプリに反応した、低い独り言。",
    cross: "{name}は長く持てるタイプ。将来性は、買いだと思う。",
  },
  sauna: {
    id: "sauna",
    codename: "サウナ勢",
    age: "45",
    role: "整ってから話す人",
    quote: "整ったあとの一杯は、正義だった。",
    bitten: "整ったあとに、もう一軒。水風呂に戻る前に、喰われてた。",
    join: "整えてから来ました。まだ少しぼーっとしてる。",
    stampEmoji: "♨️",
    stamp: "三セット回した日の自分。水と、最後の一杯。",
    upload: "バッグの中。タオルと、サウナのあとの缶。",
    leak: "水風呂、プロテイン、腰サポーター",
    portrait: "/cast/inner-sauna.jpg",
    days: [
      "最近はあったかいお風呂でリセットするのがマイブーム。気分まで、整う…整えるね。",
      "『えぐい』は、水風呂みたいに刺激が強い感じ？ 言葉も温度差があるけど、あとで整うよね。",
      "本音、腰にサポーターがないと長い枠はつらい。あったかい場所に、頼りすぎてる。",
    ],
    dm: {
      morning: "朝いちで温冷交代。そのあとプロテインと鶏むね。これで整う。",
      slang: "近況、整いがえぐい。それな、は水風呂仲間の合言葉みたいなもの。推せる店は、席が空いてる店。",
      y2003: "2003年の夏は、まだ嵌る前。筋トレのあと居酒屋。体重は今より軽かった。",
      body: "腰をやってから、冷やす時間を短くしてる。膝も昔のスポーツのまま。",
      drink: "プロテイン。夜は帳消しにビール。整ったあとの一杯は、正義。",
      family: "離婚してる。娘には週末だけ会う。配信のことは、まだ言ってない。",
    },
    archive: "夏の配信、終了ボタンのあと。低い声で『整ったぁ』が0.5秒乗ったまま、枠が切れていない。",
    voice: "水の音のあと『ふぅ、整う』。加工なしの低い声が、はっきり残った。",
    cross: "{name}、姿勢がいい。ストレッチ…水風呂が合いそう。",
  },
  train: {
    id: "train",
    codename: "鉄道",
    age: "53",
    role: "ダイヤが頭にある人",
    quote: "終電に遅れる夢を、まだ見ている。",
    bitten: "終電は逃してない。途中の駅で、喰われて降車した。",
    join: "終電のひとつ前で帰って、いま着きました。",
    stampEmoji: "🚃",
    stamp: "この形を見ると、列番を確認したくなる。",
    upload: "部屋の一角。模型と、折った時刻表。",
    leak: "時刻、何番線、終電",
    portrait: "/cast/inner-train.jpg",
    days: [
      "開始はきっちり守りたい。19時59分に入ると、きれいだなって一人で思う。",
      "若者の会話は特急みたいに速い。わたしは各駅で聞いてる。『それな』は、ホームで聞く相槌だと思ってる。",
      "本音、終電に遅れる夢をまだ見る。時刻が頭から離れないのは、癖みたいなもの。",
    ],
    dm: {
      morning: "6時12分に起きる。朝食5分、支度は分単位。今日は在宅のダイヤ。",
      slang: "近況、新しい時刻改正がえぐい。それな、はホームの相槌。推せる車両は、窓が大きい旧いほう。",
      y2003: "2003年の夏は、周遊切符で山陰を一周した。何番線から乗ったか、今でも言える。",
      body: "膝と首。小さい文字の時刻が、最近読みにくい。",
      drink: "家ではビール。外出先の缶コーヒーが、原点。",
      family: "妻と二人。子どもはもう独立。休日は一緒にローカル線。アバターは、無言で見られた。",
    },
    archive: "鉄道の日の雑談。車両の年式とドア位置まで解説し、目が完全に本気。",
    voice: "外を電車が通った瞬間、車種をつぶやいた。声のトーンが、解説モード。",
    cross: "{name}の話す間、きれいだね。入りが早すぎない。",
  },
  otaku: {
    id: "otaku",
    codename: "現場勢",
    age: "42",
    role: "昔は並ぶ側だった人",
    quote: "僕…わたし、まだ混ざる。",
    bitten: "チェキのつもりが、僕の方が食卓だった。僕…おやすみ。",
    join: "チェキの整理が終わって、いま入りました。",
    stampEmoji: "📸",
    stamp: "推しの顔を押すと落ち着く。隣に、晩酌の缶も映る。",
    upload: "棚。フィギュアと、缶と、老眼鏡。混ぜないでほしかった。",
    leak: "握手会、遠征費、僕",
    portrait: "/cast/inner-otaku.jpg",
    days: [
      "最近のマイブームは振り付けの研究。空気のいい場所にいると、自分も頑張れる。",
      "言葉は説明した瞬間に冷える。使えるときだけ使うくらいがちょうどいい。最近の空気、普通に推せる。それな、ってなりたい夜もある。",
      "少しだけ本音。昔は握手会の列に並ぶ側で、遠征費をノートで管理してた。今は立つ側でいたい。僕…わたし、まだ混ざる。",
    ],
    dm: {
      morning: "10時起き。ヨーグルトとカフェラテ。出る前にストレッチ。",
      slang: "レッスンのあとがえぐい。友だちにそれなって送ったら、その振付推せるって返ってきた。",
      y2003: "2003年の夏は地方まで遠征して、握手の列に並んでた。予算オーバーで、あとがカップ麺。現場の記憶は全部残ってる。",
      body: "膝が長い列の名残で鳴る。近い文字がにじむ日がある。僕…わたしは、まだいける。",
      drink: "外では甘いドリンク。帰ったら缶ビール。趣味の出費を浮かせるために、お酒は安いやつ。",
      family: "母は配信を知らない。話せるのは、同じ頃に列へ並んでた友人だけ。",
    },
    archive: "握手会の話になった回。列の右側が写真向き、予算の切り方まで具体的。立つ側の知識ではない。",
    voice: "サビで力んだ瞬間、裏声が持たず低い声が半秒出た。すぐに戻して『僕じゃない、わたし』と小さく言い直した。",
    cross: "{name}、センター映えする。昔、スクリーンの向こうで見た気がする…褒め言葉だよ。",
  },
};

export function personaById(id: string): Persona {
  const persona = PERSONAS.find((item) => item.id === id);
  if (!persona) throw new Error(`unknown persona ${id}`);
  return persona;
}

export function speak(personaId: string, body: string, salt: number): string {
  const persona = personaById(personaId);
  const open = persona.opens[Math.abs(salt) % persona.opens.length] ?? "";
  return `${open}${body}`;
}

export function assertContent(): void {
  assertPatterns();
  const ids = Object.keys(INNERS);
  if (ids.length !== 10 || PERSONAS.length !== 10) throw new Error("cast size");
  if (!INNERS.girl) throw new Error("missing girl");
  const questions = QUESTIONS.map((item) => item.id);
  for (const id of ids) {
    const inner = INNERS[id];
    if (!inner || inner.days.length !== 3) throw new Error(`days ${id}`);
    for (const question of questions) {
      if (!inner.dm[question] || inner.dm[question].length < 8) throw new Error(`dm ${id} ${question}`);
    }
    if (!inner.cross.includes("{name}")) throw new Error(`cross ${id}`);
    if (id !== "girl") {
      if (!inner.portrait) throw new Error(`portrait ${id}`);
      const blob = [...inner.days, ...Object.values(inner.dm), inner.archive, inner.voice, inner.cross, inner.bitten, inner.join, inner.stamp, inner.upload].join("\n");
      if (blob.includes("プリン") || blob.includes("2004")) throw new Error(`girl tell leaked into ${id}`);
    }
  }
  const girl = INNERS.girl;
  if (!girl) throw new Error("missing girl");
  const girlPrivate = [...Object.values(girl.dm), girl.archive, girl.voice].join("\n");
  if (!girlPrivate.includes("プリン") || !girl.dm.y2003.includes("2004")) {
    throw new Error("girl confirmation missing");
  }
  for (const line of girl.days) {
    if (line.includes("プリン")) throw new Error("pudding in public chat");
  }
}
