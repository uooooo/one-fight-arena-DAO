
前提
• ONE Championshipが日本の視聴者と新たな方法で関われる施策の考案・具現化。 
• ONE Championshipのアスリートがファンとより深く繋がる手助けとなる施策の考案・具現化。


---

ここでは、**「プロモーションの外部化」と「スポンサーの民主化」** を中核コンセプトにして、

> 「prediction market × 若手選手投資 × Suiの技術」

を統合した**完全版ドキュメント**を書きます。
この1本を読めば、ハッカソンの企画〜実装イメージ〜将来拡張まで、全部把握できる構成にします。

---

# 0. プロジェクト概要（TL;DR）

**プロジェクト名（仮）：*Open Corner on Sui***

> **ONEのプロモーションとスポンサーを「一部プロトコル化」し、
> ファンとクリエイターを巻き込んで PPV を伸ばす Sui 上のファン主導インフラ。**

キーワードは：

* **プロモーションの外部化**
  → マッチメイク・Fight Week・試合後の「どの物語を推すか」を
  **prediction market とファン行動データで外部に開く**

* **スポンサーの民主化**
  → 若手選手の「資金」と「露出」を
  **大口スポンサーだけでなくファン主導の Support Vault & Fan Token で支える**

この2つを **Sui のオブジェクトモデル + zkLogin + Sponsored Tx** で1つのプロトコルにまとめる。([Sui Documentation][1])

---

# 1. 背景と課題認識

## 1-1. 現状の構造

* **収益のコアは PPV**

  * ONEもUFCも基本的には「PPV / 放映権 ＋ スポンサー」でビジネスが成立

* 実際に PPV を買わせる要因は、

  * ① **強い選手が強い相手と戦う**
  * ② **試合前後のストーリー（ナラティブ）**

    * 因縁・復帰・異文化対決・世代交代 etc.

* **現状の問題**

  * プロモーションは主に「公式＋一部インフルエンサー」に集中している
  * スポンサーや高額ファイトマネーは「既に売れているスター」に集中
  * 若手・ローカル選手のストーリーや成長過程は**見えづらくファンも追いづらい**

あなたの前提を形式化すると：

- 目的関数：
    
    - **PPV売上**（短期：次の大会, 中長期：ONE全体のファンベース）
        
- レバー：
    
    - 大会前の接触頻度・没入度（Fight Week〜数週間前）
        
    - 試合後の“余韻”の延長（リマッチ・次の対戦カードへの関心）
        
    - 無名〜中堅選手に**ストーリーと資源を供給**する仕組み（若手投資）
        
- 制約：
    
    - 試合中インプレイ・ベッティングは既存サービスが強い → やらない
    - ONE × Sui の関係なので、**Suiでやる必然性**が求められる
    - 日本市場＋海外市場（英語圏/東南アジア）両方を見たい（日本と海外のインタラクションが生まれるとさらに良い）

## 1-2. 既存の近い事例

* UFC × Chiliz / Socios の**ファントークン**：

  * トークン保有者に投票権やVIP特典を与えることで、ファンエンゲージメントを強化している。([Chiliz][2])
* FANtium など、選手の**将来収益をトークン化**してファンが「投資」できるプラットフォーム：

  * 未来の賞金やスポンサー収入の一部をNFTとして販売し、ファンがその一部を受け取るモデル。([FANtium][3])

これらはそれぞれ「エンゲージメント」「収益共有」の文脈では強いが、

* **ONE × Sui × PPV** という文脈で、
* **prediction market（情報＆物語の集約）＋若手の成長ストーリー＋PPV販促**

を**一気に繋げるプロトコル**はまだ存在していない。

---

# 2. コンセプト：プロモーションの外部化 × スポンサーの民主化

## 2-1. コンセプト一文

> **“誰を推すか・どの試合を観たいか・どの物語を育てたいか” を
> ONEだけでなく、ファンとマーケットに開くことで、
> 若手選手の成長と PPV 売上を同時に底上げする。**

これを、2つのレイヤーで実現：

1. **Promotion Layer（プロモーションの外部化）**

   * プレ・ポスト専用 **prediction market & 行動データ**
   * 何が「バズるカード」なのかを、市場の価格や流動性で測る

2. **Sponsorship Layer（スポンサーの民主化）**

   * 若手選手ごとに **Support Vault + Fan Token/NFT**
   * ファイトマネー・関連予測市場収益・PPV紹介・グッズ売上の一部を原資に
     **“ファンスポンサー”を成立させる**

Sui上では、これらが**一つのオブジェクトグラフ**として繋がる：

* `FighterProfile`
* `SupportVault`
* `FanToken / NFT`
* `Event`（カード・計量・試合後）
* `Market`（prediction market）
* `PPVPass`（動的NFTの視聴パス）

---

# 3. コンポーネント詳細

## 3-1. Promotion Layer：プレ・ポスト専用 Prediction Market

### 3-1-1. どういう市場を立てるか

**① カード構成・マッチメイク系**

* 「A vs B が ONE 176 で組まれるか？」
* 「日本人選手 X が次のナンバーシリーズに出るか？」
* 「○月の日本大会のメインカードに X が来るか？」

→ **将来どのカードが見たいか**を、市場価格で定量化。
→ ONE側は「PPV 期待値が高いカード」を事前に察知できる。

---

**② Fight Week（計量・会見・フェイスオフ）系**

* 「A は計量を一発でパスするか？」
* 「記者会見で乱闘が起こるか？」
* 「フェイスオフでノータッチか、それとも接触があるか？」

→ 毎日マーケットが解決し、**Fight Weekをコンテンツ化**。
→ Youtuber / 切り抜き勢が市場変動をネタに動画を出せる。

---

**③ 試合後・キャリア系**

* 「X は1年以内にタイトルコンテンダーになるか？」
* 「次の試合はどの国で行われるか？」
* 「X vs Y のリマッチが組まれるか？」

→ 「この選手を追い続ける理由」を prediction market が作る。

---

### 3-1-2. 「プロモーションの外部化」としての意味

“ただのギャンブル”で終わらせない設計

* ONE 内部では、prediction market の価格・流動性・参加者数を

  * カード編成
  * プロモーション予算配分
  * 放映時間帯（日本向け/ローカル向け）

の判断材料に使える（"futarchy"-like）。

> 「X vs Y をやったらoneのPPVがNドルを超えるか/再生回数がN回以上になるか」
> 「試合の順番にすると、PPVがNドルを超えるか/再生回数がN回以上になるか」
> → 事前に市場でテストできる。

---

## 3-2. Sponsorship Layer：Support Vault & Fan Token/NFT

### 3-2-1. 基本構造

各選手について：

* `FighterProfile`

  * 名前・階級・所属・戦績・SNSなど

* `SupportVault`

  * ファンからの支援金プール（SUI or ステーブル）
  * 出金は用途と紐づく（遠征費・キャンプ費・フィジコ etc.）

* `SupporterNFT`（もしくは Fan Token）

  * 購入金額・タイミングに応じてレア度・枚数が変化
  * 権利は「**ファンクラブ＋成果連動の“期待値”**」くらいの言い方に留める（ハッカソン文脈）

FANtium のように「賞金の○%をNFTホルダーに配分する」というモデルは既に現実に存在し、アスリートの資金調達手段として成立しつつある。([FANtium][3])

ここでは **“ONE版FANtium + Prediction Market + PPV 連動”** に拡張するイメージ。

---

### 3-2-2. 原資の多様化（あなたが書いてくれた部分の整理）

**SupporterNFT / Fan Token の価値の源泉は「その選手に紐づいた売上」：**

* ファイトマネーの一部
* その選手関連の **予測市場の手数料（Fee）**
* 会場でのグッズ売上の一部
* その選手経由で購入された PPV（紹介リンクやアプリ経由など）の一部

→ **「人気が上がるほど、原資も増える」**ような設計にする。

また、将来的には：

* その選手からの収益を得る権利の一部を**二次流通可能なトークン**として扱うこともできる

  * ＝ いわば「半分 memecoin、半分収益シェアトークン」
  * 引退後も「ブランド」「コミュニティ」が残る

---

### 3-2-3. 若手選手にとっての意味

* ① お金のない時期（デビュー前〜数戦）からトレーニング資金を集められる
* ② 特定企業スポンサーに依存せず、**ファンを基盤にしたスポンサー構造**を持てる
* ③ 練習動画や遠征の様子を配信することで、

  * プロモーションにもなる
  * 「ちゃんと使ってる感」が出てファンの信頼も高まる

---

## 3-3. 両者を統合したエコシステム

### 3-3-1. ざっくり全体像（シンプルに）

1. 若手選手ごとに **Support Vault & SupporterNFT** を発行
2. その選手が絡む **Prediction Market** を多数展開
3. PPV と予測市場とグッズから、

   * 一部が SupportVault に流れる
   * 一部が Fan Token/NFT ホルダーへの還元原資になる
4. これらすべてを Sui 上のオブジェクトとして一体的に扱う

→ 「**市場で盛り上がる選手ほど、資金も集まり成長しやすくなる**」
→ **ONEにとっては、PPVが売れそうな選手を“外部プロモーション＋市場データ”で早期発見できる。**

---

# 4. ユーザーストーリー（1人の若手選手Xと1大会を例に）

選手 X：

* 20代前半、日本在住、戦績 3勝1敗、ONE 本戦へのステップアップを狙う若手

### 4-1. シーズン前

1. **X の FighterProfile & SupportVault をSui上で生成**
2. ONE公式＆コミュニティから「次世代有望株」として紹介
3. あなた（ユーザー）は、

   * 練習動画やインタビューを見て「この選手伸びそう」と感じる
   * 少額で SupporterNFT をミント（Social Login & ガスレス）

---

### 4-2. マッチメイクの噂〜カード確定まで

4. コミュニティで「X vs Y が見たい」というムーブメントが起こる
5. プロモーション層で：

   * `Market1`: 「X vs Y が ONE 176 で組まれるか？」が立ち上がる
   * あなたは「絶対見たい」ので **Yes にポイントを張る**
6. ONE 側は：

   * その市場の **価格（期待値）と流動性**を見て
   * 「このカードを組んだら PPV を日本で押しやすい」と判断
   * 実際にカードが組まれたら、Market1 は解決

---

### 4-3. Fight Week

7. 計量・会見・フェイスオフのたびに、

   * 「X は計量を一発でパスするか？」
   * 「会見でXが英語でアピールするか？」
     など細かい Market が立つ
8. あなたは毎日アプリを開き、

   * ポイントで予測したり
   * 市場のオッズを見ながら Twitter / X で語ったり
9. この間、Xは：

   * SupportVault の資金で海外スパーリングキャンプに行ったり
   * その様子を限定公開動画でSupporterNFT保有者に届ける

---

### 4-4. 試合当日〜試合後

10. 試合当日、あなたは PPV を購入（あるいはXの紹介リンク経由で購入）
11. 試合後：

    * Prediction Market は結果に基づいて決済
    * X が勝った場合、

      * 次の試合に向けて PPV・グッズ・マーケットFee の一部が SupportVault に入り、
      * SupporterNFT のメタデータが

        * 「勝利数 +1」
        * 「ランキング上昇」
          などで進化
12. あなたは：

    * 市場で得たポイントとNFTの「成長」を眺めながら
    * 次の試合・次のシーズンに向けて、さらに追い続けるモチベーションを得る

→ **若手選手 X のストーリーが、Prediction Market と SupportVault を通じて「継続的な触れどころ」を持つ。**

---

# 5. 技術アーキテクチャ（Sui らしさ）

ハッカソンなので、初期の実装ではなるべく複雑なzk loginとかは実装する必要ないかもです。

## 5-1. Sui の強み（要約）

* **オブジェクト中心のデータモデル**：
  資産や状態を「オブジェクト」として扱い、所有権・バージョン管理がしやすい。([Sui Documentation][1])
* **並列実行・高スループット・低レイテンシ**：
  独立オブジェクトを触るトランザクションは並列実行でき、
  テスト環境で 20万+ TPS・サブ秒ファイナリティも報告されている。([Chainstack][4])
* **zkLogin + Sponsored Transactions**：
  OAuth（Googleなど）ログインとガス代スポンサーを組み合わせることで、
  Web2レベルのUXでSuiトランザクションを実行できる。([Sui Documentation][5])
* **DeepBook 連携（DeFiオタク向け）**：
    - 将来的に本物の賭け／トレードまで広げるなら、SuiネイティブCLOBのDeepBookをマーケットエンジンにするというストーリーも語れる ([Backpack Learn](https://learn.backpack.exchange/articles/what-is-deepbook-a-decentralized-order-book-for-the-sui-ecosystem?utm_source=chatgpt.com "What is DeepBook? Sui's Native CLOB Powering High ..."))

→ **「大量の細かいマーケット」「選手ごとNFT」「PPVごとのPass」を全部オブジェクトとして扱いつつ、
Web2ライクなUXで触らせる」のに向いている。**

---

## 5-2. オブジェクト設計（ざっくり）

* `FighterProfile`

  * 基本情報（immutable 部分）
  * 戦績・ランキング・SNSリンク（mutable 部分）

* `SupportVault`

  * balance
  * revenue_sources: [fight_purse, ppv_referral, merch, market_fee, …]
  * withdraw_history

* `SupporterNFT`

  * owner
  * fighter_ref (FighterProfile)
  * tier（初期購入額・タイミングに応じたランク）
  * career_stats_snapshot（勝敗・タイトル etc.）

* `Event`

  * type: {card_announcement, press_conference, weigh_in, fight, post_fight}
  * fighter_refs
  * scheduled_time

* `Market`

  * event_ref (Event / FighterProfile / Card)
  * outcome_type: {YesNo, MultiOutcome, Range}
  * liquidity & pricing_params

* `PositionNFT`

  * owner
  * market_ref
  * side (Yes/No etc.)
  * amount

* `PPVPass`

  * viewer
  * event_card_ref
  * engagement_state（事前プロモ参加度に応じて進化する）

---

## 5-3. トランザクションフロー例

1. ユーザー（ファン）が zkLogin でログイン
2. Sponsored Tx でガスレスに

   * SupporterNFT ミント
   * Prediction Market へのベット（ポイントベース）
3. イベント終了時、ONE or オラクルが `Event` の結果を更新
4. `Market` が結果に応じて `PositionNFT` を決済（ポイント更新）
5. 連動して `SupportVault` にFeeを追加
6. ランキング更新時に `FighterProfile` & `SupporterNFT` をアップデート

---

# 6. 収益構造とインセンティブ整理

## 6-1. ONE にとって

* **PPV売上アップ**

  * 若手発掘〜Fight Week〜試合後まで、接触機会を増やす
  * prediction market のノイズの少ないシグナルから「売れるカード・国・時間帯」を推定

* **若手育成コストの一部外部化**

  * SupportVault 経由で、トレーニング費をファンから調達できる

* **スポンサー提案の材料**

  * 「この選手はこれだけ市場で話題になっていて、
    これだけファンがSupportVaultで支援している」という**データ**

---

## 6-2. 選手にとって

* 早期の安定資金
* 「自分をここまで押し上げてくれたファン」がオンチェーンでわかる
* 引退後も、SupporterNFT保有者向けに

  * セミナー
  * オンラインサロン
  * ジム訪問 etc.
    を展開する余地

---

## 6-3. ファンにとって

* **Prediction market** で

  * 自分の「読み」「感性」を試せる
  * 市場のオッズもコンテンツとして楽しめる

* **SupporterNFT** で

  * 早期に推した選手の成長を「カードの進化」で体験
  * 成果に応じたリワード（PPV割引・限定コンテンツ）を得られる

---

# 7. 規制・倫理メモ（ハッカソンでの語り方）

* 現実には、将来収益のトークン化は証券性が強くなり得るため、
  FANtium なども慎重に構成している。([FANtium][3])

* ハッカソン段階では、法的なリスクに関するスライドも作り、

  * 「**収益の権利**」よりも
  * 「**選手が任意に還元できる“ファン感謝プール”」
    ＋「PPV割引・コンテンツ解放などのユーティリティ」

  として説明するのが現実的。実装はそこを航路する必要はないです。

* 倫理面では、

  * 選手が「未来収入を売りすぎない」ようなガイドラインが本番では必要になり得る、
    と一言触れておくと大人受けが良い。

---

# 9. ハッカソンで実際に作るスコープ（現実ライン）

最後に、「この全部を24hでやる」のは無理なので、
**“実装部分”と“ビジョン部分”を切り分け**た方が良いです。

### 実装する（MVP）

* Sui Moveで：

  * `FighterProfile`, `SupportVault`, `SupporterNFT`
  * `Event`, `Market`, `PositionNFT`
* 1大会・1選手・2〜3マーケットに絞った
  **Fight Week + SupportVault MVP**
* フロント：

  * zkLogin（or簡易ウォレット）でログイン
  * Prediction market にポイントで参加
  * SupporterNFT をミントして表示
  * 結果入力 → Market 決済 → VaultにFee追加 をデモ

### アイデアだけ述べる（ピッチ用）

* PPV売上との連動（紹介リンク・視聴データとの接続）
* グッズ売上やリアル会場データとの統合
* 二次流通可能な「収益シェアトークン」としての将来形
* 上で書いた AI 拡張（マッチメイカー / ストーリーエンジン / Fighter Agent / Scouting Index）

---

これで、

* なぜこのプロジェクトが **ONEのPPVに効くのか**
* なぜ **Sui上でやる意味があるのか**
* なぜ **prediction market と選手育成NFTを統合するのが筋がいいのか**

まで、一通り説明できると思います。

[1]: https://docs.sui.io/concepts/object-model?utm_source=chatgpt.com "Object Model"
[2]: https://www.chiliz.com/ufc-and-chiliz-partner-to-launch-ufc-fan-token-on-socios-com/?utm_source=chatgpt.com "UFC® AND CHILIZ PARTNER TO LAUNCH UFC FAN ..."
[3]: https://www.fantium.com/?utm_source=chatgpt.com "FANtium | Invest in Sports"
[4]: https://chainstack.com/chainstack-introduces-support-for-sui/?utm_source=chatgpt.com "Chainstack introduces support for Sui"
[5]: https://docs.sui.io/concepts/cryptography/zklogin?utm_source=chatgpt.com "zkLogin | Sui Documentation"

