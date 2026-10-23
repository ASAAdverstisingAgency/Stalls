import * as THREE from 'three';

/**
 * Creates a dimension annotation consisting of:
 * - Extension lines
 * - Main dimension line with arrowheads at both ends
 * - Readable billboarded text canvas or sprite with mm measurement
 */
export function createDimensionLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  offsetDirection: THREE.Vector3,
  offsetDistance: number,
  label: string,
  color: number = 0x0284c7, // vibrant technical cyan-blue
  depthTest: boolean = true
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'DimensionAnnotation';

  const normOffset = offsetDirection.clone().normalize().multiplyScalar(offsetDistance);

  const p1 = start.clone().add(normOffset);
  const p2 = end.clone().add(normOffset);

  const lineMat = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 3,
    transparent: true,
    opacity: 0.95,
    depthTest: depthTest,
    depthWrite: false,
  });

  const baseOrder = depthTest ? 100 : 9999;
  const spriteOrder = depthTest ? 101 : 10000;

  // Extension line 1 (from start to p1 + small overshoot)
  const ext1End = p1.clone().add(normOffset.clone().normalize().multiplyScalar(0.08));
  const ext1Geo = new THREE.BufferGeometry().setFromPoints([start, ext1End]);
  const ext1 = new THREE.Line(ext1Geo, lineMat);
  ext1.renderOrder = baseOrder;
  group.add(ext1);

  // Extension line 2 (from end to p2 + small overshoot)
  const ext2End = p2.clone().add(normOffset.clone().normalize().multiplyScalar(0.08));
  const ext2Geo = new THREE.BufferGeometry().setFromPoints([end, ext2End]);
  const ext2 = new THREE.Line(ext2Geo, lineMat);
  ext2.renderOrder = baseOrder;
  group.add(ext2);

  // Main dimension line between p1 and p2
  const mainLineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const mainLine = new THREE.Line(mainLineGeo, lineMat);
  mainLine.renderOrder = baseOrder;
  group.add(mainLine);

  // Arrowheads at p1 and p2
  const dirP1ToP2 = p2.clone().sub(p1).normalize();
  const dirP2ToP1 = dirP1ToP2.clone().negate();

  const arrowConeGeo = new THREE.ConeGeometry(0.03, 0.09, 12);
  arrowConeGeo.translate(0, -0.045, 0); // apex at origin

  const arrowMat = new THREE.MeshBasicMaterial({
    color: color,
    depthTest: depthTest,
    depthWrite: false,
  });

  const arrow1 = new THREE.Mesh(arrowConeGeo, arrowMat);
  arrow1.position.copy(p1);
  arrow1.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirP1ToP2);
  arrow1.renderOrder = baseOrder;
  group.add(arrow1);

  const arrow2 = new THREE.Mesh(arrowConeGeo, arrowMat);
  arrow2.position.copy(p2);
  arrow2.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirP2ToP1);
  arrow2.renderOrder = baseOrder;
  group.add(arrow2);

  // Text label sprite
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Background pill badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    roundRect(ctx, 12, 18, 416, 92, 22);
    ctx.fill();

    // Border
    ctx.strokeStyle = color === 0xfacc15 ? '#facc15' : '#38bdf8';
    ctx.lineWidth = 5;
    roundRect(ctx, 12, 18, 416, 92, 22);
    ctx.stroke();

    // Text
    ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 220, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: depthTest,
    depthWrite: false,
    transparent: true,
  });

  const sprite = new THREE.Sprite(spriteMat);
  const midPoint = p1.clone().add(p2).multiplyScalar(0.5);
  // slightly offset text above line
  const textOffset = normOffset.clone().normalize().multiplyScalar(0.08);
  sprite.position.copy(midPoint.add(textOffset));
  sprite.scale.set(0.90, 0.26, 1);
  sprite.renderOrder = spriteOrder;
  group.add(sprite);

  // Render order for overall group
  group.renderOrder = baseOrder;
  return group;
}

/**
 * Format mm measurement to display string in either feet or mm
 * e.g. 3000 mm -> "9.8 ft", 228.6 mm -> "0.75 ft", 1065 mm -> "3.49 ft"
 */
export function formatMeasurement(mm: number, unit: 'mm' | 'ft'): string {
  if (unit === 'ft') {
    const feet = (mm / 304.8);
    if (Number.isInteger(feet)) {
      return `${feet} ft`;
    }
    if (feet < 1) {
      return `${feet.toFixed(2)} ft`;
    }
    // For values like 9.84 ft -> 9.8 ft
    return `${feet.toFixed(1)} ft`;
  }
  const roundedMm = Math.round(mm);
  return `${roundedMm} mm`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
