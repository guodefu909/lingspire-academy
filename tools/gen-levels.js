const fs = require("fs");

function g(n) {
  var a = [];
  for (var i = 0; i < n; i++) a.push({ type: "grass" });
  return a;
}
function grass() {
  return { type: "grass" };
}
function road() {
  return { type: "road" };
}
function start() {
  return { type: "start" };
}

// ============================================================
// 岛屿1：灵光初岛
// 关卡1「初识灵石」：熟悉玩法 - 修复1座小小屋(3灵石) + 1座普通小屋(4灵石)
// 关卡2「交换的秘密」：加法交换律 - 第一组(小小屋+普通小屋=7) vs 第二组(普通小屋+小小屋=7)
// 灵塔关卡：最终修复
// ============================================================

var level01 = {
  id: "island-01",
  name: "灵光初岛",
  grid: [
    g(20),
    // row1: 起点→右→下
    [grass(), start(), road(), road(), road(), road(), road()].concat(g(13)),
    // row2: 道路向下
    [grass(), grass(), grass(), grass(), grass(), grass(), road()].concat(
      g(13),
    ),
    // row3: 道路向下，连接关卡1
    [grass(), grass(), grass(), grass(), grass(), grass(), road()].concat(
      g(13),
    ),
    // row4: 关卡1「初识灵石」- 1座小小屋+1座普通小屋（单个puzzle）
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      {
        type: "building_damaged",
        puzzle: {
          id: "p01-learn",
          name: "初识灵石",
          type: "grid-fill",
          difficulty: 1,
          knowledgePoint: "熟悉玩法",
          description: "将灵石拖入小屋，放满即修复",
          rewardStones: 2,
          rewardLight: 7,
          config: {
            mode: "simple",
            houses: [
              { type: "small", cost: 3 },
              { type: "normal", cost: 4 },
            ],
          },
        },
      },
      road(),
      road(),
      road(),
    ].concat(g(10)),
    // row5: 道路向下
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      road(),
    ].concat(g(10)),
    // row6: 关卡2「交换的秘密」- 加法交换律
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      {
        type: "building_damaged",
        puzzle: {
          id: "p01-commutative-add",
          name: "交换的秘密",
          type: "grid-fill",
          difficulty: 1,
          knowledgePoint: "加法交换律",
          description: "两组小屋修复顺序不同，观察灵石总数",
          rewardStones: 2,
          rewardLight: 7,
          config: {
            mode: "commutative-add",
            groupA: [
              { type: "small", cost: 3 },
              { type: "normal", cost: 4 },
            ],
            groupB: [
              { type: "normal", cost: 4 },
              { type: "small", cost: 3 },
            ],
            totalCost: 7,
          },
        },
      },
      road(),
      road(),
      road(),
      road(),
    ].concat(g(6)),
    // row7: 道路向下
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      road(),
    ].concat(g(6)),
    // row8: 道路继续，连接灵塔
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      road(),
    ].concat(g(3)),
    // row9: 灵塔
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      {
        type: "tower_damaged",
        puzzle: {
          id: "p01-tower",
          name: "灵光之塔",
          type: "grid-fill",
          difficulty: 1,
          knowledgePoint: "综合",
          description: "修复灵塔，点亮灵光！",
          rewardStones: 3,
          rewardLight: 10,
          config: {
            mode: "simple",
            houses: [
              { type: "small", cost: 3 },
              { type: "normal", cost: 4 },
            ],
          },
        },
      },
    ].concat(g(2)),
    g(20),
    g(20),
    g(20),
  ],
};

// ============================================================
// 岛屿2：雾隐浮岛
// 关卡3「乘法的秘密」：乘法交换律 - 3座普通小屋(3×4=12) vs 4座小小屋(4×3=12)
// 灵塔关卡：最终修复
// ============================================================

var level02 = {
  id: "island-02",
  name: "雾隐浮岛",
  grid: [
    g(20),
    // row1: 起点→右→下
    [grass(), start(), road(), road(), road(), road(), road()].concat(g(13)),
    // row2: 道路向下
    [grass(), grass(), grass(), grass(), grass(), grass(), road()].concat(
      g(13),
    ),
    // row3: 道路继续
    [grass(), grass(), grass(), grass(), grass(), grass(), road()].concat(
      g(13),
    ),
    // row4: 连接关卡3
    [grass(), grass(), grass(), grass(), grass(), grass(), road()].concat(
      g(13),
    ),
    // row5: 关卡3「乘法的秘密」
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      {
        type: "building_damaged",
        puzzle: {
          id: "p02-commutative-mul",
          name: "乘法的秘密",
          type: "grid-fill",
          difficulty: 2,
          knowledgePoint: "乘法交换律",
          description:
            "第一次修复3座普通小屋，第二次修复4座小小屋，观察灵石总数",
          rewardStones: 3,
          rewardLight: 12,
          config: {
            mode: "commutative-mul",
            groupA: {
              houseType: "normal",
              costPerHouse: 4,
              houseCount: 3,
              totalCost: 12,
            },
            groupB: {
              houseType: "small",
              costPerHouse: 3,
              houseCount: 4,
              totalCost: 12,
            },
          },
        },
      },
      road(),
      road(),
      road(),
    ].concat(g(10)),
    // row6: 道路向下
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      road(),
    ].concat(g(10)),
    // row7: 道路继续，连接灵塔
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      road(),
    ].concat(g(10)),
    // row8: 灵塔
    [
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      grass(),
      {
        type: "tower_damaged",
        puzzle: {
          id: "p02-tower",
          name: "雾隐灵塔",
          type: "grid-fill",
          difficulty: 2,
          knowledgePoint: "乘法交换律",
          description: "修复灵塔，驱散迷雾！",
          rewardStones: 5,
          rewardLight: 15,
          config: {
            mode: "simple",
            targetCount: 6,
          },
        },
      },
    ].concat(g(10)),
    g(20),
    g(20),
    g(20),
    g(20),
  ],
};

fs.writeFileSync(
  "assets/data/levels/level-01.json",
  JSON.stringify(level01, null, 2),
  "utf8",
);
console.log("level-01.json OK");

fs.writeFileSync(
  "assets/data/levels/level-02.json",
  JSON.stringify(level02, null, 2),
  "utf8",
);
console.log("level-02.json OK");
