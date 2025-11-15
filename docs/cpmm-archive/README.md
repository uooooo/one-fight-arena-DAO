# CPMM設計文書のアーカイブ

このフォルダには、CPMM予測市場の設計を検討する過程で作成された文書が保管されています。

## 文書一覧

- `cpmm-design.md` - 初期設計（全市場共通YES/NOコイン）
- `cpmm-redesign.md` - 再設計案（2独立プール）
- `cpmm-implementation-plan.md` - 実装計画
- `cpmm-final-design.md` - 最終設計案（市場ごとのTreasuryCap管理）
- `cpmm-correct-design.md` - 修正設計案（手数料を入力に適用）
- `cpmm-verification.md` - ロジック検証

## 最終的な設計

最新の正しい設計は `../cpmm-design.md` を参照してください。

**最終設計の要点:**
- **1 USDO → YES1 + NO1（固定配分）**
- **USDOはcollateralにロック**
- **Binary CPMM（YES ↔ NO交換のみ）**
- **YES/NOのmintは`split_usdo`のみ**（無担保YES/NOを防ぐ）
- **市場ごとの区別は`MarketPool`の`market_id`で管理**

