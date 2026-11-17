#!/usr/bin/env node
/* ============================================================
 * EcoLoop 验证工具 v2.0(FR-23 / FR-24 / T3.5;Node ≥ 16,零依赖)
 * https:无。数据与引擎唯一事实来源:仓库根目录 index.html(只读,绝不写入)。
 *
 * 架构(沿用 v1「单一事实来源」):
 *   1) 从 index.html 抽取 <script>,vm 沙箱 + 最小 DOM 桩,以 ?test
 *      启动 → T1 引擎用例 + T2 关卡标准解(引擎零改动的哨兵);
 *   2) T3 求解器(FR-23 升级版):分层迭代加深 + 全程置换表 + 解数统计。
 *      - 语义与 placeCard 完全一致:takeCard → push → computeResolution(turn)
 *        → 胜利判定(优先)→ 离开结算 → loseReason 剪枝(§3.4);
 *      - 状态键:剔除 dead 实体(不再参与任何判定)+ fat 动物的 satiety
 *        (fat 后不再进食、被吃恒 +2,故未来无关)+ 紧凑字符串(非 JSON);
 *      - 同键 ⇒ 同 turn/hand/queue ⇒ 同深度,故按层展开的 DAG 上可做
 *        路径计数(前向累加 ≡ 计划 §5.3 的反向归纳,见 solveDef 注释);
 *      - 不做镜像/旋转几何规范化:阅读序 (r,c) 参与平局裁决,镜像后胜负
 *        归属会互换,归并不安全(正确性 > 性能);
 *   3) T3.5 结构审计 --audit(计划 §5.4 A1–A9 + SOP⑤「错一格」冒烟);
 *   4) --selftest 差分自检:旧 BFS(参考实现,保留)+ 朴素路径枚举 +
 *      ≥200 个随机小盘,断言 optimal/解数一致(合入门槛);
 *   5) --bench:FR-23 性能判据实测(L8 新旧对比 / 6×6·5牌 / 7×7·6牌);
 *   6) 基线存档:baseline.md(机器可读块 + 人读表格)。
 *
 * 用法(详见 --help):
 *   node tools/verify.mjs              # 冒烟档(默认):T1+T2 全量 + T3 轻负载
 *   node tools/verify.mjs --full       # T3 全量(阶段收口/提交前)
 *   node tools/verify.mjs --levels 12,16 --audit
 *   node tools/verify.mjs --selftest / --bench / --save-baseline / --traps ...
 *
 * 本文件同时是库: EcoLoop_levelgen.mjs 复用其引擎装载与求解器,
 * 直接以命令行运行时才执行 main()。
 * ============================================================ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL_VERSION = 'EcoLoop_verify.mjs v2.0(FR-23/24+T3.5)';
const SPECIES_ORDER = ['grass', 'rabbit', 'fox', 'eagle', 'bug', 'frog'];
const SP_CODE = { grass: 'g', rabbit: 'r', fox: 'f', eagle: 'e', bug: 'b', frog: 'a' };
const NEED = { grass: 0, rabbit: 2, fox: 3, eagle: 4, bug: 2, frog: 3 };
const DEFAULT_BUDGET = 500000;      // 单关节点预算(计划 §2.3:超限=重设计)
const COUNT_CAP = 10000;            // 解数统计上限,超限输出 ≥10000
const BASELINE_FILE = path.join(ROOT, 'tests', 'baseline.md');
const BASELINE_RE = /<!--\s*ECOLOOP_T3_BASELINE\s*([\s\S]*?)-->/;

/* —— A9 纯追加哨兵:用户授权重设计后(2026-11-14)对 demo L1–L20 数据的存档指纹 —— */
const BASE_L1_20_HASH = "3fe29f24547f4bc2";   // 由 --print-hash 生成后固化
const BASE_E21_30_HASH = '54b1ebbcee61f71b'; // v0.12 preserved campaign block
const BASE_LEVELS_LEN = 30;                 // 构建时 LEVELS 长度(只增)

/* ============================================================
 * CLI
 * ============================================================ */
function parseLevelsArg(s) {
  const out = [];
  for (const part of String(s).split(',')) {
    const t = part.trim(); if (!t) continue;
    const n = parseInt(t, 10);
    if (!Number.isFinite(n) || n < 1) throw new Error(`--levels 含非法关号:${t}`);
    out.push(n);
  }
  return out;
}

function parseArgs(argv) {
  const o = {
    full: false, audit: false, selftest: false, bench: false,
    baseline: false, saveBaseline: false, help: false, printHash: false,
    levels: null, budget: DEFAULT_BUDGET, traps: null,
    seed: 20261111, solver: 'new',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const need = () => { if (i + 1 >= argv.length) throw new Error(`${a} 缺少参数值`); return argv[++i]; };
    switch (a) {
      case '--full': o.full = true; break;
      case '--audit': o.audit = true; break;
      case '--selftest': o.selftest = true; break;
      case '--bench': o.bench = true; break;
      case '--baseline': o.baseline = true; break;
      case '--save-baseline': o.saveBaseline = true; break;
      case '--print-hash': o.printHash = true; break;
      case '--help': case '-h': o.help = true; break;
      case '--levels': o.levels = parseLevelsArg(need()); break;
      case '--budget': o.budget = parseInt(need(), 10); break;
      case '--traps': o.traps = need(); break;
      case '--seed': o.seed = parseInt(need(), 10); break;
      case '--solver': o.solver = need(); break;
      default: throw new Error(`未知参数:${a}(--help 查看用法)`);
    }
  }
  if (o.solver !== 'new' && o.solver !== 'ref') throw new Error(`--solver 仅支持 new|ref,收到 ${o.solver}`);
  if (!Number.isFinite(o.budget) || o.budget < 1) throw new Error('--budget 须为正整数');
  return o;
}

const HELP = `
${TOOL_VERSION}
用法:node tools/verify.mjs [选项]

档位(FR-24):
  (无参数)   冒烟档(日常):T1+T2 全量 + T3 轻负载关,目标总耗时 < 2 分钟。
              T3 选关规则:全部 w≤5(即 5×5 及更小)关 + 每章 6×6 关抽样 3
              (首/中/尾)+ 不跑 7×7(仅 --full)。规则可在 selectLevels() 调整。
  --full      全量档:全部关卡 T3(阶段收口/提交前用)。
  --levels N,M  指定 1 起始的关号(逗号分隔,覆盖档位选择)。

验证:
  --audit     T3.5 结构审计(计划 §5.4):A1 零随机 / A2 par·解数·节点 /
              A7 intro 纪律 / A9 纯追加 / SOP⑤错一格冒烟(均阻断);
              A3/A4/A5/A8 输出风险点清单(半自动,不阻断);含基线比对。
  --selftest  差分自检(合入门槛):≥200 个随机小盘(3×3~4×4,2–3 张牌,
              含石头/预置 sat/预置 fat/fixed 关),断言新求解器与保留的
              旧 BFS optimal 一致、解数与朴素路径枚举一致;另含引擎语义
              对齐检查与 LEVELS 全量新旧比对。--seed 可换种子。
  --bench     FR-23 性能判据实测:L8 新旧求解器对比(节点/耗时)+
              合成 6×6·5 牌(<5s)+ 合成 7×7·6 牌(<30s)。

其他:
  --traps SPEC   A6 陷阱位验证(阻断)。SPEC 三种形式:
                 ① '37:[[2,2],[3,4]]'        第 37 关的两个陷阱格(1 起始关号)
                 ② '{"37":[[2,2],[2,2,"rabbit"]]}'  指定牌种(否则对全部可出牌种要求无解)
                 ③ traps.json 文件路径        内容同 ②(整表)
                 判定:首步把牌放到该格后,该局必须无解(任意后续深度)。
  --budget N     单关节点预算(放置模拟次数,默认 ${DEFAULT_BUDGET};超限该关记「超预算」并计入失败)。
  --solver X     new(默认,FR-23 升级版)/ ref(旧版 BFS,调试对照用,无解数列)。
  --baseline     只做与 baseline.md 的逐关比对(optimal/解数/节点;耗时仅供参考)。
  --save-baseline  把本次 T3 结果写入 baseline.md(建议配 --full)。
  --seed N       --selftest 随机种子(默认 20261111,可复现)。
  --print-hash   打印当前 demo L1–L20 数据哈希(用于固化 A9 哨兵常量)。
  --help         本帮助。

退出码:全部通过的检查项均为 0;任一失败(T1/T2 ✗、T3 optimal≠par/无解/超预算、
审计阻断项、selftest 失败、基线不一致)→ 1。

口径说明:
  节点 = 放置模拟次数(与 v1 工具一致口径,含计数所需的末层完整展开);
  解数 = 长度恰为 optimal 的互异胜利操作序列条数(路径条数,非终态个数;
         上限 ${COUNT_CAP},超限输出 ≥10000);
  耗时 = 单关求解器耗时(不含 vm 装载与 T1/T2)。
`.trim();

/* ============================================================
 * 引擎装载(单一事实来源:抽取 demo <script> 在 vm 沙箱内运行)
 * ============================================================ */
let engineCache = null;

function stub() {
  const f = function () {};
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'toString') return () => '[stub]';
      return stub();
    },
    apply: () => stub(),
    construct: () => stub(),
    set: () => true,
  });
}

export function loadEngine() {
  if (engineCache) return engineCache;
  const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('index.html 中未找到 <script>');
  const logs = [];
  const sandbox = {
    console: { log: (...a) => logs.push(a.join(' ')), warn() {}, error() {} },
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    URLSearchParams, location: { search: '?test' },   // ?test → 启动即跑 T1+T2 自检
    document: stub(), window: stub(), navigator: stub(),
  };
  vm.createContext(sandbox);

  /* 追加进同一脚本作用域:暴露引擎原语(S / idSeq 是模块级 let)。
   * place/snap/key/restore 保留 v1 原语义,供参考实现(旧 BFS)与差分使用。 */
  const API = `
;globalThis.__Eco = {
  LEVELS, SOLUTIONS, SPECIES, newGameState, computeResolution, isStone, entityAt, handCount,
  setS(v) { S = v; }, getS: () => S,
  canPlay,
  place(sp, r, c) {
    takeCard(sp);
    S.animals.push({ id: idSeq++, species: sp, r, c, satiety: 0, fat: false, fatSince: -1, dead: false });
    return computeResolution(S.turn);
  },
  isWin: () => allSettled(),
  applyLeaves(res) { for (const id of res.flies) { const a = S.animals.find(x => x.id === id); if (a) { a.dead = true; S.released++; } } },
  emptyCells, loseReason,
  snap() { return JSON.stringify({ animals: S.animals, hand: S.hand, queue: S.queue, turn: S.turn }); },
  key() { return JSON.stringify({ a: S.animals.map(x => [x.species, x.r, x.c, x.satiety, x.fat ? 1 : 0, x.dead ? 1 : 0, x.fatSince]).sort(), h: S.hand, q: S.queue, t: S.turn }); },
  restore(s) { const o = JSON.parse(s); S.animals = o.animals; S.hand = o.hand; S.queue = o.queue; S.turn = o.turn; },
};`;

  vm.runInContext(m[1] + API, sandbox, { filename: 'index.html#script' });
  const E = sandbox.__Eco;
  if (!E) throw new Error('引擎 API 暴露失败(__Eco 缺失)');
  engineCache = { E, logs, script: m[1] };
  return engineCache;
}

/* ============================================================
 * T3 求解器(FR-23):分层迭代加深 + 全程置换表 + 解数统计
 * ============================================================
 * 算法:
 *   - 按「层」迭代加深(depth=0,1,2,…),每层完整展开全部互异状态;
 *     某层展开中出现首个胜利 ⇒ optimal = 该层+1,「无更短解」由前序
 *     各层完整展开直接证明(IDDFS 的加深语义,层间经置换表去重,
 *     不重复展开,节点数 = 单次 DAG 展开);
 *   - 解数:同键状态 ⇒ 同 hand/queue/turn ⇒ 同深度,故展开构成分层
 *     DAG。对每条边 (u --move--> v) 记 g(v) = 从初始态到 v 的长度
 *     depth(v) 的操作序列条数(前向累加);胜利边贡献 g(u) 条最优序列
 *     ——与计划 §5.3 的「反向归纳 f(u)=Σ[win(v)?1:f(v)]」数学等价
 *     (同一 DAG 的两种路径计数方向),且无需存边表。
 *   - 状态语义与 placeCard 逐字对齐(胜利判定先于离开结算,失败剪枝
 *     同 §3.4-3/4);canPlay/takeCard/emptyCells/loseReason 全部走引擎
 *     同一份判定(见 makeStepper)。
 *
 * 状态键正确性论证(为什么可以剔除 dead 实体与 fat 动物的 satiety):
 *   dead 实体:entityAt/computeResolution/allSettled/emptyCells 均先验
 *     !dead(dead 从一切相邻判定消失、不占格;allSettled 的 dead 分支
 *     恒真),故未来演化只依赖存活集 —— 剔除后语义不变;
 *   fat 动物的 satiety:fat 后不再进食(结算跳过)、被吃时按 preyFat
 *     恒 +2(与 sat 无关)、离开只看 fatSince —— sat 未来无关;
 *   其余字段(species/r/c/satiety/fat/fatSince/hand/queue/turn)全部保留。
 *   不做镜像/旋转归并:阅读序 (r,c) 参与平局裁决,几何变换不安全。
 * ============================================================ */

export function handOfSeq(seq) {
  const h = {};
  for (const sp of seq) h[sp] = (h[sp] || 0) + 1;
  return h;
}

/* 由 LevelDef 构造求解器初始态(镜像 newGameState,含预置 fat/fatSince
 * 可选字段 —— runEngineCase 的 fat/fs 约定;LEVELS 关卡优先用引擎
 * newGameState(levelInitialState),此函数用于外来 LevelDef/--check/
 * levelgen/随机盘,两者一致性由 --selftest 断言)。 */
export function stateFromDef(def) {
  const fixed = def.order === 'fixed';
  const hand = fixed ? handOfSeq(def.seq) : Object.assign({}, def.hand);
  const stones = (def.stones || []).map(s => s.slice());
  const animals = (def.animals || []).map((d, i) => ({
    id: i + 1, species: d.sp, r: d.r, c: d.c,
    satiety: d.sat || 0,
    fat: !!d.fat,
    fatSince: d.fatSince !== undefined ? d.fatSince : (d.fs !== undefined ? d.fs : -1),
    dead: false,
  }));
  return { w: def.w, h: def.h, stones, animals, hand, queue: fixed ? def.seq.slice() : null, turn: 0 };
}

/* LEVELS[i] → 初始态(走引擎 newGameState,单一事实来源;lead 的
 * 预置 fat 支持落地后自动同步)。 */
export function levelInitialState(E, i) {
  E.setS(E.newGameState(i));
  const s = E.getS();
  return {
    w: s.w, h: s.h, stones: s.stones.map(x => x.slice()),
    animals: s.animals.map(a => ({
      id: a.id, species: a.species, r: a.r, c: a.c,
      satiety: a.satiety, fat: a.fat, fatSince: a.fatSince, dead: false,
    })),
    hand: Object.assign({}, s.hand), queue: s.queue ? s.queue.slice() : null, turn: s.turn,
  };
}

/* 紧凑状态键(见上方正确性论证;base36 单字符足以覆盖 r/c/sat/fs/turn) */
export function keyOf(st) {
  const parts = [];
  for (const a of st.animals) {
    if (a.dead) continue;
    const code = SP_CODE[a.species];
    const rc = B36(a.r) + B36(a.c);
    if (a.species === 'grass') parts.push(code + rc);                       // 草:不吃不饱,sat/fat 无关
    else if (a.fat) parts.push(code + rc + 'F' + B36(a.fatSince + 1));      // fat:sat 未来无关
    else parts.push(code + rc + B36(Math.min(a.satiety, 35)));
  }
  parts.sort();
  let hand = '';
  for (const sp of SPECIES_ORDER) hand += B36(Math.min(st.hand[sp] || 0, 35));
  const q = st.queue ? st.queue.map(sp => SP_CODE[sp]).join('') : '-';
  return B36(st.turn) + hand + q + parts.join('');
}
const B36 = n => n.toString(36);

/* —— 本地判定(与引擎逐一对齐;--selftest 断言一致性) —— */
function isWinState(st) {
  return st.animals.every(a => a.dead || a.fat || a.species === 'grass');   // ≡ allSettled
}
function emptyCellsOf(st) {
  const occ = new Uint8Array(st.w * st.h);
  for (const s of st.stones) occ[s[0] * st.w + s[1]] = 1;
  for (const a of st.animals) if (!a.dead) occ[a.r * st.w + a.c] = 1;
  const out = [];
  for (let r = 0; r < st.h; r++) for (let c = 0; c < st.w; c++) if (!occ[r * st.w + c]) out.push([r, c]);
  return out;                                                               // 行优先,与引擎 emptyCells 同序
}
function playableSpeciesOf(st) {
  if (st.queue) { const h = st.queue[0]; return (st.hand[h] || 0) > 0 ? [h] : []; }   // ≡ canPlay(fixed)
  const out = [];
  for (const sp of SPECIES_ORDER) if ((st.hand[sp] || 0) > 0) out.push(sp);
  return out;
}
function handTotalOf(hand) {
  let t = 0;
  for (const k in hand) t += hand[k];
  return t;
}

/* 一步放置(与 placeCard 语义逐字一致):
 * takeCard → push → computeResolution(turn) → 胜利判定(优先)→
 * 离开结算 → loseReason。返回子状态(已剪除 dead 实体)+ win/lose 标志。
 *
 * 性能:层内状态均为「结算后稳定态」(上一放置的 resolve 以整轮无进食收
 * 尾;applyLeaves 只减不增邻接)。故新放置若在第 1 轮不可能引发任何进食
 * (放置格四邻无「可吃它/它可吃」的活体),则整轮结算必无 events,唯一
 * 可能的变化是 leaves(全部存活 fat 飞走)——可跳过 computeResolution,
 * 直接 O(n) 结算。保守判定(只跳过确定无进食的情形),正确性不受影响。 */
const PREY_SET = {
  grass: new Set(), rabbit: new Set(['grass']), fox: new Set(['rabbit']),
  eagle: new Set(['fox', 'frog', 'rabbit']), bug: new Set(['grass']), frog: new Set(['bug']),
};
function quietTrigger(u, sp, r, c) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const d of dirs) {
    const rr = r + d[0], cc = c + d[1];
    if (rr < 0 || rr >= u.h || cc < 0 || cc >= u.w) continue;
    const hit = u.animals.find(a => a.r === rr && a.c === cc);
    if (!hit) continue;
    if (PREY_SET[hit.species].has(sp) && !hit.fat) return true;    // 邻居可吃它(吃者须非 fat)
    if (PREY_SET[sp].has(hit.species)) return true;                // 它可吃邻居(新放置必非 fat;fat 猎物亦可被吃)
  }
  return false;
}

export function makeStepper(E, opts = {}) {
  const keepRes = !!opts.keepRes;    // true 时 step 返回携带 events/flies(levelgen 演出分析用)
  const SObj = { lv: -1, w: 0, h: 0, stones: [], animals: [], hand: {}, queue: null, used: 0, released: 0, turn: 0, history: [] };
  let nextId = 1000000;    // 仅事件/flies 匹配用,不入状态键
  function step(u, sp, r, c) {
    E.setS(SObj);                                        // 每步重挂(防外部 setS 竞态,开销可忽略)
    SObj.w = u.w; SObj.h = u.h; SObj.stones = u.stones;
    const n = u.animals.length;
    const animals = new Array(n + 1);
    for (let i = 0; i < n; i++) { const a = u.animals[i];
      animals[i] = { id: a.id, species: a.species, r: a.r, c: a.c, satiety: a.satiety, fat: a.fat, fatSince: a.fatSince, dead: a.dead };
    }
    animals[n] = { id: nextId++, species: sp, r, c, satiety: 0, fat: false, fatSince: -1, dead: false };
    const hand = Object.assign({}, u.hand); hand[sp] = (hand[sp] || 0) - 1;
    const queue = u.queue ? u.queue.slice(1) : null;
    const turn = u.turn + 1;
    SObj.animals = animals; SObj.hand = hand; SObj.queue = queue; SObj.turn = turn; SObj.used = turn;

    let res;
    if (u.turn >= 1 && !quietTrigger(u, sp, r, c)) {
      /* 静默放置:无进食 ⇒ 无 events、sat/fat/位置不变;flies 按引擎原式
       * (fat && fatSince>=0 && fatSince<turn)——预置 fat(fatSince=-1 永不
       * 飞走)由此保持正确。深度 0(初始态)可能含未结算相邻对,不走此捷径。 */
      const flies = [];
      for (const a of animals) if (a.fat && a.fatSince >= 0 && a.fatSince < turn) flies.push(a.id);
      res = { events: [], flies };
    } else {
      res = E.computeResolution(turn);              // 引擎唯一结算入口
    }

    let win = true;
    for (let i = 0; i < animals.length; i++) { const a = animals[i];
      if (!a.dead && !a.fat && a.species !== 'grass') { win = false; break; } }

    let lose = false;
    if (!win) {
      if (res.flies && res.flies.length)
        for (const id of res.flies) { const a = animals.find(x => x.id === id); if (a && !a.dead) a.dead = true; }
      let m = 0;                                          // 剪除 dead:后续判定均不感知
      for (let i = 0; i < animals.length; i++) if (!animals[i].dead) animals[m++] = animals[i];
      animals.length = m;
      if (handTotalOf(hand) === 0) lose = true;          // §3.4-3 手牌尽
      else if (u.w * u.h - u.stones.length - animals.length === 0) lose = true;  // §3.4-4 盘满(离开之后;存活体各占一格、与石头不重叠 ⇒ O(1) 计数)
    }
    return keepRes ? { w: u.w, h: u.h, stones: u.stones, animals, hand, queue, turn, win, lose, res } : { w: u.w, h: u.h, stones: u.stones, animals, hand, queue, turn, win, lose };
  }
  return { step, SObj };
}

/* 解路径演出分析(levelgen --check / 演出关验收数据):
 * 逐步回放,统计每次放置的 eat/fat/leaves 数(FR-19:单结算 eat ≥4 触发
 * 超级连锁+慢动作;FR-26/计划 §3.2 的交付判据需要该分布)。 */
export function analyzeSolution(E, def, moves) {
  const stepper = makeStepper(E, { keepRes: true });
  let st = stateFromDef(def);
  const perStep = [];
  let legal = true, win = false, totalEats = 0, maxEats = 0;
  for (const [sp, r, c] of moves) {
    if (!playableSpeciesOf(st).includes(sp)) { legal = false; break; }
    if (!emptyCellsOf(st).some(x => x[0] === r && x[1] === c)) { legal = false; break; }
    const ch = stepper.step(st, sp, r, c);
    const eats = ch.res.events.filter(e => e.type === 'eat').length;
    const fats = ch.res.events.filter(e => e.type === 'fat').length;
    totalEats += eats; if (eats > maxEats) maxEats = eats;
    perStep.push({ move: [sp, r, c], eats, fats, leaves: (ch.res.flies || []).length, win: ch.win });
    if (ch.win) { win = true; break; }
    st = { w: ch.w, h: ch.h, stones: ch.stones, animals: ch.animals, hand: ch.hand, queue: ch.queue, turn: ch.turn };
  }
  if (!win) win = isWinState(st);
  return { legal, win, perStep, totalEats, maxEats, steps: perStep.length };
}

function pathOfRec(rec, seen) {
  const out = [];
  for (let r = rec; r && r.mv; r = r.pk ? seen.get(r.pk) : null) out.push(r.mv);
  return out.reverse();
}

/* 求解一个 LevelDef(或带 initial 状态的子问题)。返回:
 * { optimal, count, capped, path, nodes, nodesFirstWin, ms, fail? }  fail='budget' 即超预算。
 *
 * 记忆体策略:置换表记录 = { key, pk(父键), mv, g, st }。层一旦展开完毕,
 * 该层记录的 st(动物对象数组)即退役释放 —— 后续只需 key(去重)/pk+mv(路径
 * 回溯)/g(已在层构建期定型)。动物对象只存活于「当前展开层+构建层」两代。 */
export function solveDef(def, opts = {}) {
  const budget = opts.budget ?? DEFAULT_BUDGET;
  const E = opts.E ?? loadEngine().E;
  const initial = opts.initial ?? stateFromDef(def);
  const t0 = process.hrtime.bigint();
  const stepper = makeStepper(E);

  let nodes = 0;
  let nodesFirstWin = 0;      // 首胜时刻的节点数(与旧版「层内首胜即返」同口径,判据① 比对用)
  const search = () => {
    if (isWinState(initial)) return { optimal: 0, count: 1, capped: false, path: [], nodes, nodesFirstWin };   // 空序列即胜
    const seen = new Map();
    const key0 = keyOf(initial);
    const rec0 = { key: key0, pk: null, mv: null, g: 1, st: initial };
    seen.set(key0, rec0);
    let layer = [rec0];
    for (let depth = 0; layer.length; depth++) {
      const next = [];
      let wins = 0, capped = false, winPath = null;
      for (const rec of layer) {
        const u = rec.st;
        const cells = emptyCellsOf(u);
        if (!cells.length) continue;                     // 防御:盘满态不应入层(父层已判 lose)
        const sps = playableSpeciesOf(u);
        for (let si = 0; si < sps.length; si++) {
          const sp = sps[si];
          for (let ci = 0; ci < cells.length; ci++) {
            const r = cells[ci][0], c = cells[ci][1];
            if (++nodes > budget) return { fail: 'budget', nodes, optimal: -3, count: 0, capped: false, path: null };
            const ch = stepper.step(u, sp, r, c);
            if (ch.win) {
              if (wins === 0) nodesFirstWin = nodes;     // 本层首胜:旧版口径到此为止
              wins += rec.g;
              if (wins > COUNT_CAP) { wins = COUNT_CAP + 1; capped = true; }
              if (winPath === null) winPath = pathOfRec(rec, seen).concat([[sp, r, c]]);
              continue;
            }
            if (ch.lose) continue;                       // §3.4-3/4:判负死路
            if (wins > 0) continue;                      // 已见胜利 ⇒ 本层即末层,非胜子不再入层(计数已定 optimal)
            const k = keyOf(ch);
            const ex = seen.get(k);
            if (ex !== undefined) { ex.g += rec.g; if (ex.g > COUNT_CAP) { ex.g = COUNT_CAP + 1; } }
            else { const nr = { key: k, pk: rec.key, mv: [sp, r, c], g: rec.g, st: ch }; seen.set(k, nr); next.push(nr); }
          }
        }
        rec.st = null;                                    // 该层展开完毕:退役动物对象(键/pk/mv/g 保留)
      }
      if (wins > 0) return { optimal: depth + 1, count: wins, capped, path: winPath, nodes, nodesFirstWin };
      layer = next;
    }
    return { optimal: -1, count: 0, capped: false, path: null, nodes, nodesFirstWin };   // 无解
  };
  const result = search();
  result.nodes = nodes;
  result.nodesFirstWin = nodesFirstWin || nodes;
  result.ms = Number(process.hrtime.bigint() - t0) / 1e6;
  result.def = def;
  return result;
}

/* 解数展示口径:上限内精确;超限 → '≥10000' */
export function countStr(res) {
  if (!res || res.count == null || res.fail) return '—';
  if (res.optimal === 0) return '1(空)';
  return res.capped ? `≥${COUNT_CAP}` : String(res.count);
}

export const fmtPath = p => (p || []).map(([sp, r, c]) => `${sp}(${r},${c})`).join(' → ');

/* ============================================================
 * 参考实现:旧版朴素 BFS(v1 工具原样保留,--selftest 差分基准)
 * ============================================================ */
export function solveRefBFS(E, st0, capNodes = 400000) {
  E.setS({ lv: -1, w: st0.w, h: st0.h, stones: st0.stones, animals: st0.animals,
           hand: st0.hand, queue: st0.queue, used: 0, released: 0, turn: st0.turn, history: [] });
  if (E.isWin()) return { par: 0, path: [], nodes: 0 };
  const startSnap = E.snap();
  const seen = new Set([E.key()]);
  let layer = [{ snap: startSnap, path: [] }];
  let nodes = 0;
  while (layer.length) {
    const next = [];
    for (const node of layer) {
      E.restore(node.snap);
      const hand = E.getS().hand;
      const species = Object.keys(hand).filter(sp => E.canPlay(sp));
      if (!species.length) continue;
      const cells = E.emptyCells();
      for (const sp of species) {
        for (const cell of cells) {
          E.restore(node.snap);
          const res = E.place(sp, cell[0], cell[1]);
          nodes++;
          const path = node.path.concat([[sp, cell[0], cell[1]]]);
          if (E.isWin()) return { par: path.length, path, nodes };
          E.applyLeaves(res);
          if (E.loseReason()) continue;
          const k = E.key();
          if (!seen.has(k)) { seen.add(k); next.push({ snap: E.snap(), path }); }
          if (nodes > capNodes) return { par: -2, path: null, nodes };
        }
      }
    }
    layer = next;
  }
  return { par: -1, path: null, nodes };
}

/* ============================================================
 * 朴素路径枚举(解数 oracle:小盘全树、无去重;走旧式 snap/restore 通道,
 * 与新求解器实现路径独立)。只数「第 optimal 步恰好判胜」的序列。
 * ============================================================ */
export function countPathsNaive(E, st0, optimal, capNodes = 600000) {
  E.setS({ lv: -1, w: st0.w, h: st0.h, stones: st0.stones, animals: st0.animals,
           hand: st0.hand, queue: st0.queue, used: 0, released: 0, turn: st0.turn, history: [] });
  let count = 0, nodes = 0, shortWin = false;
  function dfs(snap, depth) {
    E.restore(snap);
    const hand = E.getS().hand;
    const species = Object.keys(hand).filter(sp => E.canPlay(sp));
    if (!species.length) return;
    const cells = E.emptyCells();
    for (const sp of species) {
      for (const cell of cells) {
        E.restore(snap);
        const res = E.place(sp, cell[0], cell[1]);
        nodes++;
        if (nodes > capNodes) throw { skipped: true, nodes };
        if (E.isWin()) {
          if (depth + 1 === optimal) count++;
          else if (depth + 1 < optimal) shortWin = true;   // 与 optimal 最小性矛盾 → 实现有 bug
          continue;
        }
        E.applyLeaves(res);
        if (E.loseReason()) continue;
        if (depth + 1 < optimal) dfs(E.snap(), depth + 1);
      }
    }
  }
  dfs(E.snap(), 0);
  return { count, nodes, shortWin };
}

/* ============================================================
 * 解路径回放(镜像 ?test T2 语义;错一格冒烟与 levelgen --check 共用)
 * ============================================================ */
export function replayDef(E, def, moves) {
  const stepper = makeStepper(E);
  let st = stateFromDef(def);
  let legal = true;
  for (const [sp, r, c] of moves) {
    if (!playableSpeciesOf(st).includes(sp)) { legal = false; break; }
    const cell = emptyCellsOf(st).find(x => x[0] === r && x[1] === c);
    if (!cell) { legal = false; break; }
    const ch = stepper.step(st, sp, r, c);
    if (ch.win) return { legal, win: true };
    st = { w: ch.w, h: ch.h, stones: ch.stones, animals: ch.animals, hand: ch.hand, queue: ch.queue, turn: ch.turn };
  }
  return { legal, win: isWinState(st) };
}

/* A6 陷阱位验证:首步把牌放到指定格后,该局必须无解。
 * 裸坐标 ⇒ 对初始所有可出牌种逐一要求无解;指定牌种 ⇒ 只验该牌种。 */
export function verifyTrapCells(def, traps, opts = {}) {
  const E = opts.E ?? loadEngine().E;
  const budget = opts.budget ?? DEFAULT_BUDGET;
  const st0 = stateFromDef(def);
  const results = [];
  const stoneSet = new Set((def.stones || []).map(s => s[0] + ',' + s[1]));
  const occupied = new Set((def.animals || []).map(a => a.r + ',' + a.c));
  for (const trap of traps) {
    const [r, c, spWant] = Array.isArray(trap) ? [trap[0], trap[1], trap[2] || null] : [trap.r, trap.c, trap.sp || null];
    const entry = { trap: [r, c, spWant], ok: true, notes: [] };
    if (stoneSet.has(r + ',' + c) || occupied.has(r + ',' + c)) {
      entry.ok = false; entry.notes.push('陷阱位本身非法(石头/预置占用)');
      results.push(entry); continue;
    }
    let sps;
    if (spWant) {
      if (!playableSpeciesOf(st0).includes(spWant)) {
        entry.ok = false; entry.notes.push(`${spWant} 当前不可出(fixed 队首约束)`);
        results.push(entry); continue;
      }
      sps = [spWant];
    } else {
      sps = playableSpeciesOf(st0);
      if (!sps.length) { entry.ok = false; entry.notes.push('初始无可出牌种'); results.push(entry); continue; }
    }
    const stepper = makeStepper(E);
    for (const sp of sps) {
      const ch = stepper.step(st0, sp, r, c);
      if (ch.win) { entry.ok = false; entry.notes.push(`${sp}(${r},${c}) 首步直接获胜`); continue; }
      if (ch.lose) { entry.notes.push(`${sp} → 首步判负(无解)`); continue; }
      const res = solveDef(def, { E, budget, initial: { w: ch.w, h: ch.h, stones: ch.stones, animals: ch.animals, hand: ch.hand, queue: ch.queue, turn: ch.turn } });
      if (res.fail) { entry.ok = false; entry.notes.push(`${sp} → 超预算(${res.nodes} 节点)`); }
      else if (res.optimal === -1) entry.notes.push(`${sp} → 无解 ✓`);
      else { entry.ok = false; entry.notes.push(`${sp} → 仍有解 optimal=${res.optimal}:${fmtPath(res.path)}`); }
    }
    results.push(entry);
  }
  return results;
}

/* —— 工具 —— */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function pickWeighted(rng, items, weights) {
  let sum = 0; for (const w of weights) sum += w;
  let x = rng() * sum;
  for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; }
  return items[items.length - 1];
}

/* ============================================================
 * --selftest 差分自检(合入门槛)
 * ============================================================ */
export function randBoard(rng, idx) {
  const w = 3 + (rng() < 0.5 ? 0 : 1), h = 3 + (rng() < 0.5 ? 0 : 1);
  const cells = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push([r, c]);
  const pool = shuffled(rng, cells);
  let p = 0;
  const stones = [];
  const nSt = rng() < 0.45 ? 1 + Math.floor(rng() * 2) : 0;
  for (let i = 0; i < nSt; i++) stones.push(pool[p++].slice());
  const animals = [];
  const cards = [];
  if (rng() < 0.55) {
    /* 结构化盘(提高可解率 → 强化解数差分覆盖):
     * 预置一只饥饿捕食者/待喂兔 + 手牌足以喂饱,混入噪声卡与石头。 */
    const kind = pickWeighted(rng, ['feedFox', 'feedEagle', 'feedRabbit'], [0.38, 0.22, 0.4]);
    if (kind === 'feedFox') {
      const [r, c] = pool[p++];
      animals.push({ sp: 'fox', r, c, sat: 1 + Math.floor(rng() * 2) });        // 1..2 /3
      cards.push('rabbit', 'rabbit');
      if (rng() < 0.5) cards.push(rng() < 0.5 ? 'grass' : 'rabbit');
    } else if (kind === 'feedEagle') {
      const [r, c] = pool[p++];
      animals.push({ sp: 'eagle', r, c, sat: 1 + Math.floor(rng() * 3) });      // 1..3 /4
      cards.push('rabbit', 'rabbit');
      if (rng() < 0.5) cards.push(rng() < 0.5 ? 'fox' : 'rabbit');
    } else {
      const [r, c] = pool[p++];
      animals.push({ sp: 'rabbit', r, c, sat: Math.floor(rng() * 2) });         // 0..1 /2
      if (animals[0].sat === 0) cards.push('grass', 'grass');
      else cards.push('grass');
      if (rng() < 0.5) { const [r2, c2] = pool[p++]; animals.push({ sp: 'fox', r: r2, c: c2, sat: 1 }); cards.push('rabbit', 'grass'); }
      else if (rng() < 0.4) cards.push('grass');
    }
    if (rng() < 0.25) { const [r2, c2] = pool[p++]; animals.push({ sp: 'grass', r: r2, c: c2, sat: 0 }); }  // 预置草(食物/障碍)
  } else {
    /* 纯随机盘(含大量无解/边界形态) */
    const nPre = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < nPre && p < pool.length; i++) {
      const [r, c] = pool[p++];
      const sp = pickWeighted(rng, ['grass', 'rabbit', 'fox', 'eagle', 'bug', 'frog'], [0.1, 0.22, 0.18, 0.14, 0.2, 0.16]);
      const need = NEED[sp];
      const sat = sp === 'grass' ? 0 : Math.floor(rng() * need);            // 0..need-1
      if (sp !== 'grass' && rng() < 0.12) {
        const fs = rng() < 0.5 ? -1 : 0;                                    // -1=永不离开;0=首次放置即离开
        animals.push({ sp, r, c, sat, fat: true, fatSince: fs });
      } else animals.push({ sp, r, c, sat });
    }
    const nHand = 2 + (rng() < 0.55 ? 1 : 0);
    for (let i = 0; i < nHand; i++) cards.push(pickWeighted(rng, ['grass', 'rabbit', 'fox', 'eagle', 'bug', 'frog'], [0.3, 0.18, 0.12, 0.1, 0.18, 0.12]));
  }
  const fixed = rng() < 0.3;
  const def = { name: `随机盘#${idx}`, w, h, par: 0, stones, animals };
  if (fixed) { def.order = 'fixed'; def.seq = shuffled(rng, cards); }
  else def.hand = handOfSeq(cards);
  return def;
}

/* 引擎语义对齐:随机走子沿途比对本地判定 vs 引擎判定 */
function alignmentCheck(E, st, mis) {
  E.setS({ lv: -1, w: st.w, h: st.h, stones: st.stones, animals: st.animals, hand: st.hand, queue: st.queue, used: 0, released: 0, turn: st.turn, history: [] });
  if (isWinState(st) !== E.isWin()) mis.push('isWin');
  const mine = emptyCellsOf(st).map(x => x.join(',')).join(';');
  const eng = E.emptyCells().map(x => x.join(',')).join(';');
  if (mine !== eng) mis.push('emptyCells');
  for (const sp of SPECIES_ORDER) {
    const m = (st.hand[sp] || 0) > 0 && (!st.queue || st.queue[0] === sp);
    if (m !== E.canPlay(sp)) mis.push(`canPlay(${sp})`);
  }
  const myLose = handTotalOf(st.hand) === 0 ? 'hand' : (emptyCellsOf(st).length === 0 ? 'full' : null);
  if (myLose !== E.loseReason()) mis.push('loseReason');
}

export function runSelftest(E, opts) {
  const rng = mulberry32(opts.seed >>> 0);
  const N = 240;
  const fails = [];
  let solvedCmp = 0, countCmp = 0, countSkipped = 0, alignStates = 0;
  const notes = [];

  for (let bi = 1; bi <= N; bi++) {
    const def = randBoard(rng, bi);
    // ① 语义对齐采样:初始态 + 随机走子沿途
    {
      let st = stateFromDef(def);
      for (let k = 0; k <= 3; k++) {
        const mis = [];
        try { alignmentCheck(E, st, mis); } catch (e) { mis.push('异常:' + e.message); }
        if (mis.length) fails.push(`随机盘#${bi} 第${k}步语义漂移:${[...new Set(mis)].join(',')}`);
        alignStates++;
        const sps = playableSpeciesOf(st), cells = emptyCellsOf(st);
        if (!sps.length || !cells.length) break;
        const sp = sps[Math.floor(rng() * sps.length)];
        const cell = cells[Math.floor(rng() * cells.length)];
        const stepper = makeStepper(E);
        const ch = stepper.step(st, sp, cell[0], cell[1]);
        if (ch.win || ch.lose) break;
        st = { w: ch.w, h: ch.h, stones: ch.stones, animals: ch.animals, hand: ch.hand, queue: ch.queue, turn: ch.turn };
      }
    }
    // ② optimal 差分:新求解器 vs 旧 BFS(参考实现)
    const rNew = solveDef(def, { E, budget: opts.budget });
    const rOld = solveRefBFS(E, stateFromDef(def), 400000);
    const oldPar = rOld.par === -2 ? '超预算' : rOld.par;
    if (rNew.fail) { fails.push(`随机盘#${bi}:新求解器超预算(${rNew.nodes})`); continue; }
    if (rNew.optimal !== rOld.par) { fails.push(`随机盘#${bi}:optimal 新=${rNew.optimal} 旧=${oldPar}`); continue; }
    solvedCmp++;
    // ③ 解数差分:新求解器 vs 朴素枚举(小盘全树)
    if (rNew.optimal > 0) {
      const sps = playableSpeciesOf(stateFromDef(def));
      const nCells = stateFromDef(def).w * stateFromDef(def).h - def.stones.length - def.animals.length;
      const est = Math.pow(Math.max(1, sps.length) * Math.max(1, nCells), rNew.optimal);
      if (est <= 300000) {
        try {
          const en = countPathsNaive(E, stateFromDef(def), rNew.optimal, 600000);
          if (en.shortWin) fails.push(`随机盘#${bi}:枚举发现短于 optimal 的胜利(最小性破坏)`);
          const same = rNew.capped ? en.count > COUNT_CAP : en.count === rNew.count;
          if (!same) fails.push(`随机盘#${bi}:解数 新=${countStr(rNew)} 枚举=${en.count}`);
          countCmp++;
        } catch (e) { if (e && e.skipped) countSkipped++; else throw e; }
      } else countSkipped++;
    }
    // ④ 样例解回放必胜
    if (rNew.path && rNew.path.length && !replayDef(E, def, rNew.path).win)
      fails.push(`随机盘#${bi}:样例解回放未获胜(${fmtPath(rNew.path)})`);
  }

  // ⑤ LEVELS 全量:stateFromDef ≡ newGameState;新旧 optimal;小关解数枚举;回放
  const handOf = L => L.order === 'fixed' ? handOfSeq(L.seq) : L.hand;
  for (let i = 0; i < E.LEVELS.length; i++) {
    const L = E.LEVELS[i];
    const k1 = keyOf(stateFromDef(L));
    const k2 = keyOf(levelInitialState(E, i));
    if (k1 !== k2) fails.push(`L${i + 1}:stateFromDef 与 newGameState 初始态不一致(预置 fat 语义漂移?)`);
    const init = levelInitialState(E, i);
    const rNew = solveDef(L, { E, budget: opts.budget, initial: init });
    const rOld = solveRefBFS(E, levelInitialState(E, i), 4000000);
    if (rNew.fail) fails.push(`L${i + 1}:新求解器超预算(${rNew.nodes})`);
    else if (rNew.optimal !== rOld.par) fails.push(`L${i + 1}:optimal 新=${rNew.optimal} 旧=${rOld.par}`);
    if (rNew.path && rNew.path.length && !replayDef(E, L, rNew.path).win)
      fails.push(`L${i + 1}:样例解回放未获胜`);
    if (!rNew.fail && rNew.optimal > 0 && rNew.optimal <= 3) {
      const sps = playableSpeciesOf(stateFromDef(L));
      const est = Math.pow(Math.max(1, sps.length) * Math.max(1, L.w * L.h - (L.stones || []).length - L.animals.length), rNew.optimal);
      if (est <= 300000) {
        try {
          const en = countPathsNaive(E, stateFromDef(L), rNew.optimal, 600000);
          const same = rNew.capped ? en.count > COUNT_CAP : en.count === rNew.count;
          if (!same) fails.push(`L${i + 1}:解数 新=${countStr(rNew)} 枚举=${en.count}`);
          countCmp++;
        } catch (e) { if (e && e.skipped) countSkipped++; else throw e; }
      }
    }
  }
  // ⑥ L11 谱面解数与 SPEC §3.7 记载比对(fixed 3 条 / free 26 条)
  const L11 = E.LEVELS[10];
  if (L11 && L11.order === 'fixed') {
    const rFix = solveDef(L11, { E, budget: opts.budget });
    if (!rFix.fail && rFix.count !== 3) fails.push(`L11(fixed) 解数 ${countStr(rFix)} ≠ SPEC §3.7 记载 3`);
    const freeDef = { ...L11, order: undefined, seq: undefined, hand: handOfSeq(L11.seq) };
    const rFree = solveDef(freeDef, { E, budget: opts.budget });
    if (!rFree.fail && rFree.count !== 26) fails.push(`L11(free) 解数 ${countStr(rFree)} ≠ SPEC §3.7 记载 26`);
    notes.push(`L11 谱面解数:fixed=${countStr(rFix)} / free=${countStr(rFree)}(SPEC §3.7:3 / 26)`);
  }
  return { fails, solvedCmp, countCmp, countSkipped, alignStates, notes, boards: N };
}

/* ============================================================
 * T3.5 结构审计(--audit)
 * ============================================================ */
function extractConstSegment(script, name) {
  const a = script.indexOf(`const ${name} = [`);
  if (a < 0) return null;
  const b = script.indexOf('\n];', a);
  if (b < 0) return null;
  return script.slice(a, b + 3);
}

export function l1_11_hash(E) {
  const n = Math.min(20, E.LEVELS.length);
  return createHash('sha256').update(JSON.stringify(E.LEVELS.slice(0, n))).digest('hex').slice(0, 16);
}

/* 计划 §3.2–3.5 逐关交付判据中的解数台账区间(警告级;G 组精确判据
 * 名单待 lead 补充后升级为阻断)。1 起始关号。 */
function countRangeOf(i) {
  const n = i + 1;
  if (n >= 31 && n <= 40) return null; // 依据机制证明，不用解数区间评价关卡质量。
  if (n <= 20) return null; // v0.12: 多解教程不以解数充当难度；机制证据另验。
  if (n === 46 || n === 48) return [1, 1];
  if (n === 22) return [2, 5];
  if (n === 27 || n === 38 || n === 41) return [1, 3];
  if (n === 29) return [2, 4];
  if (n === 36) return [3, 5];
  if (n === 39 || n === 21) return [2, 5];
  if (n === 47) return [1, 4];
  if (n >= 12 && n <= 20) return [3, 10];
  if (n >= 21 && n <= 30) return [2, 10];
  if (n >= 31 && n <= 40) return [2, 6];
  if (n >= 41 && n <= 50) return [1, 4];
  return null;
}

/* SOP⑤ 错一格:把 SOLUTIONS[i] 首步坐标改坏一格(列 +1,行末折行) */
function breakFirstStep(sol) {
  const out = sol.map(m => m.slice());
  const [sp, r, c] = out[0];
  let nc = c + 1, nr = r;
  if (nc >= 8) { nc = 0; nr = r + 1; if (nr >= 8) nr = 0; }   // 8=盘面尺寸上界,出界即非法位,同属「改坏」
  out[0] = [sp, nr, nc];
  return out;
}

/* A3/A4/A5/A8 半自动风险清单(不阻断) */
function semiAudit(def, resRow, i, lines, E) {
  const n = i + 1;
  const hand = def.order === 'fixed' ? handOfSeq(def.seq) : (def.hand || {});
  const handGrass = hand.grass || 0, handRabbit = hand.rabbit || 0;
  const aliveRabbit = def.animals.filter(a => a.sp === 'rabbit').length;
  const aliveGrass = def.animals.filter(a => a.sp === 'grass').length;
  const eagles = def.animals.filter(a => a.sp === 'eagle');
  const predators = def.animals.filter(a => a.sp === 'fox' || a.sp === 'eagle');
  const stoneSet = new Set((def.stones || []).map(s => s[0] + ',' + s[1]));
  const occSet = new Set(def.animals.map(a => a.r + ',' + a.c));
  const emptyOf = () => {
    const out = [];
    for (let r = 0; r < def.h; r++) for (let c = 0; c < def.w; c++)
      if (!stoneSet.has(r + ',' + c) && !occSet.has(r + ',' + c)) out.push([r, c]);
    return out;
  };
  const manh = (r, c, a) => Math.abs(r - a.r) + Math.abs(c - a.c);
  // A3 L8 捷径三条件
  for (const e of eagles) {
    const sat = e.sat || 0;
    if (sat >= NEED.eagle - 2 && (aliveRabbit > 0 || handRabbit > 0) && (aliveGrass + handGrass >= 2)) {
      const adjEmpty = emptyOf().some(([r, c]) => manh(r, c, e) === 1);
      if (adjEmpty) lines.push(`[A3] L${n} 鹰(${e.r},${e.c}) sat ${sat}/${NEED.eagle} ≥ need−2 · 可产肥兔 · 鹰旁有单饵发福位 → 捷径候选,人工复核`);
    }
  }
  // A4 发福位距鹰 < 2(空格或现草均可能是末口草位)
  if (aliveRabbit > 0 || handRabbit > 0) {
    for (const e of eagles) {
      const spots = [];
      for (let r = 0; r < def.h && spots.length < 4; r++) for (let c = 0; c < def.w && spots.length < 4; c++) {
        if (manh(r, c, e) < 2 && !stoneSet.has(r + ',' + c) && (!occSet.has(r + ',' + c) || (def.animals.find(a => a.r === r && a.c === c) || {}).sp === 'grass'))
          spots.push(`(${r},${c})`);
      }
      if (spots.length) lines.push(`[A4] L${n} 发福位候选 ${spots.join(' ')} 距鹰(${e.r},${e.c}) <2 格 → 需 L9 型豁免说明(台账留痕),人工复核`);
    }
  }
  // A5 兔牌出生位距最近捕食者 > 3
  if (handRabbit > 0 && predators.length) {
    const bad = [];
    for (const [r, c] of emptyOf()) {
      const d = Math.min(...predators.map(a => manh(r, c, a)));
      if (d > 3) bad.push(`(${r},${c})d${d}`);
    }
    if (bad.length) lines.push(`[A5] L${n} 兔牌可用位 ${bad.slice(0, 5).join(' ')}${bad.length > 5 ? ' …' : ''} 距最近捕食者 >3 格 → 接力关人工确认`);
  }
  if (handRabbit > 0 && !predators.length) lines.push(`[A5] L${n} 手牌有兔但盘上无捕食者 → 兔牌只能靠喂肥自解,人工确认草量`);
  // A8 样本解用牌频次
  if (resRow && resRow.path && resRow.path.length) {
    const used = {};
    for (const [sp] of resRow.path) used[sp] = (used[sp] || 0) + 1;
    const parts = [], orphan = [];
    for (const sp of SPECIES_ORDER) if (hand[sp] > 0) {
      parts.push(`${sp} ${used[sp] || 0}/${hand[sp]}`);
      if (!used[sp]) orphan.push(sp);
    }
    lines.push(`[A8] L${n} 样本解用牌:${parts.join(' · ')}${orphan.length ? `(未用牌种:${orphan.join(',')} — 孤儿牌风险,人工判读)` : ''}`);
  }
}

function parseTrapsSpec(spec, nLevels) {
  let obj = null;
  if (/\.json$/i.test(spec)) {
    const p = path.resolve(ROOT, spec);
    if (!existsSync(p)) throw new Error(`--traps 文件不存在:${spec}`);
    obj = JSON.parse(readFileSync(p, 'utf8'));
  } else {
    const s = String(spec).trim();
    try { obj = JSON.parse(s); } catch {
      const mm = s.replace(/\s/g, '').match(/^(\d+):(\[\[.*\]\])$/);
      if (mm) obj = JSON.parse(`{"${mm[1]}":${mm[2]}}`);
      else throw new Error(`--traps 无法解析:${spec}`);
    }
  }
  const map = new Map();
  for (const [k, v] of Object.entries(obj || {})) {
    const no = parseInt(k, 10);
    if (!Number.isFinite(no) || no < 1 || no > nLevels) throw new Error(`--traps 关号越界:${k}(现有 ${nLevels} 关)`);
    map.set(no - 1, (Array.isArray(v) ? v : []));
  }
  return map;
}

/* 基线存档(机器可读 + 人读) */
export function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) return null;
  const md = readFileSync(BASELINE_FILE, 'utf8');
  const m = md.match(BASELINE_RE);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function compareBaseline(base, t3rows, out) {
  const fails = [];
  if (!base || !Array.isArray(base.levels)) { out.push('基线文件存在但机器可读块缺失/损坏'); return fails; }
  let cmp = 0;
  for (const rec of base.levels) {
    const cur = t3rows.get(rec.i);
    if (!cur) continue;
    if (cur.fail) { fails.push(`基线比对 L${rec.i + 1}:当前跑失败(${cur.fail}),无法比对`); continue; }
    cmp++;
    if (cur.optimal !== rec.optimal) fails.push(`基线比对 L${rec.i + 1}:optimal ${cur.optimal} ≠ 基线 ${rec.optimal}`);
    const cntOk = rec.capped ? (cur.capped && cur.count > COUNT_CAP) || (cur.count === rec.count) : (!cur.capped && cur.count === rec.count);
    if (!cntOk) fails.push(`基线比对 L${rec.i + 1}:解数 ${countStr(cur)} ≠ 基线 ${rec.capped ? '≥' + COUNT_CAP : rec.count}`);
    if (cur.nodes !== rec.nodes) fails.push(`基线比对 L${rec.i + 1}:节点 ${cur.nodes} ≠ 基线 ${rec.nodes}`);
  }
  out.push(`基线比对:${cmp}/${base.levels.length} 关(optimal/解数/节点 逐关比对;耗时仅参考)`);
  return fails;
}

function saveBaselineFile(E, t3rows) {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const levels = [];
  for (const [i, r] of [...t3rows.entries()].sort((a, b) => a[0] - b[0])) {
    levels.push({
      i, no: i + 1, name: E.LEVELS[i].name, theme: E.LEVELS[i].theme || null,
      w: E.LEVELS[i].w, h: E.LEVELS[i].h, par: E.LEVELS[i].par,
      optimal: r.fail ? null : r.optimal, count: r.fail ? null : r.count, capped: !!r.capped,
      nodes: r.nodes, nodesFirstWin: r.nodesFirstWin ?? null, ms: Math.round(r.ms * 10) / 10, path: r.fail ? null : (r.path || []),
      fail: r.fail || null,
    });
  }
  const data = {
    tool: TOOL_VERSION, generatedAt: stamp, levelsCount: E.LEVELS.length,
    l1_11_hash: l1_11_hash(E), budget: DEFAULT_BUDGET, countCap: COUNT_CAP, levels,
  };
  const rows = levels.map(r =>
    `| L${r.no} | ${r.name} | ${r.theme || '基础'} | ${r.w}×${r.h} | ${r.par} | ${r.fail ? '—' : r.optimal} | ${r.fail ? '—' : (r.capped ? '≥' + COUNT_CAP : r.count)} | ${r.nodes} | ${r.nodesFirstWin ?? '—'} | ${r.ms} | ${fmtPath(r.path)} |`);
  const md = `# EcoLoop T3 基线存档(FR-23/24,计划 §5.3)

> 生成:\`node tools/verify.mjs --full --save-baseline\`(${TOOL_VERSION})· 时间 ${stamp} · 关卡数 ${E.LEVELS.length} · demo L1–L20 哈希 \`${data.l1_11_hash}\`
> 用途:改 verify/levelgen 工具后,跑 \`node tools/verify.mjs --audit\`(或 \`--baseline\`)与本文逐关比对 optimal/解数/节点;耗时仅参考(随机器波动)。
> 口径:节点 = 放置模拟次数(总节点,含解数统计固有的末层完整展开);寻优节点 = 层内首胜时刻的节点数,与 v1 工具口径可比(旧版不产解数列)。
> 解数 = 长度恰为 optimal 的互异胜利操作序列条数(路径条数,非终态个数;上限 ${COUNT_CAP},超限记 ≥${COUNT_CAP})。
> 机器可读块见下(勿改格式);\`--save-baseline\` 会整文件重写。

<!--ECOLOOP_T3_BASELINE
${JSON.stringify(data, null, 1)}
-->

## 人读表格

| 关 | 关名 | 章 | 盘面 | par | optimal | 解数 | 节点 | 寻优节点 | 耗时(ms) | 一条最优解 |
|---|---|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}
`;
  writeFileSync(BASELINE_FILE, md, 'utf8');
  return data;
}

/* ============================================================
 * --bench:FR-23 性能判据
 * ============================================================ */
/* 合成基准关 6×6·5 牌(判据②,L24/L26「走廊/接力」结构同型,按计划 §2.2
 * 实体配额做了致密化——空旷 6×6 的状态空间远超 50 万节点预算):
 * 双链:草×2 喂肥预置兔→狐A(1/3)吃肥兔变肥→鹰(0/4)经两枚兔饵吃肥狐;
 * 狐B(2/3) 吃最后一枚兔饵。时序窗口:狐A 在第 3 张(第 2 草)变肥,
 * 鹰须在其飞走前的下一放置(第 4 张)内完成 兔饵→肥狐 两吃。 */
const BENCH_66A = {
  name: '[基准]6×6·5牌·双链走廊A', w: 6, h: 6, par: 5,
  hand: { grass: 2, rabbit: 3 },
  animals: [
    { sp: 'eagle', r: 0, c: 0, sat: 0 },
    { sp: 'fox', r: 2, c: 2, sat: 1 },
    { sp: 'fox', r: 5, c: 5, sat: 2 },
    { sp: 'rabbit', r: 4, c: 1, sat: 0 },
  ],
  stones: [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 3], [3, 4], [4, 3], [4, 4], [5, 2], [5, 0], [4, 0], [2, 5], [3, 5], [0, 2], [1, 2], [1, 0], [2, 0]],
  tip: 'FR-23 判据②合成盘(两物种手牌)',
};
/* 同盘三物种手牌版(兔×2+狐×1,狐牌充当鹰的第一枚饵——「鹰也吃狐」) */
const BENCH_66B = {
  name: '[基准]6×6·5牌·双链走廊B', w: 6, h: 6, par: 5,
  hand: { grass: 2, rabbit: 2, fox: 1 },
  animals: [
    { sp: 'eagle', r: 0, c: 0, sat: 0 },
    { sp: 'fox', r: 2, c: 2, sat: 1 },
    { sp: 'fox', r: 5, c: 5, sat: 2 },
    { sp: 'rabbit', r: 4, c: 1, sat: 0 },
  ],
  stones: [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 3], [3, 4], [4, 3], [4, 4], [5, 2], [5, 0], [4, 0], [2, 5], [3, 5], [0, 2], [1, 2], [1, 0], [2, 0]],
  tip: 'FR-23 判据②合成盘(三物种手牌)',
};
/* 合成基准关 7×7·6 牌(判据③,L44「长征/接力/窗口」结构同型,实体配额 24):
 * 鹰(1/4) 兔饵+肥狐;狐A(1/3) 吃肥兔;狐B(1/3) 吃另一条草链肥兔。 */
const BENCH_77A = {
  name: '[基准]7×7·6牌·三链走廊A', w: 7, h: 7, par: 6,
  hand: { grass: 4, rabbit: 2 },
  animals: [
    { sp: 'eagle', r: 0, c: 0, sat: 1 },
    { sp: 'fox', r: 2, c: 2, sat: 1 },
    { sp: 'fox', r: 6, c: 6, sat: 1 },
    { sp: 'rabbit', r: 4, c: 1, sat: 0 },
    { sp: 'rabbit', r: 4, c: 5, sat: 0 },
  ],
  stones: [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 3], [3, 4], [4, 3], [4, 4], [5, 3], [5, 4], [6, 3], [6, 0], [5, 0], [4, 0], [6, 2], [0, 5], [1, 5], [2, 5], [3, 5], [1, 2], [0, 6], [1, 6], [2, 6], [3, 6], [3, 0], [4, 2], [6, 4], [5, 1], [0, 2]],
  tip: 'FR-23 判据③合成盘(两物种手牌)',
};
/* 同盘三物种版:fox 牌作鹰饵(0/4 需 4 口:狐牌+1、兔饵+1、肥狐+2) */
const BENCH_77B = {
  name: '[基准]7×7·6牌·三链走廊B', w: 7, h: 7, par: 6,
  hand: { grass: 4, rabbit: 1, fox: 1 },
  animals: [
    { sp: 'eagle', r: 0, c: 0, sat: 0 },
    { sp: 'fox', r: 2, c: 2, sat: 1 },
    { sp: 'fox', r: 6, c: 6, sat: 1 },
    { sp: 'rabbit', r: 4, c: 1, sat: 0 },
    { sp: 'rabbit', r: 4, c: 5, sat: 0 },
  ],
  stones: [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 3], [3, 4], [4, 3], [4, 4], [5, 3], [5, 4], [6, 3], [6, 0], [5, 0], [4, 0], [6, 2], [0, 5], [1, 5], [2, 5], [3, 5], [1, 2], [0, 6], [1, 6], [2, 6], [3, 6], [3, 0], [4, 2], [6, 4], [5, 1], [0, 2]],
  tip: 'FR-23 判据③合成盘(三物种手牌)',
};

function runBench(E, opts) {
  const out = [], fails = [];
  // 基准盘按「时间判据」评测,预算取 max(--budget, 150 万);50 万节点是
  // 入库关卡的 §2.3 纪律(默认档守门),合成盘超出部分只如实报告不判失败。
  const benchBudget = Math.max(opts.budget, 1500000);
  out.push(`==== [BENCH] FR-23 性能判据实测(合成盘预算 ${benchBudget};入库关仍按 --budget=${opts.budget} 守门)====`);
  // ① L8 同规模(5×5·4 牌):新旧对比(节点不增 / 耗时不增)
  //    口径:旧版层内首胜即返,不产解数;新工具的「寻优节点」= 首胜时刻节点数,
  //    与旧版同口径可比;「总节点」另含解数统计固有的末层完整展开(新增功能成本)。
  const L8 = E.LEVELS[7];
  if (L8 && L8.w === 5) {
    const initOld = levelInitialState(E, 7);
    const rOld = solveRefBFS(E, initOld, 4000000);
    const rNew = solveDef(L8, { E, budget: opts.budget, initial: levelInitialState(E, 7) });
    out.push(`① L8「${L8.name}」(5×5·4牌)旧 BFS:节点 ${rOld.nodes} / optimal ${rOld.par}`);
    out.push(`   新求解器:寻优节点 ${rNew.nodesFirstWin}(首胜口径)· 总节点 ${rNew.nodes}(含解数末层)· optimal ${rNew.optimal} · 解数 ${countStr(rNew)} · 耗时 ${rNew.ms.toFixed(0)}ms`);
    if (rNew.optimal !== rOld.par) fails.push(`BENCH①:L8 optimal 新旧不一致(${rNew.optimal} vs ${rOld.par})`);
    if (rNew.nodesFirstWin > rOld.nodes) fails.push(`BENCH①:L8 寻优节点增加(${rNew.nodesFirstWin} > ${rOld.nodes})`);
    else out.push(`   ✓ 判据① 寻优节点不增(${rNew.nodesFirstWin} ≤ ${rOld.nodes});总节点 ${rNew.nodes} 为解数统计新增成本(口径见上)`);
  } else out.push('① L8 缺失或非 5×5,跳过');
  // ②③ 合成盘
  const cases = [[BENCH_66A, 5, '②'], [BENCH_66B, 5, '②'], [BENCH_77A, 30, '③'], [BENCH_77B, 30, '③']];
  for (const [def, limit, tag] of cases) {
    const r = solveDef(def, { E, budget: benchBudget });
    if (r.fail) { fails.push(`BENCH${tag} ${def.name}:超预算(${r.nodes} 节点)`); continue; }
    out.push(`${tag} ${def.name}:optimal ${r.optimal}(par ${def.par}) · 解数 ${countStr(r)} · 节点 ${r.nodes} · 耗时 ${r.ms.toFixed(0)}ms(判据 < ${limit}s)`);
    if (r.optimal !== def.par) fails.push(`BENCH${tag} ${def.name}:optimal=${r.optimal} ≠ par=${def.par}(基准盘设计失效,需修盘)`);
    if (r.ms > limit * 1000) fails.push(`BENCH${tag} ${def.name}:耗时 ${r.ms.toFixed(0)}ms > ${limit}s`);
    if (r.nodes > opts.budget) out.push(`   注:节点 ${r.nodes} > 入库纪律 50 万(${'§'}2.3)——本合成盘按时间判据放行,实际 L44 级关卡设计需更致密或显式调 --budget`);
    out.push(`   一条解:${fmtPath(r.path)}`);
  }
  return { out, fails };
}

/* ============================================================
 * 报告与 main
 * ============================================================ */
function chaptersOf(E) {
  const chs = [];
  let cur = null;
  E.LEVELS.forEach((L, i) => {
    const t = L.theme || null;
    if (!cur || cur.theme !== t) { cur = { theme: t, from: i, levels: [] }; chs.push(cur); }
    cur.levels.push(i);
  });
  for (const ch of chs) {
    ch.name = ch.theme || (ch.from === 0 ? '基础' : '未标主题');
    ch.range = `L${ch.levels[0] + 1}–L${ch.levels[ch.levels.length - 1] + 1}`;
  }
  return chs;
}

function selectLevels(opts, E) {
  const n = E.LEVELS.length;
  if (opts.levels) {
    const sel = [...new Set(opts.levels)].filter(x => x <= n).map(x => x - 1).sort((a, b) => a - b);
    const dropped = opts.levels.filter(x => x > n).length;
    if (dropped) return { sel, note: `(--levels 中 ${dropped} 个关号 > 现有 ${n} 关,已忽略)` };
    return { sel, note: '' };
  }
  if (opts.full) return { sel: [...Array(n).keys()], note: '全量档' };
  const sel = new Set();
  for (let i = 0; i < n; i++) if (E.LEVELS[i].w <= 5) sel.add(i);          // 全部 5×5 及更小
  for (const ch of chaptersOf(E)) {                                        // 每章 6×6 抽样 3(首/中/尾)
    const six = ch.levels.filter(i => E.LEVELS[i].w === 6);
    if (six.length) for (const i of new Set([six[0], six[six.length - 1], six[Math.floor(six.length / 2)]])) sel.add(i);
  }
  const skipped7 = Array.from({ length: n }, (_, i) => i).filter(i => E.LEVELS[i].w >= 7).length;
  return { sel: [...sel].sort((a, b) => a - b), note: `冒烟档:5×5 全量 + 每章 6×6 抽样 3,跳过 7×7 ×${skipped7}(--full 跑)` };
}

function runT3(E, opts, sel) {
  const rows = new Map();
  for (const i of sel) {
    const L = E.LEVELS[i];
    if (opts.solver === 'ref') {
      const r = solveRefBFS(E, levelInitialState(E, i), opts.budget);
      rows.set(i, { optimal: r.par, count: null, capped: false, nodes: r.nodes, ms: 0, path: r.path, fail: r.par === -2 ? 'budget' : null });
    } else {
      const r = solveDef(L, { E, budget: opts.budget, initial: levelInitialState(E, i) });
      rows.set(i, { optimal: r.optimal, count: r.count, capped: r.capped, nodes: r.nodes, nodesFirstWin: r.nodesFirstWin, ms: r.ms, path: r.path, fail: r.fail || null });
    }
  }
  return rows;
}

function runAudit(E, ctx) {
  const { opts, t3rows } = ctx;
  const blocking = [], warns = [], lines = [];
  lines.push('==== [T3.5] 结构审计(--audit,计划 §5.4)====');
  // A1 零随机
  const seg = extractConstSegment(loadEngine().script, 'LEVELS');
  if (seg == null) blocking.push('A1:无法定位 LEVELS 数据段');
  else if (/Math\.random\s*\(|Date\.now\s*\(/.test(seg)) blocking.push('A1 零随机:LEVELS 数据段含 Math.random/Date.now');
  else lines.push('A1 零随机:LEVELS 数据段无 Math.random/Date.now ✓');
  const solSeg = extractConstSegment(loadEngine().script, 'SOLUTIONS');
  if (solSeg && /Math\.random\s*\(|Date\.now\s*\(/.test(solSeg)) warns.push('A1(附):SOLUTIONS 数据段含随机源(非阻断,但违反零随机纪律)');
  // A7 intro 纪律
  let introNew = 0, introBad = 0;
  E.LEVELS.forEach((L, i) => {
    if (L.intro) {
      if (Array.isArray(L.intro) || typeof L.intro !== 'object') { blocking.push(`A7:L${i + 1} intro 非单对象`); introBad++; }
      if (i >= 11) introNew++;
    }
  });
  if (introNew > 10) blocking.push(`A7 intro 纪律:L12 起新增 intro 卡 ${introNew} > 10`);
  else lines.push(`A7 intro 纪律:每关 ≤1 ✓ · 12 关起新增 ${introNew}/10 ✓`);
  // A9 纯追加
  const h = l1_11_hash(E);
  if (BASE_L1_20_HASH.startsWith('__')) lines.push(`A9 纯追加:哨兵常量未固化(当前哈希 ${h},用 --print-hash 固化)`);
  else if (h !== BASE_L1_20_HASH) blocking.push(`A9 纯追加:L1–L20 数据哈希 ${h} ≠ 存档 ${BASE_L1_20_HASH}`);
  else lines.push(`A9 纯追加:L1–L20 哈希一致 ✓(LEVELS 长度 ${E.LEVELS.length} ≥ ${BASE_LEVELS_LEN} ✓)`);
  if (E.LEVELS.length < BASE_LEVELS_LEN) blocking.push(`A9:LEVELS 长度 ${E.LEVELS.length} < 存档 ${BASE_LEVELS_LEN}(只增被破坏)`);
  const eHash = createHash('sha256').update(JSON.stringify(E.LEVELS.slice(20,30))).digest('hex').slice(0,16);
  if(eHash !== BASE_E21_30_HASH)blocking.push('A9 E21–30 数据指纹变动');
  else lines.push('A9 E21–30 保留指纹一致 ✓');
  // 初始态一致性(防预置 fat 语义漂移:stateFromDef vs newGameState)
  for (let i = 0; i < E.LEVELS.length; i++) {
    if (keyOf(stateFromDef(E.LEVELS[i])) !== keyOf(levelInitialState(E, i))) {
      blocking.push(`L${i + 1}:stateFromDef 与 newGameState 初始态不一致(预置 fat/fatSince 语义漂移,T2 与 T3 在测不同的盘)`);
      break;
    }
  }
  // SOP⑤ 错一格冒烟(全部关,重放式 T2)
  let wcOK = 0, wcAll = 0;
  for (let i = 0; i < E.LEVELS.length; i++) {
    const sol = E.SOLUTIONS[i];
    if (!sol || !sol.length) { warns.push(`错一格:L${i + 1} 无 SOLUTIONS,跳过`); continue; }
    wcAll++;
    // Multiple legal tutorial routes are intentional. Find an actual failing adjacent perturbation.
    let found=false;
    for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]) { const broken=sol.map(m=>m.slice());broken[0][1]+=dr;broken[0][2]+=dc;const rb=replayDef(E,E.LEVELS[i],broken);if(!rb.legal||!rb.win){found=true;break;} }
    if(found)wcOK++;else blocking.push('L'+(i+1)+': 相邻扰动全可通关，请人工复核');
  }
  lines.push(`SOP⑤ 错一格冒烟:${wcOK}/${wcAll} 关改坏首步后正确报 ✗ ✓`);
  // A2 par/解数/节点(直读 T3;区间先警告,G 组精确判据名单待补)
  for (const [i, row] of t3rows) {
    const L = E.LEVELS[i], n = i + 1;
    if (row.fail) continue;                                   // 超预算已在 T3 失败
    if (row.optimal !== L.par) continue;                      // par≠optimal 已在 T3 失败(A2 阻断项同源)
    if (row.nodes > opts.budget) continue;
    const range = countRangeOf(i);
    if (range) {
      const cnt = row.capped ? COUNT_CAP + 1 : row.count;
      if (cnt < range[0] || cnt > range[1])
        warns.push(`A2 L${n}:解数 ${countStr(row)} 出台账目标区间 [${range[0]},${range[1]}](${range[0] === range[1] ? '精确判据,名单待补,先警告' : '警告级'})`);
    }
  }
  lines.push(`A2 par/解数/节点:${t3rows.size} 关直读 T3(par≠optimal / 超预算 → 阻断,见 T3 段;解数区间 → 警告 ${warns.filter(w => w.startsWith('A2')).length} 条)`);
  // A6 陷阱位验证(阻断)
  if (opts.traps) {
    const trapMap = parseTrapsSpec(opts.traps, E.LEVELS.length);
    for (const [i, traps] of trapMap) {
      const res = verifyTrapCells(E.LEVELS[i], traps, { E, budget: opts.budget });
      for (const t of res) {
        if (t.ok) lines.push(`A6 L${i + 1} 陷阱位 (${t.trap[0]},${t.trap[1]})${t.trap[2] ? '/' + t.trap[2] : ''}:首步放此位后无解 ✓(${t.notes.join(';')})`);
        else blocking.push(`A6 L${i + 1} 陷阱位 (${t.trap[0]},${t.trap[1]})${t.trap[2] ? '/' + t.trap[2] : ''} 验证失败:${t.notes.join(';')}`);
      }
    }
  } else lines.push('A6 陷阱位:未指定 --traps,跳过(指定时为阻断级)');
  // A3/A4/A5/A8 半自动风险清单(全部关,不阻断)
  const semi = [];
  for (let i = 0; i < E.LEVELS.length; i++) semiAudit(E.LEVELS[i], t3rows.get(i) || null, i, semi, E);
  if (semi.length) { lines.push('半自动风险点清单(不阻断,人工复核后记台账):'); lines.push(...semi.map(s => '  ' + s)); }
  else lines.push('半自动风险点清单:无(A3/A4/A5/A8 均未触发)');
  // 基线比对
  const base = loadBaseline();
  if (base) {
    const bnotes = [];
    const bfails = compareBaseline(base, t3rows, bnotes);
    lines.push(...bnotes.map(s => '  ' + s));
    blocking.push(...bfails);
  } else lines.push('基线比对:无 baseline.md 存档(--full --save-baseline 生成),跳过');
  return { blocking, warns, lines };
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(String(e.message || e)); console.error('--help 查看用法'); return 1; }
  if (opts.help) { console.log(HELP); return 0; }

  const { E, logs, script } = loadEngine();
  if (opts.printHash) {
    console.log(`L1–L20 数据哈希(sha256 前 16 位):${l1_11_hash(E)}`);
    console.log(`LEVELS 长度:${E.LEVELS.length}`);
    console.log('用法:把上面的哈希填入本文件 BASE_L1_20_HASH 常量,固化 A9 纯追加哨兵。');
    return 0;
  }

  const failures = [];
  const t3rowsAll = new Map();     // 供 --save-baseline / 审计
  const sections = [];
  const t0 = process.hrtime.bigint();

  /* —— T1+T2:?test(引擎哨兵) —— */
  const selfOK = !logs.some(l => l.includes('✗'));
  if (!selfOK) failures.push('[T1/T2] ?test 自检存在 ✗ 项');
  const header = [
    `${TOOL_VERSION} · 引擎来源 index.html(只读)· 关卡 ${E.LEVELS.length} 关`,
    `节点预算 ${opts.budget} · 解数上限 ${COUNT_CAP}${opts.solver === 'ref' ? ' · [ref 旧 BFS 模式]' : ''}`,
  ];
  /* —— T3 —— */
  const { sel, note } = selectLevels(opts, E);
  if (!sel.length) { console.error('--levels 过滤后无有效关号'); return 1; }
  const t3rows = runT3(E, opts, sel);
  for (const [i, r] of t3rows) {
    const L = E.LEVELS[i];
    if (r.fail === 'budget') failures.push(`[T3] L${i + 1} ${L.name}:超预算(${r.nodes} 节点)`);
    else if (r.optimal === -1) failures.push(`[T3] L${i + 1} ${L.name}:无解`);
    else if (r.optimal !== L.par) failures.push(`[T3] L${i + 1} ${L.name}:optimal ${r.optimal} ≠ par ${L.par}`);
  }
  const t3Lines = [];
  t3Lines.push(`==== [T3] 求解器(分层迭代加深+置换表;${note})====`);
  let totalNodes = 0, totalMs = 0;
  for (const ch of chaptersOf(E)) {
    const inSel = ch.levels.filter(i => t3rows.has(i));
    if (!inSel.length) continue;
    t3Lines.push(`── 章「${ch.name}」(${ch.range})──`);
    for (const i of inSel) {
      const r = t3rows.get(i), L = E.LEVELS[i];
      totalNodes += r.nodes; totalMs += r.ms;
      const ok = !r.fail && r.optimal === L.par;
      const msg = r.fail === 'budget' ? `超预算(${r.nodes})` : r.optimal === -1 ? '无解!' : `optimal=${r.optimal}`;
      t3Lines.push(`${ok ? '✓' : '✗'} L${(i + 1 + '').padStart(2)} ${L.name} ${L.w}×${L.h} par=${L.par} ${msg} · 解数 ${countStr(r)} · 节点 ${r.nodes} · ${r.ms.toFixed(0)}ms` +
        (r.path && r.path.length ? ` · 解:${fmtPath(r.path)}` : ''));
    }
  }
  t3Lines.push(`T3 小计:${t3rows.size} 关 · 节点 ${totalNodes} · 求解耗时 ${(totalMs / 1000).toFixed(2)}s`);
  if (opts.solver === 'new') for (const [i, r] of t3rows) t3rowsAll.set(i, r);

  /* —— selftest —— */
  let stSection = null;
  if (opts.selftest) {
    const st = runSelftest(E, opts);
    stSection = ['==== [SELFTEST] 差分自检(新求解器 vs 旧 BFS / 朴素枚举)===='];
    stSection.push(`随机盘 ${st.boards} 个(optimal 差分 ${st.solvedCmp} · 解数差分 ${st.countCmp} · 枚举超限跳过 ${st.countSkipped})· 语义对齐采样 ${st.alignStates} 态`);
    for (const n of st.notes) stSection.push('  ' + n);
    if (st.fails.length) {
      stSection.push(`✗ 差分失败 ${st.fails.length} 条:`);
      for (const f of st.fails.slice(0, 30)) stSection.push('  ' + f);
      if (st.fails.length > 30) stSection.push(`  …(共 ${st.fails.length} 条)`);
      failures.push(`[SELFTEST] 差分失败 ${st.fails.length} 条`);
    } else stSection.push('✓ 差分自检全绿');
  }

  /* —— audit —— */
  let auSection = null;
  if (opts.audit) {
    const au = runAudit(E, { opts, t3rows });
    auSection = au.lines;
    if (au.warns.length) auSection.push('警告(不阻断,复核后记台账):', ...au.warns.map(w => '  ' + w));
    if (au.blocking.length) { auSection.push('✗ 审计阻断项:'); for (const b of au.blocking) auSection.push('  ' + b); failures.push('[AUDIT] 阻断项 ' + au.blocking.length + ' 条'); }
    else auSection.push('✓ 审计阻断项全绿');
  }

  /* —— bench —— */
  let benchSection = null;
  if (opts.bench) {
    const b = runBench(E, opts);
    benchSection = b.out;
    if (b.fails.length) { benchSection.push('✗ 基准判据未达标:'); for (const f of b.fails) benchSection.push('  ' + f); failures.push('[BENCH] ' + b.fails.length + ' 条'); }
    else benchSection.push('✓ FR-23 基准判据全部达标');
  }

  /* —— 基线 —— */
  let baseNote = '';
  if (opts.baseline) {
    const base = loadBaseline();
    if (!base) baseNote = '基线比对:无 baseline.md(--full --save-baseline 生成)';
    else {
      const bnotes = [], bfails = compareBaseline(base, t3rowsAll, bnotes);
      baseNote = bnotes.join(' ');
      if (bfails.length) { failures.push('[BASELINE] ' + bfails.length + ' 条不一致'); baseNote += '\n✗ ' + bfails.join('\n✗ '); }
      else baseNote += ' ✓';
    }
  }
  if (opts.saveBaseline && failures.length === 0 && t3rowsAll.size === E.LEVELS.length) {
    if (t3rowsAll.size < E.LEVELS.length) baseNote += `\n(注意:本次非全量(${t3rowsAll.size}/${E.LEVELS.length}),基线只覆盖已跑关卡)`;
    const data = saveBaselineFile(E, t3rowsAll);
    baseNote += `\n已写入 ${path.basename(BASELINE_FILE)}(${data.levels.length} 关,生成时间 ${data.generatedAt})`;
  }

  /* —— 输出(失败汇总置顶)—— */
  const out = [];
  out.push(...header);
  out.push('');
  out.push('==== 失败汇总 ====');
  if (failures.length) failures.forEach(f => out.push('✗ ' + f));
  else out.push('无失败项 ✓');
  out.push('');
  out.push('==== [T1+T2] ?test 自检(vm 内运行 index.html 的同一段引擎)====');
  out.push(logs.join('\n'));
  out.push('');
  out.push(...t3Lines);
  if (stSection) { out.push(''); out.push(...stSection); }
  if (auSection) { out.push(''); out.push(...auSection); }
  if (benchSection) { out.push(''); out.push(...benchSection); }
  if (baseNote) { out.push(''); out.push('==== 基线 ====', ...baseNote.split('\n')); }
  out.push('');
  const secs = Number(process.hrtime.bigint() - t0) / 1e9;
  let t3ok = 0;
  for (const [i, r] of t3rows) if (!r.fail && r.optimal !== -1 && r.optimal === E.LEVELS[i].par) t3ok++;
  out.push('==== 结论 ====');
  out.push(`T1/T2 ${selfOK ? '通过' : '存在失败'} · T3 ${t3ok}/${t3rows.size} optimal==par · 总耗时 ${secs.toFixed(2)}s —— ${failures.length ? '存在问题 ❌(exit 1)' : '全部通过 ✅(exit 0)'}`);
  console.log(out.join('\n'));
  return failures.length ? 1 : 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = main();
