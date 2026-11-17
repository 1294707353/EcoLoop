# EcoLoop T3 基线存档(FR-23/24,计划 §5.3)

> 生成:`node tools/verify.mjs --full --save-baseline`(EcoLoop_verify.mjs v2.0(FR-23/24+T3.5))· 时间 2026-11-15 14:09:58 · 关卡数 50 · demo L1–L20 哈希 `3fe29f24547f4bc2`
> 用途:改 verify/levelgen 工具后,跑 `node tools/verify.mjs --audit`(或 `--baseline`)与本文逐关比对 optimal/解数/节点;耗时仅参考(随机器波动)。
> 口径:节点 = 放置模拟次数(总节点,含解数统计固有的末层完整展开);寻优节点 = 层内首胜时刻的节点数,与 v1 工具口径可比(旧版不产解数列)。
> 解数 = 长度恰为 optimal 的互异胜利操作序列条数(路径条数,非终态个数;上限 10000,超限记 ≥10000)。
> 机器可读块见下(勿改格式);`--save-baseline` 会整文件重写。

<!--ECOLOOP_T3_BASELINE
{
 "tool": "EcoLoop_verify.mjs v2.0(FR-23/24+T3.5)",
 "generatedAt": "2026-11-15 14:09:58",
 "levelsCount": 50,
 "l1_11_hash": "3fe29f24547f4bc2",
 "budget": 500000,
 "countCap": 10000,
 "levels": [
  {
   "i": 0,
   "no": 1,
   "name": "吃到就前进",
   "theme": "启程",
   "w": 3,
   "h": 3,
   "par": 2,
   "optimal": 2,
   "count": 20,
   "capped": false,
   "nodes": 68,
   "nodesFirstWin": 9,
   "ms": 1.2,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "grass",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 1,
   "no": 2,
   "name": "最后一口在哪",
   "theme": "启程",
   "w": 3,
   "h": 3,
   "par": 2,
   "optimal": 2,
   "count": 6,
   "capped": false,
   "nodes": 51,
   "nodesFirstWin": 11,
   "ms": 0.4,
   "path": [
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 2,
   "no": 3,
   "name": "第一个岔路",
   "theme": "启程",
   "w": 4,
   "h": 3,
   "par": 2,
   "optimal": 2,
   "count": 4,
   "capped": false,
   "nodes": 84,
   "nodesFirstWin": 10,
   "ms": 0.6,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "grass",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 3,
   "no": 4,
   "name": "自己排顺序",
   "theme": "启程",
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 28,
   "capped": false,
   "nodes": 3894,
   "nodesFirstWin": 624,
   "ms": 16,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "grass",
     1,
     0
    ],
    [
     "rabbit",
     0,
     0
    ]
   ],
   "fail": null
  },
  {
   "i": 4,
   "no": 5,
   "name": "提前摆盘",
   "theme": "启程",
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 4,
   "capped": false,
   "nodes": 2310,
   "nodesFirstWin": 257,
   "ms": 9.9,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "rabbit",
     1,
     1
    ],
    [
     "grass",
     1,
     0
    ]
   ],
   "fail": null
  },
  {
   "i": 5,
   "no": 6,
   "name": "别喂错对象",
   "theme": "启程",
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 2,
   "capped": false,
   "nodes": 3273,
   "nodesFirstWin": 802,
   "ms": 12.7,
   "path": [
    [
     "grass",
     0,
     2
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "rabbit",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 6,
   "no": 7,
   "name": "留给下一口",
   "theme": "启程",
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 2,
   "capped": false,
   "nodes": 1539,
   "nodesFirstWin": 873,
   "ms": 5.9,
   "path": [
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "rabbit",
     1,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 7,
   "no": 8,
   "name": "先养谁",
   "theme": "启程",
   "w": 4,
   "h": 5,
   "par": 4,
   "optimal": 4,
   "count": 12,
   "capped": false,
   "nodes": 23824,
   "nodesFirstWin": 16874,
   "ms": 86.3,
   "path": [
    [
     "grass",
     2,
     0
    ],
    [
     "grass",
     3,
     0
    ],
    [
     "rabbit",
     4,
     0
    ],
    [
     "rabbit",
     4,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 8,
   "no": 9,
   "name": "把鹰引回来",
   "theme": "启程",
   "w": 4,
   "h": 5,
   "par": 4,
   "optimal": 4,
   "count": 6,
   "capped": false,
   "nodes": 73808,
   "nodesFirstWin": 57739,
   "ms": 252.1,
   "path": [
    [
     "grass",
     3,
     0
    ],
    [
     "rabbit",
     1,
     0
    ],
    [
     "grass",
     3,
     1
    ],
    [
     "rabbit",
     2,
     0
    ]
   ],
   "fail": null
  },
  {
   "i": 9,
   "no": 10,
   "name": "分路与接力",
   "theme": "启程",
   "w": 5,
   "h": 4,
   "par": 6,
   "optimal": 6,
   "count": 60,
   "capped": false,
   "nodes": 195642,
   "nodesFirstWin": 139098,
   "ms": 971.1,
   "path": [
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "rabbit",
     1,
     3
    ],
    [
     "grass",
     3,
     1
    ],
    [
     "rabbit",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 10,
   "no": 11,
   "name": "一触即发",
   "theme": "湿地",
   "w": 4,
   "h": 3,
   "par": 1,
   "optimal": 1,
   "count": 1,
   "capped": false,
   "nodes": 10,
   "nodesFirstWin": 5,
   "ms": 0.1,
   "path": [
    [
     "rabbit",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 11,
   "no": 12,
   "name": "虫子的路",
   "theme": "湿地",
   "w": 3,
   "h": 3,
   "par": 2,
   "optimal": 2,
   "count": 20,
   "capped": false,
   "nodes": 68,
   "nodesFirstWin": 9,
   "ms": 0.1,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "grass",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 12,
   "no": 13,
   "name": "青蛙的晚餐",
   "theme": "湿地",
   "w": 4,
   "h": 3,
   "par": 2,
   "optimal": 2,
   "count": 6,
   "capped": false,
   "nodes": 83,
   "nodesFirstWin": 14,
   "ms": 0.1,
   "path": [
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 13,
   "no": 14,
   "name": "两位食客",
   "theme": "湿地",
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 16,
   "capped": false,
   "nodes": 6278,
   "nodesFirstWin": 2859,
   "ms": 18.7,
   "path": [
    [
     "grass",
     0,
     3
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "bug",
     2,
     3
    ]
   ],
   "fail": null
  },
  {
   "i": 14,
   "no": 15,
   "name": "两路备餐",
   "theme": "湿地",
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 65,
   "capped": false,
   "nodes": 27705,
   "nodesFirstWin": 22046,
   "ms": 107.8,
   "path": [
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     1,
     3
    ],
    [
     "bug",
     0,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 15,
   "no": 16,
   "name": "窄口",
   "theme": "湿地",
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 6,
   "capped": false,
   "nodes": 64,
   "nodesFirstWin": 42,
   "ms": 0.2,
   "path": [
    [
     "grass",
     2,
     2
    ],
    [
     "grass",
     2,
     3
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "rabbit",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 16,
   "no": 17,
   "name": "两路分粮",
   "theme": "湿地",
   "w": 4,
   "h": 5,
   "par": 4,
   "optimal": 4,
   "count": 18,
   "capped": false,
   "nodes": 11968,
   "nodesFirstWin": 5009,
   "ms": 34.8,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "rabbit",
     1,
     0
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "grass",
     3,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 17,
   "no": 18,
   "name": "两条链一张桌",
   "theme": "湿地",
   "w": 5,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 4,
   "capped": false,
   "nodes": 1674,
   "nodesFirstWin": 823,
   "ms": 6.1,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 18,
   "no": 19,
   "name": "先收哪一边",
   "theme": "湿地",
   "w": 5,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 16,
   "capped": false,
   "nodes": 182480,
   "nodesFirstWin": 104794,
   "ms": 773.3,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "rabbit",
     1,
     0
    ],
    [
     "grass",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 19,
   "no": 20,
   "name": "生态交汇",
   "theme": "湿地",
   "w": 5,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 12,
   "capped": false,
   "nodes": 89319,
   "nodesFirstWin": 49089,
   "ms": 409.8,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "bug",
     1,
     3
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 20,
   "no": 21,
   "name": "两条河",
   "theme": "E",
   "w": 5,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 44,
   "capped": false,
   "nodes": 97647,
   "nodesFirstWin": 31131,
   "ms": 277.6,
   "path": [
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     0,
     2
    ],
    [
     "grass",
     0,
     4
    ],
    [
     "grass",
     1,
     4
    ],
    [
     "rabbit",
     2,
     4
    ]
   ],
   "fail": null
  },
  {
   "i": 21,
   "no": 22,
   "name": "上菜的次序",
   "theme": "E",
   "w": 5,
   "h": 5,
   "par": 4,
   "optimal": 4,
   "count": 4,
   "capped": false,
   "nodes": 39231,
   "nodesFirstWin": 20809,
   "ms": 125,
   "path": [
    [
     "rabbit",
     1,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "rabbit",
     3,
     3
    ],
    [
     "grass",
     2,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 22,
   "no": 23,
   "name": "墙里墙外",
   "theme": "E",
   "w": 5,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 4,
   "capped": false,
   "nodes": 2561,
   "nodesFirstWin": 2553,
   "ms": 7.4,
   "path": [
    [
     "rabbit",
     0,
     3
    ],
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     0,
     2
    ],
    [
     "grass",
     1,
     3
    ]
   ],
   "fail": null
  },
  {
   "i": 23,
   "no": 24,
   "name": "大草原",
   "theme": "E",
   "w": 6,
   "h": 6,
   "par": 5,
   "optimal": 5,
   "count": 5,
   "capped": false,
   "nodes": 333027,
   "nodesFirstWin": 154992,
   "ms": 1199.7,
   "path": [
    [
     "grass",
     1,
     2
    ],
    [
     "rabbit",
     1,
     1
    ],
    [
     "rabbit",
     2,
     1
    ],
    [
     "rabbit",
     3,
     1
    ],
    [
     "rabbit",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 24,
   "no": 25,
   "name": "回马枪",
   "theme": "E",
   "w": 5,
   "h": 5,
   "par": 2,
   "optimal": 2,
   "count": 2,
   "capped": false,
   "nodes": 980,
   "nodesFirstWin": 195,
   "ms": 2,
   "path": [
    [
     "grass",
     1,
     3
    ],
    [
     "rabbit",
     0,
     3
    ]
   ],
   "fail": null
  },
  {
   "i": 25,
   "no": 26,
   "name": "空席",
   "theme": "E",
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 26,
   "capped": false,
   "nodes": 33758,
   "nodesFirstWin": 20877,
   "ms": 121.6,
   "path": [
    [
     "grass",
     1,
     2
    ],
    [
     "frog",
     2,
     3
    ],
    [
     "bug",
     1,
     3
    ],
    [
     "grass",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 26,
   "no": 27,
   "name": "二度照谱",
   "theme": "E",
   "w": 5,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 2,
   "capped": false,
   "nodes": 509,
   "nodesFirstWin": 355,
   "ms": 1.9,
   "path": [
    [
     "rabbit",
     2,
     1
    ],
    [
     "grass",
     1,
     0
    ],
    [
     "eagle",
     2,
     0
    ],
    [
     "rabbit",
     2,
     2
    ],
    [
     "grass",
     2,
     0
    ]
   ],
   "fail": null
  },
  {
   "i": 27,
   "no": 28,
   "name": "两位猎手",
   "theme": "E",
   "w": 5,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 8,
   "capped": false,
   "nodes": 23910,
   "nodesFirstWin": 9359,
   "ms": 89.3,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     1,
     3
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "rabbit",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 28,
   "no": 29,
   "name": "两份口粮",
   "theme": "E",
   "w": 4,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 47,
   "capped": false,
   "nodes": 164494,
   "nodesFirstWin": 128545,
   "ms": 702.5,
   "path": [
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     3,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "bug",
     0,
     0
    ],
    [
     "bug",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 29,
   "no": 30,
   "name": "草原塌方",
   "theme": "E",
   "w": 6,
   "h": 6,
   "par": 5,
   "optimal": 5,
   "count": 4,
   "capped": false,
   "nodes": 293257,
   "nodesFirstWin": 139650,
   "ms": 1024.7,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     3,
     0
    ],
    [
     "grass",
     3,
     1
    ],
    [
     "grass",
     3,
     3
    ]
   ],
   "fail": null
  },
  {
   "i": 30,
   "no": 31,
   "name": "先喂哪一口",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 1,
   "capped": false,
   "nodes": 19197,
   "nodesFirstWin": 18056,
   "ms": 71.8,
   "path": [
    [
     "rabbit",
     2,
     2
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     1,
     1
    ],
    [
     "rabbit",
     1,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 31,
   "no": 32,
   "name": "让出饭桌",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 2,
   "capped": false,
   "nodes": 1955,
   "nodesFirstWin": 1480,
   "ms": 5.4,
   "path": [
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "bug",
     2,
     3
    ]
   ],
   "fail": null
  },
  {
   "i": 32,
   "no": 33,
   "name": "门口不是终点",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 12,
   "capped": false,
   "nodes": 133028,
   "nodesFirstWin": 130083,
   "ms": 707.4,
   "path": [
    [
     "rabbit",
     2,
     1
    ],
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "bug",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 33,
   "no": 34,
   "name": "同一株草",
   "theme": null,
   "w": 5,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 20,
   "capped": false,
   "nodes": 360735,
   "nodesFirstWin": 352571,
   "ms": 1485.9,
   "path": [
    [
     "grass",
     3,
     1
    ],
    [
     "grass",
     4,
     1
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     3,
     1
    ],
    [
     "bug",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 34,
   "no": 35,
   "name": "留一口",
   "theme": null,
   "w": 5,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 72,
   "capped": false,
   "nodes": 235187,
   "nodesFirstWin": 77697,
   "ms": 1292.8,
   "path": [
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     1,
     1
    ],
    [
     "rabbit",
     2,
     2
    ],
    [
     "rabbit",
     2,
     3
    ],
    [
     "grass",
     2,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 35,
   "no": 36,
   "name": "小小回环",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 58,
   "capped": false,
   "nodes": 1241,
   "nodesFirstWin": 181,
   "ms": 3.4,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     1,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 36,
   "no": 37,
   "name": "接力换手",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 2,
   "capped": false,
   "nodes": 2193,
   "nodesFirstWin": 2126,
   "ms": 7.1,
   "path": [
    [
     "grass",
     3,
     2
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "grass",
     3,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 37,
   "no": 38,
   "name": "先上冷盘",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 68,
   "capped": false,
   "nodes": 21872,
   "nodesFirstWin": 5065,
   "ms": 74.6,
   "path": [
    [
     "grass",
     0,
     0
    ],
    [
     "grass",
     1,
     0
    ],
    [
     "rabbit",
     0,
     1
    ],
    [
     "bug",
     1,
     2
    ],
    [
     "grass",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 38,
   "no": 39,
   "name": "争先之后",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 40,
   "capped": false,
   "nodes": 64977,
   "nodesFirstWin": 38180,
   "ms": 279,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "bug",
     0,
     1
    ],
    [
     "bug",
     1,
     0
    ],
    [
     "grass",
     2,
     0
    ],
    [
     "bug",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 39,
   "no": 40,
   "name": "合流之前",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 6,
   "optimal": 6,
   "count": 90,
   "capped": false,
   "nodes": 156829,
   "nodesFirstWin": 98859,
   "ms": 1023.4,
   "path": [
    [
     "grass",
     0,
     1
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "rabbit",
     3,
     1
    ],
    [
     "bug",
     1,
     2
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "grass",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 40,
   "no": 41,
   "name": "两口之间",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 2,
   "capped": false,
   "nodes": 8061,
   "nodesFirstWin": 2886,
   "ms": 31,
   "path": [
    [
     "grass",
     1,
     0
    ],
    [
     "grass",
     1,
     1
    ],
    [
     "rabbit",
     1,
     2
    ],
    [
     "grass",
     1,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 41,
   "no": 42,
   "name": "错开的饭点",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 4,
   "capped": false,
   "nodes": 2887,
   "nodesFirstWin": 2654,
   "ms": 14,
   "path": [
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     2
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "grass",
     2,
     2
    ]
   ],
   "fail": null
  },
  {
   "i": 42,
   "no": 43,
   "name": "一格两用",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 1,
   "capped": false,
   "nodes": 2073,
   "nodesFirstWin": 998,
   "ms": 10.8,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "rabbit",
     2,
     2
    ],
    [
     "grass",
     2,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 43,
   "no": 44,
   "name": "借一步",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 2,
   "capped": false,
   "nodes": 2345,
   "nodesFirstWin": 1812,
   "ms": 10.8,
   "path": [
    [
     "rabbit",
     1,
     0
    ],
    [
     "grass",
     1,
     2
    ],
    [
     "rabbit",
     1,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 44,
   "no": 45,
   "name": "尚未开席",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 6,
   "capped": false,
   "nodes": 6764,
   "nodesFirstWin": 5257,
   "ms": 45,
   "path": [
    [
     "grass",
     1,
     0
    ],
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "rabbit",
     3,
     1
    ],
    [
     "bug",
     0,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 45,
   "no": 46,
   "name": "先吃哪一种",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 21,
   "capped": false,
   "nodes": 86622,
   "nodesFirstWin": 49538,
   "ms": 404.6,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     0,
     2
    ],
    [
     "rabbit",
     0,
     1
    ],
    [
     "rabbit",
     1,
     2
    ],
    [
     "rabbit",
     2,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 46,
   "no": 47,
   "name": "谁来让路",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 5,
   "optimal": 5,
   "count": 30,
   "capped": false,
   "nodes": 26416,
   "nodesFirstWin": 19529,
   "ms": 107.7,
   "path": [
    [
     "grass",
     1,
     0
    ],
    [
     "bug",
     0,
     0
    ],
    [
     "bug",
     0,
     2
    ],
    [
     "grass",
     0,
     3
    ],
    [
     "grass",
     1,
     3
    ]
   ],
   "fail": null
  },
  {
   "i": 47,
   "no": 48,
   "name": "最后的准备",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 3,
   "optimal": 3,
   "count": 1,
   "capped": false,
   "nodes": 573,
   "nodesFirstWin": 468,
   "ms": 1.5,
   "path": [
    [
     "grass",
     3,
     1
    ],
    [
     "grass",
     3,
     2
    ],
    [
     "grass",
     2,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 48,
   "no": 49,
   "name": "两次经过",
   "theme": null,
   "w": 4,
   "h": 5,
   "par": 5,
   "optimal": 5,
   "count": 6,
   "capped": false,
   "nodes": 6033,
   "nodesFirstWin": 5202,
   "ms": 19.3,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "rabbit",
     2,
     2
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     2,
     1
    ],
    [
     "grass",
     3,
     1
    ]
   ],
   "fail": null
  },
  {
   "i": 49,
   "no": 50,
   "name": "各有归处",
   "theme": null,
   "w": 4,
   "h": 4,
   "par": 4,
   "optimal": 4,
   "count": 1,
   "capped": false,
   "nodes": 3994,
   "nodesFirstWin": 2424,
   "ms": 17.7,
   "path": [
    [
     "grass",
     1,
     1
    ],
    [
     "grass",
     2,
     3
    ],
    [
     "rabbit",
     2,
     2
    ],
    [
     "grass",
     2,
     1
    ]
   ],
   "fail": null
  }
 ]
}
-->

## 人读表格

| 关 | 关名 | 章 | 盘面 | par | optimal | 解数 | 节点 | 寻优节点 | 耗时(ms) | 一条最优解 |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 | 吃到就前进 | 启程 | 3×3 | 2 | 2 | 20 | 68 | 9 | 1.2 | grass(0,0) → grass(0,1) |
| L2 | 最后一口在哪 | 启程 | 3×3 | 2 | 2 | 6 | 51 | 11 | 0.4 | grass(0,1) → grass(1,1) |
| L3 | 第一个岔路 | 启程 | 4×3 | 2 | 2 | 4 | 84 | 10 | 0.6 | grass(0,0) → grass(0,1) |
| L4 | 自己排顺序 | 启程 | 4×4 | 3 | 3 | 28 | 3894 | 624 | 16 | grass(0,0) → grass(1,0) → rabbit(0,0) |
| L5 | 提前摆盘 | 启程 | 4×4 | 3 | 3 | 4 | 2310 | 257 | 9.9 | grass(0,0) → rabbit(1,1) → grass(1,0) |
| L6 | 别喂错对象 | 启程 | 4×4 | 3 | 3 | 2 | 3273 | 802 | 12.7 | grass(0,2) → grass(1,2) → rabbit(0,1) |
| L7 | 留给下一口 | 启程 | 4×4 | 3 | 3 | 2 | 1539 | 873 | 5.9 | grass(2,1) → grass(2,2) → rabbit(1,2) |
| L8 | 先养谁 | 启程 | 4×5 | 4 | 4 | 12 | 23824 | 16874 | 86.3 | grass(2,0) → grass(3,0) → rabbit(4,0) → rabbit(4,1) |
| L9 | 把鹰引回来 | 启程 | 4×5 | 4 | 4 | 6 | 73808 | 57739 | 252.1 | grass(3,0) → rabbit(1,0) → grass(3,1) → rabbit(2,0) |
| L10 | 分路与接力 | 启程 | 5×4 | 6 | 6 | 60 | 195642 | 139098 | 971.1 | grass(1,2) → grass(2,1) → grass(2,2) → rabbit(1,3) → grass(3,1) → rabbit(1,1) |
| L11 | 一触即发 | 湿地 | 4×3 | 1 | 1 | 1 | 10 | 5 | 0.1 | rabbit(1,1) |
| L12 | 虫子的路 | 湿地 | 3×3 | 2 | 2 | 20 | 68 | 9 | 0.1 | grass(0,0) → grass(0,1) |
| L13 | 青蛙的晚餐 | 湿地 | 4×3 | 2 | 2 | 6 | 83 | 14 | 0.1 | grass(0,1) → grass(1,1) |
| L14 | 两位食客 | 湿地 | 4×4 | 4 | 4 | 16 | 6278 | 2859 | 18.7 | grass(0,3) → grass(1,2) → grass(2,2) → bug(2,3) |
| L15 | 两路备餐 | 湿地 | 4×4 | 5 | 5 | 65 | 27705 | 22046 | 107.8 | grass(1,2) → grass(2,2) → grass(1,2) → grass(1,3) → bug(0,2) |
| L16 | 窄口 | 湿地 | 4×4 | 4 | 4 | 6 | 64 | 42 | 0.2 | grass(2,2) → grass(2,3) → grass(2,2) → rabbit(2,2) |
| L17 | 两路分粮 | 湿地 | 4×5 | 4 | 4 | 18 | 11968 | 5009 | 34.8 | grass(0,0) → rabbit(1,0) → grass(2,2) → grass(3,2) |
| L18 | 两条链一张桌 | 湿地 | 5×4 | 4 | 4 | 4 | 1674 | 823 | 6.1 | grass(1,1) → grass(1,2) → grass(2,1) → grass(2,2) |
| L19 | 先收哪一边 | 湿地 | 5×5 | 5 | 5 | 16 | 182480 | 104794 | 773.3 | grass(1,1) → grass(1,2) → grass(2,1) → rabbit(1,0) → grass(2,2) |
| L20 | 生态交汇 | 湿地 | 5×5 | 5 | 5 | 12 | 89319 | 49089 | 409.8 | grass(1,1) → grass(1,2) → bug(1,3) → grass(2,1) → grass(2,2) |
| L21 | 两条河 | E | 5×5 | 5 | 5 | 44 | 97647 | 31131 | 277.6 | grass(0,1) → grass(0,2) → grass(0,4) → grass(1,4) → rabbit(2,4) |
| L22 | 上菜的次序 | E | 5×5 | 4 | 4 | 4 | 39231 | 20809 | 125 | rabbit(1,1) → grass(2,2) → rabbit(3,3) → grass(2,1) |
| L23 | 墙里墙外 | E | 5×5 | 5 | 5 | 4 | 2561 | 2553 | 7.4 | rabbit(0,3) → grass(0,1) → grass(1,2) → grass(0,2) → grass(1,3) |
| L24 | 大草原 | E | 6×6 | 5 | 5 | 5 | 333027 | 154992 | 1199.7 | grass(1,2) → rabbit(1,1) → rabbit(2,1) → rabbit(3,1) → rabbit(1,1) |
| L25 | 回马枪 | E | 5×5 | 2 | 2 | 2 | 980 | 195 | 2 | grass(1,3) → rabbit(0,3) |
| L26 | 空席 | E | 4×4 | 4 | 4 | 26 | 33758 | 20877 | 121.6 | grass(1,2) → frog(2,3) → bug(1,3) → grass(2,2) |
| L27 | 二度照谱 | E | 5×5 | 5 | 5 | 2 | 509 | 355 | 1.9 | rabbit(2,1) → grass(1,0) → eagle(2,0) → rabbit(2,2) → grass(2,0) |
| L28 | 两位猎手 | E | 5×4 | 4 | 4 | 8 | 23910 | 9359 | 89.3 | grass(1,1) → grass(1,3) → grass(2,1) → rabbit(0,1) |
| L29 | 两份口粮 | E | 4×5 | 5 | 5 | 47 | 164494 | 128545 | 702.5 | grass(2,1) → grass(3,1) → grass(2,2) → bug(0,0) → bug(0,1) |
| L30 | 草原塌方 | E | 6×6 | 5 | 5 | 4 | 293257 | 139650 | 1024.7 | grass(1,1) → grass(2,1) → grass(3,0) → grass(3,1) → grass(3,3) |
| L31 | 先喂哪一口 | 基础 | 4×4 | 4 | 4 | 1 | 19197 | 18056 | 71.8 | rabbit(2,2) → grass(1,2) → grass(1,1) → rabbit(1,2) |
| L32 | 让出饭桌 | 基础 | 4×4 | 3 | 3 | 2 | 1955 | 1480 | 5.4 | grass(2,1) → grass(2,2) → bug(2,3) |
| L33 | 门口不是终点 | 基础 | 4×4 | 5 | 5 | 12 | 133028 | 130083 | 707.4 | rabbit(2,1) → grass(1,1) → grass(1,1) → grass(1,2) → bug(0,1) |
| L34 | 同一株草 | 基础 | 5×5 | 5 | 5 | 20 | 360735 | 352571 | 1485.9 | grass(3,1) → grass(4,1) → grass(2,1) → grass(3,1) → bug(1,1) |
| L35 | 留一口 | 基础 | 5×4 | 5 | 5 | 72 | 235187 | 77697 | 1292.8 | grass(0,1) → grass(1,1) → rabbit(2,2) → rabbit(2,3) → grass(2,1) |
| L36 | 小小回环 | 基础 | 4×4 | 3 | 3 | 58 | 1241 | 181 | 3.4 | grass(0,0) → grass(0,1) → grass(1,2) |
| L37 | 接力换手 | 基础 | 4×4 | 4 | 4 | 2 | 2193 | 2126 | 7.1 | grass(3,2) → grass(2,1) → grass(2,2) → grass(3,1) |
| L38 | 先上冷盘 | 基础 | 4×4 | 5 | 5 | 68 | 21872 | 5065 | 74.6 | grass(0,0) → grass(1,0) → rabbit(0,1) → bug(1,2) → grass(2,2) |
| L39 | 争先之后 | 基础 | 4×4 | 5 | 5 | 40 | 64977 | 38180 | 279 | grass(1,1) → bug(0,1) → bug(1,0) → grass(2,0) → bug(1,1) |
| L40 | 合流之前 | 基础 | 4×4 | 6 | 6 | 90 | 156829 | 98859 | 1023.4 | grass(0,1) → grass(2,1) → rabbit(3,1) → bug(1,2) → grass(2,2) → grass(1,1) |
| L41 | 两口之间 | 基础 | 4×4 | 4 | 4 | 2 | 8061 | 2886 | 31 | grass(1,0) → grass(1,1) → rabbit(1,2) → grass(1,2) |
| L42 | 错开的饭点 | 基础 | 4×4 | 4 | 4 | 4 | 2887 | 2654 | 14 | grass(2,1) → grass(2,2) → grass(1,2) → grass(2,2) |
| L43 | 一格两用 | 基础 | 4×4 | 3 | 3 | 1 | 2073 | 998 | 10.8 | grass(1,1) → rabbit(2,2) → grass(2,1) |
| L44 | 借一步 | 基础 | 4×4 | 3 | 3 | 2 | 2345 | 1812 | 10.8 | rabbit(1,0) → grass(1,2) → rabbit(1,1) |
| L45 | 尚未开席 | 基础 | 4×4 | 5 | 5 | 6 | 6764 | 5257 | 45 | grass(1,0) → grass(1,1) → grass(2,1) → rabbit(3,1) → bug(0,1) |
| L46 | 先吃哪一种 | 基础 | 4×4 | 5 | 5 | 21 | 86622 | 49538 | 404.6 | grass(1,1) → grass(0,2) → rabbit(0,1) → rabbit(1,2) → rabbit(2,1) |
| L47 | 谁来让路 | 基础 | 4×4 | 5 | 5 | 30 | 26416 | 19529 | 107.7 | grass(1,0) → bug(0,0) → bug(0,2) → grass(0,3) → grass(1,3) |
| L48 | 最后的准备 | 基础 | 4×4 | 3 | 3 | 1 | 573 | 468 | 1.5 | grass(3,1) → grass(3,2) → grass(2,1) |
| L49 | 两次经过 | 基础 | 4×5 | 5 | 5 | 6 | 6033 | 5202 | 19.3 | grass(1,1) → rabbit(2,2) → grass(2,1) → grass(2,1) → grass(3,1) |
| L50 | 各有归处 | 基础 | 4×4 | 4 | 4 | 1 | 3994 | 2424 | 17.7 | grass(1,1) → grass(2,3) → rabbit(2,2) → grass(2,1) |
