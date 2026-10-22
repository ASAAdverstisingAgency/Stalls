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
  color: number = 0x0284c7 // vibrant technical cyan-blue
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'DimensionAnnotation';

  const normOffset = offsetDirection.clone().normalize().multiplyScalar(offsetDistance);

  const p1 = start.clone().add(normOffset);
  const p2 = end.clone().add(normOffset);

  const lineMat = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 2,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });

  // Extension line 1 (from start to p1 + small overshoot)
  const ext1End = p1.clone().add(normOffset.clone().normalize().multiplyScalar(0.08));
  const ext1Geo = new THREE.BufferGeometry().setFromPoints([start, ext1End]);
  const ext1 = new THREE.Line(ext1Geo, lineMat);
  group.add(ext1);

  // Extension line 2 (from end to p2 + small overshoot)
  const ext2End = p2.clone().add(normOffset.clone().normalize().multiplyScalar(0.08));
  const ext2Geo = new THREE.BufferGeometry().setFromPoints([end, ext2End]);
  const ext2 = new THREE.Line(ext2Geo, lineMat);
  group.add(ext2);

  // Main dimension line between p1 and p2
  const mainLineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const mainLine = new THREE.Line(mainLineGeo, lineMat);
  group.add(mainLine);

  // Arrowheads at p1 and p2
  const dirP1ToP2 = p2.clone().sub(p1).normalize();
  const dirP2ToP1 = dirP1ToP2.clone().negate();

  const arrowConeGeo = new THREE.ConeGeometry(0.025, 0.08, 12);
  arrowConeGeo.translate(0, -0.04, 0); // apex at origin

  const arrowMat = new THREE.MeshBasicMaterial({
    color: color,
    depthTest: false,
  });

  const arrow1 = new THREE.Mesh(arrowConeGeo, arrowMat);
  arrow1.position.copy(p1);
  arrow1.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirP1ToP2);
  group.add(arrow1);

  const arrow2 = new THREE.Mesh(arrowConeGeo, arrowMat);
  arrow2.position.copy(p2);
  arrow2.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirP2ToP1);
  group.add(arrow2);

  // Text label sprite
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Background pill badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    roundRect(ctx, 16, 20, 408, 88, 22);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    roundRect(ctx, 16, 20, 408, 88, 22);
    ctx.stroke();

    // Text
    ctx.font = 'bold 34px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, 220, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true,
  });

  const sprite = new THREE.Sprite(spriteMat);
  const midPoint = p1.clone().add(p2).multiplyScalar(0.5);
  // slightly offset text above line
  const textOffset = normOffset.clone().normalize().multiplyScalar(0.06);
  sprite.position.copy(midPoint.add(textOffset));
  sprite.scale.set(0.55, 0.16, 1);
  group.add(sprite);

  // Render on top
  group.renderOrder = 999;
  return group;
}

/**
 * Format mm measurement to display string in either feet or mm
 * e.g. 3000 mm -> "9.84 ft (3000 mm)" or "9.8 ft"
 */
export function formatMeasurement(mm: number, unit: 'mm' | 'ft'): string {
  const roundedMm = Math.round(mm);
  if (unit === 'ft') {
    const feet = (mm / 304.8);
    // Display purely in feet: e.g. "9.8 ft" or "10 ft"
    const feetStr = Number.isInteger(feet) ? `${feet} ft` : `${feet.toFixed(1)} ft`;
    return feetStr;
  }
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
