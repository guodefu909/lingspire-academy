/**
 * 方格放灵石解谜组件 —— 运算线核心玩法
 * 【核心概念】
 * 小屋 = 多槽位容器，放满灵石即修复
 * 小小屋（浅红色）：3个槽位，需3个灵石
 * 普通小屋（正红色）：4个槽位，需4个灵石
 * 【三种模式】
 * simple: 单组小屋，放满即修复（熟悉玩法）
 * commutative-add: 两组小屋，顺序不同，灵石总数相同
 * commutative-mul: 两种小屋，数量不同，灵石总数相同
 */
import * as Phaser from "phaser";
import { EventBus } from "@core/event-bus";
import { PuzzleConfig } from "@components/grid-map.component";
import { PuzzleSystem } from "@components/puzzle-system";
import { RepairSystem } from "@components/repair-system";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_SPIRIT_STONE,
  COLOR_SPIRIT_LIGHT,
} from "@config/constants";
interface HouseConfig {
  type: string;
  cost: number;
}

interface HouseSlot {
  bgRect: Phaser.GameObjects.Rectangle;
  slots: Phaser.GameObjects.Arc[];
  filled: number;
  cost: number;
  houseType: string;
  completed: boolean;
}

type PuzzleMode = "simple" | "commutative-add" | "commutative-mul";

const COLOR_SMALL_HOUSE = 0xcc6666;
const COLOR_NORMAL_HOUSE = 0xcc3333;
const COLOR_SLOT_EMPTY = 0x442222;

export class GridFillPuzzle {
  private scene: Phaser.Scene;
  private puzzle: PuzzleConfig;
  private mapCol: number;
  private mapRow: number;
  private container: Phaser.GameObjects.Container;
  private mode: PuzzleMode = "simple";

  private houses: HouseSlot[] = [];
  private dragStones: Phaser.GameObjects.Arc[] = [];
  private dragGlows: Phaser.GameObjects.Arc[] = [];
  private extraObjects: Phaser.GameObjects.GameObject[] = [];

  private hintText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private currentPhase: number = 1;
  private totalPhases: number = 1;
  private phase1Total: number = 0;

  private readonly SLOT_RADIUS = 12;

  constructor(
    scene: Phaser.Scene,
    puzzle: PuzzleConfig,
    mapCol: number,
    mapRow: number,
  ) {
    this.scene = scene;
    this.puzzle = puzzle;
    this.mapCol = mapCol;
    this.mapRow = mapRow;

    this.mode = puzzle.config.mode || "simple";
    this.totalPhases = this.calcTotalPhases();

    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.createBackground();
    this.createPhaseText();
    this.createHintText();
    this.createCurrentPhase();
  }

  private calcTotalPhases(): number {
    if (this.mode === "commutative-add" || this.mode === "commutative-mul")
      return 2;
    return 1;
  }

  private createBackground(): void {
    const bg = this.scene.add.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      0x000000,
      0.6,
    );
    this.container.add(bg);
  }

  private createPhaseText(): void {
    this.phaseText = this.scene.add
      .text(CANVAS_WIDTH / 2, 40, "", {
        fontSize: "24px",
        color: "#ffd700",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.container.add(this.phaseText);
    this.updatePhaseText();
  }

  private createHintText(): void {
    this.hintText = this.scene.add
      .text(CANVAS_WIDTH / 2, 80, "", {
        fontSize: "18px",
        color: "#aaccff",
        fontFamily: "Arial",
        wordWrap: { width: 600 },
        align: "center",
      })
      .setOrigin(0.5);
    this.hintText.setText(this.puzzle.description);
    this.container.add(this.hintText);
  }

  private updatePhaseText(): void {
    if (this.mode === "simple") {
      this.phaseText.setText(this.puzzle.name);
    } else if (this.currentPhase === 1) {
      this.phaseText.setText(`${this.puzzle.name} - 第一组`);
    } else {
      this.phaseText.setText(`${this.puzzle.name} - 第二组`);
    }
  }

  private createCurrentPhase(): void {
    this.clearPhaseArea();

    if (this.mode === "simple") {
      this.hintText.setText("将灵石拖入小屋，放满即修复");
    } else if (this.mode === "commutative-add") {
      this.hintText.setText(
        this.currentPhase === 1
          ? "按顺序修复小屋，将灵石拖入方格"
          : "换个顺序修复小屋，观察灵石总数",
      );
    } else if (this.mode === "commutative-mul") {
      this.hintText.setText(
        this.currentPhase === 1
          ? "修复这些小屋，将灵石拖入方格"
          : "修复另一种小屋，观察灵石总数",
      );
    }

    this.createHousesLayout();
    this.createDragStones();
  }

  private getHouseList(): HouseConfig[] {
    const config = this.puzzle.config;
    if (this.mode === "simple") return config.houses;
    if (this.mode === "commutative-add") {
      return this.currentPhase === 1 ? config.groupA : config.groupB;
    }
    return this.currentPhase === 1 ? config.groupA : config.groupB;
  }

  private getTotalStones(): number {
    return this.getHouseList().reduce((sum, h) => sum + h.cost, 0);
  }

  private houseTypeName(type: string): string {
    if (type === "small") return "小小屋";
    if (type === "normal") return "普通小屋";
    return type;
  }

  private houseColor(type: string): number {
    return type === "small" ? COLOR_SMALL_HOUSE : COLOR_NORMAL_HOUSE;
  }

  private createHousesLayout(): void {
    const houses = this.getHouseList();
    const houseCount = houses.length;
    const houseWidth = 100;
    const houseHeight = 90;
    const gap = 30;
    const totalWidth = houseCount * houseWidth + (houseCount - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const startY = 140;

    this.houses = [];

    for (let i = 0; i < houseCount; i++) {
      const house = houses[i];
      const x = startX + i * (houseWidth + gap);
      const color = this.houseColor(house.type);

      const bgRect = this.scene.add.rectangle(
        x + houseWidth / 2,
        startY + houseHeight / 2,
        houseWidth,
        houseHeight,
        color,
        0.7,
      );
      bgRect.setStrokeStyle(2, COLOR_SPIRIT_LIGHT, 0.5);
      this.container.add(bgRect);

      const nameLabel = this.scene.add
        .text(x + houseWidth / 2, startY + 14, this.houseTypeName(house.type), {
          fontSize: "13px",
          color: "#ffdddd",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(nameLabel);
      this.extraObjects.push(nameLabel);

      const slots: Phaser.GameObjects.Arc[] = [];
      const slotSpacing = this.SLOT_RADIUS * 2.4;
      const maxPerRow = 4;

      for (let s = 0; s < house.cost; s++) {
        const sRow = Math.floor(s / maxPerRow);
        const sCol = s % maxPerRow;
        const countInRow = Math.min(maxPerRow, house.cost - sRow * maxPerRow);
        const rowWidth = countInRow * slotSpacing;
        const rowStartX = x + (houseWidth - rowWidth) / 2 + slotSpacing / 2;
        const rowStartY = startY + 38;

        const sx = rowStartX + sCol * slotSpacing;
        const sy = rowStartY + sRow * (this.SLOT_RADIUS * 2.4);

        const slotCircle = this.scene.add.circle(
          sx,
          sy,
          this.SLOT_RADIUS,
          COLOR_SLOT_EMPTY,
          0.6,
        );
        slotCircle.setStrokeStyle(1, COLOR_SPIRIT_LIGHT, 0.3);
        this.container.add(slotCircle);
        slots.push(slotCircle);
      }

      this.houses.push({
        bgRect,
        slots,
        filled: 0,
        cost: house.cost,
        houseType: house.type,
        completed: false,
      });
    }
  }

  private createDragStones(): void {
    this.dragStones.forEach((s) => s.destroy());
    this.dragStones = [];
    this.dragGlows.forEach((g) => g.destroy());
    this.dragGlows = [];

    const totalStones = this.getTotalStones();
    const stoneStartY = 290;
    const stoneRadius = 18;
    const maxPerRow = 12;
    const spacing = stoneRadius * 2.5;

    for (let i = 0; i < totalStones; i++) {
      const rowIdx = Math.floor(i / maxPerRow);
      const colIdx = i % maxPerRow;
      const countInRow = Math.min(maxPerRow, totalStones - rowIdx * maxPerRow);
      const rowWidth = countInRow * spacing;
      const rowStartX = (CANVAS_WIDTH - rowWidth) / 2 + spacing / 2;

      const x = rowStartX + colIdx * spacing;
      const y = stoneStartY + rowIdx * (stoneRadius * 3);

      const stone = this.scene.add.circle(
        x,
        y,
        stoneRadius,
        COLOR_SPIRIT_STONE,
        0.9,
      );
      stone.setStrokeStyle(2, 0xffffff, 0.4);
      stone.setInteractive({ draggable: true, useHandCursor: true });

      const glow = this.scene.add.circle(
        x,
        y,
        stoneRadius * 1.3,
        COLOR_SPIRIT_LIGHT,
        0.15,
      );
      this.container.add(glow);
      this.dragGlows.push(glow);

      stone.on("dragstart", () => {
        stone.setDepth(110);
        stone.setScale(1.2);
      });

      stone.on("drag", (pointer: Phaser.Input.Pointer) => {
        stone.x = pointer.x;
        stone.y = pointer.y;
        glow.x = pointer.x;
        glow.y = pointer.y;
      });

      stone.on("dragend", () => {
        stone.setScale(1);
        this.handleStoneDrop(stone, glow);
      });

      this.container.add(stone);
      this.dragStones.push(stone);
    }

    const helpText = this.scene.add
      .text(CANVAS_WIDTH / 2, stoneStartY - 20, "拖拽灵石放入上方小屋", {
        fontSize: "16px",
        color: "#888888",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);
    this.container.add(helpText);
    this.extraObjects.push(helpText);
  }

  private handleStoneDrop(
    stone: Phaser.GameObjects.Arc,
    glow: Phaser.GameObjects.Arc,
  ): void {
    for (const house of this.houses) {
      if (house.completed) continue;
      if (house.filled >= house.cost) continue;

      const bounds = house.bgRect.getBounds();

      if (!bounds.contains(stone.x, stone.y)) continue;

      const targetSlot = house.slots[house.filled];
      house.filled++;

      this.scene.tweens.add({
        targets: [stone, glow],
        x: targetSlot.x,
        y: targetSlot.y,
        duration: 150,
        ease: "Back.easeOut",
      });

      targetSlot.setFillStyle(COLOR_SPIRIT_STONE, 0.9);
      targetSlot.setStrokeStyle(1, 0xffffff, 0.6);
      stone.removeInteractive();

      if (house.filled >= house.cost) {
        house.completed = true;
        house.bgRect.setStrokeStyle(3, COLOR_SPIRIT_LIGHT, 1);

        const checkText = this.scene.add
          .text(
            house.bgRect.x,
            house.bgRect.y + house.bgRect.height / 2 + 8,
            "已修复",
            { fontSize: "12px", color: "#88ff88", fontFamily: "Arial" },
          )
          .setOrigin(0.5);
        this.container.add(checkText);
        this.extraObjects.push(checkText);
      }

      this.checkAllHousesCompleted();
      return;
    }
  }

  private checkAllHousesCompleted(): void {
    const allDone = this.houses.every((h) => h.completed);
    if (!allDone) return;

    const total = this.houses.reduce((sum, h) => sum + h.cost, 0);

    this.scene.time.delayedCall(800, () => {
      if (this.mode === "simple") {
        this.onPuzzleComplete();
      } else {
        this.onPhaseComplete(total);
      }
    });
  }

  private onPhaseComplete(total: number): void {
    this.clearPhaseArea();

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    if (this.mode === "commutative-add") {
      const houses = this.getHouseList();
      const formula = houses.map((h) => h.cost).join(" + ");

      const formulaText = this.scene.add
        .text(centerX, centerY - 40, `${formula} = ${total}`, {
          fontSize: "32px",
          color: "#ffd700",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.container.add(formulaText);
      this.extraObjects.push(formulaText);

      const descText = this.scene.add
        .text(centerX, centerY + 10, `共花费 ${total} 个灵石`, {
          fontSize: "24px",
          color: "#aaccff",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(descText);
      this.extraObjects.push(descText);

      if (this.currentPhase === 1) {
        const nextText = this.scene.add
          .text(centerX, centerY + 60, "换个顺序试试？", {
            fontSize: "20px",
            color: "#88cc88",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);
        this.container.add(nextText);
        this.extraObjects.push(nextText);
      }
    }

    if (this.mode === "commutative-mul") {
      const houses = this.getHouseList();
      const firstCost = houses[0].cost;
      const count = houses.length;

      const formulaText = this.scene.add
        .text(
          centerX,
          centerY - 40,
          `${count} 座${this.houseTypeName(houses[0].type)} x ${firstCost} = ${total}`,
          {
            fontSize: "28px",
            color: "#ffd700",
            fontFamily: "Arial",
            fontStyle: "bold",
          },
        )
        .setOrigin(0.5);
      this.container.add(formulaText);
      this.extraObjects.push(formulaText);

      const descText = this.scene.add
        .text(centerX, centerY + 10, `共花费 ${total} 个灵石`, {
          fontSize: "24px",
          color: "#aaccff",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(descText);
      this.extraObjects.push(descText);

      if (this.currentPhase === 1) {
        const nextText = this.scene.add
          .text(centerX, centerY + 60, "换一种小屋试试？", {
            fontSize: "20px",
            color: "#88cc88",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);
        this.container.add(nextText);
        this.extraObjects.push(nextText);
      }
    }

    this.scene.time.delayedCall(2000, () => {
      if (this.currentPhase < this.totalPhases) {
        this.phase1Total = total;
        this.currentPhase++;
        this.updatePhaseText();
        this.createCurrentPhase();
      } else {
        this.showDiscovery(total);
      }
    });
  }

  private showDiscovery(phase2Total: number): void {
    this.clearPhaseArea();

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    if (this.mode === "commutative-add") {
      const gA = this.puzzle.config.groupA;
      const gB = this.puzzle.config.groupB;
      const fA = gA.map((h: any) => h.cost).join(" + ");
      const fB = gB.map((h: any) => h.cost).join(" + ");

      const line1 = this.scene.add
        .text(centerX, centerY - 70, `第一组: ${fA} = ${this.phase1Total}`, {
          fontSize: "24px",
          color: "#aaccff",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(line1);
      this.extraObjects.push(line1);

      const line2 = this.scene.add
        .text(centerX, centerY - 30, `第二组: ${fB} = ${phase2Total}`, {
          fontSize: "24px",
          color: "#aaccff",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(line2);
      this.extraObjects.push(line2);

      const equalText = this.scene.add
        .text(centerX, centerY + 20, `${this.phase1Total} = ${phase2Total}`, {
          fontSize: "36px",
          color: "#ffd700",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.container.add(equalText);
      equalText.setAlpha(0);
      this.scene.tweens.add({ targets: equalText, alpha: 1, duration: 800 });

      const discoverText = this.scene.add
        .text(centerX, centerY + 70, "顺序不同，灵石总数相同！", {
          fontSize: "22px",
          color: "#88cc88",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(discoverText);
      this.extraObjects.push(discoverText);
      discoverText.setAlpha(0);
      this.scene.tweens.add({
        targets: discoverText,
        alpha: 1,
        duration: 1000,
        delay: 500,
      });
    }

    if (this.mode === "commutative-mul") {
      const gA = this.puzzle.config.groupA;
      const gB = this.puzzle.config.groupB;

      const line1 = this.scene.add
        .text(
          centerX,
          centerY - 70,
          `第一次: ${gA.houseCount} x ${gA.costPerHouse} = ${gA.totalCost}`,
          { fontSize: "24px", color: "#aaccff", fontFamily: "Arial" },
        )
        .setOrigin(0.5);
      this.container.add(line1);
      this.extraObjects.push(line1);

      const line2 = this.scene.add
        .text(
          centerX,
          centerY - 30,
          `第二次: ${gB.houseCount} x ${gB.costPerHouse} = ${gB.totalCost}`,
          { fontSize: "24px", color: "#aaccff", fontFamily: "Arial" },
        )
        .setOrigin(0.5);
      this.container.add(line2);
      this.extraObjects.push(line2);

      const equalText = this.scene.add
        .text(centerX, centerY + 20, `${gA.totalCost} = ${gB.totalCost}`, {
          fontSize: "36px",
          color: "#ffd700",
          fontFamily: "Arial",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.container.add(equalText);
      equalText.setAlpha(0);
      this.scene.tweens.add({ targets: equalText, alpha: 1, duration: 800 });

      const discoverText = this.scene.add
        .text(centerX, centerY + 70, "小屋不同，灵石总数相同！", {
          fontSize: "22px",
          color: "#88cc88",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.container.add(discoverText);
      this.extraObjects.push(discoverText);
      discoverText.setAlpha(0);
      this.scene.tweens.add({
        targets: discoverText,
        alpha: 1,
        duration: 1000,
        delay: 500,
      });
    }

    this.scene.time.delayedCall(3000, () => {
      this.onPuzzleComplete();
    });
  }

  private clearPhaseArea(): void {
    this.houses.forEach((h) => {
      h.bgRect.destroy();
      h.slots.forEach((s) => s.destroy());
    });
    this.houses = [];

    this.dragStones.forEach((s) => s.destroy());
    this.dragStones = [];
    this.dragGlows.forEach((g) => g.destroy());
    this.dragGlows = [];

    this.extraObjects.forEach((o) => o.destroy());
    this.extraObjects = [];
  }

  private onPuzzleComplete(): void {
    this.clearPhaseArea();

    PuzzleSystem.completePuzzle(this.puzzle.id, true);
    const result = RepairSystem.completeRepair(
      this.mapCol,
      this.mapRow,
      this.puzzle,
    );

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    const completeText = this.scene.add
      .text(centerX, centerY - 20, "修复成功！", {
        fontSize: "36px",
        color: "#ffd700",
        fontFamily: "Arial",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.container.add(completeText);

    const rewardText = this.scene.add
      .text(
        centerX,
        centerY + 30,
        `+${result.rewardStones} 灵石  +${result.rewardLight} 灵光`,
        { fontSize: "24px", color: "#00ccff", fontFamily: "Arial" },
      )
      .setOrigin(0.5);
    this.container.add(rewardText);

    this.scene.time.delayedCall(2000, () => {
      this.destroy();
      EventBus.emit("puzzle-closed");
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
