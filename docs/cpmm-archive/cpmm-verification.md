# CPMMロジック検証

## 問題点の確認

### 1. 手数料の適用方法

**現在の実装:**
```move
// swap_x_for_y
let y_out_before_fee = (y_balance * x_in) / (x_balance + x_in);
let fee = (y_out_before_fee * pool.fee_bps) / 10000;
let y_out = y_out_before_fee - fee;
```

**問題:**
- 手数料を出力から差し引いているが、これでは定数積 `k = x * y` が正しく維持されない
- プールに入るのは `x_in` 全額だが、出るのは `y_out_before_fee - fee`
- これにより `k` が増加してしまう（手数料分だけプールが増える）

**正しい実装（Uniswap V2スタイル）:**
```move
// 手数料を入力に適用
// k = (x + Δx * (1 - fee)) * (y - Δy) = x * y
// 解くと: Δy = (y * Δx * (1 - fee)) / (x + Δx * (1 - fee))

let fee_factor = 10000 - pool.fee_bps; // 例: 500 bps = 9500 (95%)
let x_in_after_fee = (x_in * fee_factor) / 10000;
let numerator = y_balance * x_in_after_fee;
let denominator = x_balance + x_in_after_fee;
let y_out = numerator / denominator;
```

または、より一般的な実装:
```move
// k = (x + Δx) * (y - Δy) = x * y * 10000 / (10000 - fee_bps)
// これを解くと:
let numerator = y_balance * x_in;
let denominator = ((x_balance + x_in) * (10000 - pool.fee_bps)) / 10000;
let y_out = numerator / denominator;
```

### 2. 手数料がプールに残る仕組み

現在の実装では、手数料がプールに残りません。正しい実装では：
- 手数料分だけ `k` が増加する（手数料はプールに蓄積される）
- これにより流動性プロバイダーが手数料の一部を受け取れる（ただし、MVPではLPトークン未実装）

### 3. 数値例での検証

**初期状態:**
- x_balance = 1000 YES_COIN
- y_balance = 1000 USDO
- k = 1,000,000
- fee_bps = 500 (5%)

**シナリオ1: 100 USDOでYES_COINを購入**

**現在の実装（誤り）:**
1. x_in = 0 (YES_COINは入らない)
2. y_in = 100 USDO
3. y_out_before_fee = (1000 * 100) / (1000 + 0) = 100... あれ？これは間違い

実際には `swap_y_for_x` を呼ぶべき:
1. y_in = 100 USDO
2. x_out_before_fee = (1000 * 100) / (1000 + 100) = 90.9... ≈ 90 YES_COIN
3. fee = 90 * 500 / 10000 = 4.5 ≈ 4
4. x_out = 90 - 4 = 86 YES_COIN
5. 新しいk = (1000 + 100) * (1000 - 86) = 1,002,600 ≠ 1,000,000 ❌

**正しい実装:**
1. y_in = 100 USDO
2. fee_factor = 10000 - 500 = 9500
3. y_in_after_fee = (100 * 9500) / 10000 = 95 USDO
4. x_out = (1000 * 95) / (1000 + 95) = 86.76... ≈ 86 YES_COIN
5. 新しいk = (1000 + 100) * (1000 - 86) ≈ 1,002,600... あれ？

待って、これも間違っている。正しくは:

**正しい実装（再検証）:**
1. y_in = 100 USDO
2. fee_factor = 9500 / 10000
3. k_new = k_old * 10000 / 9500 (手数料分だけkが増える)
4. x_out = (x_balance * y_in) / (y_balance + y_in * 9500/10000)
   - より正確には: x_out = (x_balance * y_in) / ((y_balance + y_in) * 10000/9500)

**Uniswap V2の実際の実装:**
```solidity
amountOut = (amountIn * 997 * reserveOut) / ((reserveIn * 1000) + (amountIn * 997));
```
fee = 0.3% = 997/1000

これをSui Moveで実装すると:
```move
const FEE_DENOMINATOR: u64 = 10000;
let fee_factor = FEE_DENOMINATOR - pool.fee_bps; // 例: 10000 - 500 = 9500

// swap_y_for_x: USDO → YES_COIN
let numerator = x_balance * y_in * fee_factor;
let denominator = (y_balance * FEE_DENOMINATOR) + (y_in * fee_factor);
let x_out = numerator / denominator;
```

これを確認しましょう。

