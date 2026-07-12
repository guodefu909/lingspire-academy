export function getCenterX(scene: Phaser.Scene): number {
  return scene.cameras.main.width / 2;
}

export function getCenterY(scene: Phaser.Scene): number {
  return scene.cameras.main.height / 2;
}

export function getWidth(scene: Phaser.Scene): number {
  return scene.cameras.main.width;
}

export function getHeight(scene: Phaser.Scene): number {
  return scene.cameras.main.height;
}
