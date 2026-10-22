import * as THREE from 'three';
import type { StallConfig } from '../types/config';
import { COLOR_PALETTES } from '../types/config';
import { createDimensionLine, formatMeasurement } from '../utils/dimensionHelper';

export class StallBuilder {
  private config: StallConfig;

  // Material cache
  private frameMat!: THREE.MeshStandardMaterial;
  private panelMat!: THREE.MeshStandardMaterial;
  private carpetMat!: THREE.MeshStandardMaterial;
  private fasciaMat!: THREE.MeshStandardMaterial;

  constructor(config: StallConfig) {
    this.config = config;
    this.initMaterials();
  }

  public updateConfig(config: StallConfig) {
    this.config = config;
    this.initMaterials();
  }

  private initMaterials() {
    const fOpt = COLOR_PALETTES.frames.find((f) => f.id === this.config.frameFinish) || COLOR_PALETTES.frames[0];
    const pOpt = COLOR_PALETTES.panels.find((p) => p.id === this.config.panelFinish) || COLOR_PALETTES.panels[0];

    this.frameMat = new THREE.MeshStandardMaterial({
      color: fOpt.hex,
      roughness: fOpt.roughness,
      metalness: fOpt.metalness,
    });

    this.panelMat = new THREE.MeshStandardMaterial({
      color: pOpt.hex,
      roughness: pOpt.roughness,
      metalness: pOpt.metalness,
    });

    this.carpetMat = new THREE.MeshStandardMaterial({
      color: this.config.carpetColor,
      roughness: 0.95,
      metalness: 0.05,
    });

    this.fasciaMat = new THREE.MeshStandardMaterial({
      color: this.config.fasciaColor,
      roughness: 0.4,
      metalness: 0.1,
    });
  }

  /**
   * Builds the full exhibition stall group
   */
  public buildStall(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'ExhibitionStall';

    // 1 unit = 1000 mm
    const w = this.config.width / 1000;
    const d = this.config.depth / 1000;
    const h = this.config.height / 1000;
    const fH = this.config.fasciaHeight / 1000;

    // 1. Carpet Floor (origin at bottom center: x in [-w/2, w/2], z in [-d/2, d/2], y=0)
    const carpetGeo = new THREE.BoxGeometry(w, 0.02, d);
    const carpet = new THREE.Mesh(carpetGeo, this.carpetMat);
    carpet.position.set(0, 0.01, 0);
    carpet.receiveShadow = true;
    carpet.name = 'CarpetFloor';
    root.add(carpet);

    // Carpet subtle border edge trim (aluminium edge binder)
    const edgeTrimGeo = new THREE.BoxGeometry(w + 0.04, 0.022, d + 0.04);
    const edgeTrimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const edgeTrim = new THREE.Mesh(edgeTrimGeo, edgeTrimMat);
    edgeTrim.position.set(0, 0.009, 0);
    root.add(edgeTrim);

    // 2. Octanorm Modular Frame & Panels
    // Octanorm uprights: 40mm x 40mm 8-way octagonal profile (approximated as 40mm cylinder / octagonal prism)
    const postRadius = 0.025; // 50mm diameter standard post
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, h, 8);
    const beamThick = 0.04;
    const beamHeight = 0.05;

    // Corner posts (4 corners of stall)
    const corners = [
      { x: -w / 2, z: -d / 2, name: 'RearLeftPost' },
      { x: w / 2, z: -d / 2, name: 'RearRightPost' },
      { x: -w / 2, z: d / 2, name: 'FrontLeftPost' },
      { x: w / 2, z: d / 2, name: 'FrontRightPost' },
    ];

    corners.forEach((c) => {
      const post = new THREE.Mesh(postGeo, this.frameMat);
      post.position.set(c.x, h / 2, c.z);
      post.castShadow = true;
      post.receiveShadow = true;
      root.add(post);
    });

    // Subdivided Modular Walls: Rear, Left, Right (Front is open entrance)
    // Octanorm standard panel width is ~950mm - 1000mm.
    // In a 3m wall, typically 3 equal bays (each ~1m wide).
    const bays = 3;
    const rearWallGroup = this.buildPartitionWall(w, h, bays, 'rear');
    rearWallGroup.position.set(0, 0, -d / 2);
    root.add(rearWallGroup);

    const leftWallGroup = this.buildPartitionWall(d, h, bays, 'left');
    leftWallGroup.rotation.y = Math.PI / 2;
    leftWallGroup.position.set(-w / 2, 0, 0);
    root.add(leftWallGroup);

    const rightWallGroup = this.buildPartitionWall(d, h, bays, 'right');
    rightWallGroup.rotation.y = -Math.PI / 2;
    rightWallGroup.position.set(w / 2, 0, 0);
    root.add(rightWallGroup);

    // 3. Top Beams & Fascia
    // Front top beam connects front-left and front-right posts
    const frontTopBeamGeo = new THREE.BoxGeometry(w, beamHeight, beamThick);
    const frontTopBeam = new THREE.Mesh(frontTopBeamGeo, this.frameMat);
    frontTopBeam.position.set(0, h - beamHeight / 2, d / 2);
    root.add(frontTopBeam);

    // Fascia Board: Included within overall height (placed just under top beam or occupying top fH of the front entrance)
    // Fascia height = 228.6mm (~9 inches).
    const fasciaBoardY = h - fH / 2;

    const frontFascia = this.buildFasciaBoard(w, fH, this.config.brandingText, true);
    frontFascia.position.set(0, fasciaBoardY, d / 2);
    root.add(frontFascia);

    // If 3-sided fascia selected (front plus both side elevations = 9m total linear fascia)
    if (this.config.fasciaType === 'three-sided') {
      const leftFascia = this.buildFasciaBoard(d, fH, this.config.brandingText, false);
      leftFascia.rotation.y = Math.PI / 2;
      leftFascia.position.set(-w / 2, fasciaBoardY, 0);
      root.add(leftFascia);

      const rightFascia = this.buildFasciaBoard(d, fH, this.config.brandingText, false);
      rightFascia.rotation.y = -Math.PI / 2;
      rightFascia.position.set(w / 2, fasciaBoardY, 0);
      root.add(rightFascia);
    }

    // 4. Spotlights (3 spotlights spaced across front fascia)
    if (this.config.showSpotlights) {
      const spotGroup = this.buildSpotlights(w, h, d);
      root.add(spotGroup);
    }

    // 5. Electrical Socket
    if (this.config.showSocket) {
      const socket = this.buildElectricalSocket();
      this.positionSocket(socket, w, h, d);
      root.add(socket);
    }

    // 6. Dustbin
    if (this.config.showDustbin) {
      const dustbin = this.buildDustbin();
      // Place in back corner unobtrusively
      dustbin.position.set(-w / 2 + 0.35, 0, -d / 2 + 0.35);
      root.add(dustbin);
    }

    // 7. Octanorm Table & Chairs
    if (this.config.showTable) {
      const tableGroup = this.buildOctanormTable();
      // Position inside near open entrance
      const tableX = (this.config.tablePositionX / 1000);
      const tableZ = (this.config.tablePositionZ / 1000);
      tableGroup.position.set(tableX, 0, tableZ);
      root.add(tableGroup);

      // Chairs behind table
      if (this.config.showChairs) {
        const chair1 = this.buildChair();
        chair1.position.set(tableX - 0.35, 0, tableZ - 0.48);
        chair1.rotation.y = 0; // facing front/table
        root.add(chair1);

        const chair2 = this.buildChair();
        chair2.position.set(tableX + 0.35, 0, tableZ - 0.48);
        chair2.rotation.y = 0;
        root.add(chair2);
      }

      // Furniture dimension annotation if enabled
      if (this.config.showFurnitureDimensions) {
        const furnDimGroup = this.buildFurnitureDimensions(tableX, tableZ);
        root.add(furnDimGroup);
      }
    }

    // 8. Overall Stall Dimensions
    if (this.config.showDimensions) {
      const dimGroup = this.buildStallDimensions(w, h, d, fH);
      root.add(dimGroup);
    }

    return root;
  }

  /**
   * Modular partition wall with vertical aluminum intermediate posts and PVC / Melamine Infills
   */
  private buildPartitionWall(wallLength: number, wallHeight: number, bays: number, _wallName: string): THREE.Group {
    const wall = new THREE.Group();
    const bayWidth = wallLength / bays;
    const postRadius = 0.02;
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, wallHeight, 8);
    const horizontalBeamThick = 0.04;
    const horizontalBeamHeight = 0.05;

    // Top horizontal beam
    const topBeamGeo = new THREE.BoxGeometry(wallLength, horizontalBeamHeight, horizontalBeamThick);
    const topBeam = new THREE.Mesh(topBeamGeo, this.frameMat);
    topBeam.position.set(0, wallHeight - horizontalBeamHeight / 2, 0);
    wall.add(topBeam);

    // Bottom horizontal kick-plate beam
    const bottomBeamGeo = new THREE.BoxGeometry(wallLength, horizontalBeamHeight, horizontalBeamThick);
    const bottomBeam = new THREE.Mesh(bottomBeamGeo, this.frameMat);
    bottomBeam.position.set(0, horizontalBeamHeight / 2, 0);
    wall.add(bottomBeam);

    // Intermediate vertical posts and infill panels
    const panelThickness = 0.012;
    const panelH = wallHeight - (horizontalBeamHeight * 2);
    const panelGeo = new THREE.BoxGeometry(bayWidth - 0.04, panelH, panelThickness);

    for (let i = 0; i < bays; i++) {
      // Panel center
      const panelCenterX = -wallLength / 2 + bayWidth * (i + 0.5);
      const panel = new THREE.Mesh(panelGeo, this.panelMat);
      panel.position.set(panelCenterX, wallHeight / 2, 0);
      panel.castShadow = true;
      panel.receiveShadow = true;
      wall.add(panel);

      // Intermediate posts between panels (not at extreme corners as main posts exist)
      if (i > 0) {
        const postX = -wallLength / 2 + bayWidth * i;
        const post = new THREE.Mesh(postGeo, this.frameMat);
        post.position.set(postX, wallHeight / 2, 0);
        wall.add(post);
      }
    }

    return wall;
  }

  /**
   * Fascia board with dynamic branding text canvas
   */
  private buildFasciaBoard(length: number, height: number, text: string, isFront: boolean): THREE.Group {
    const fasciaGroup = new THREE.Group();

    // Aluminum frame around fascia
    const frameDepth = 0.03;
    const frameBorder = 0.015;

    // Top & Bottom fascia rails
    const railGeo = new THREE.BoxGeometry(length, frameBorder, frameDepth);
    const topRail = new THREE.Mesh(railGeo, this.frameMat);
    topRail.position.set(0, height / 2 - frameBorder / 2, 0);
    fasciaGroup.add(topRail);

    const bottomRail = new THREE.Mesh(railGeo, this.frameMat);
    bottomRail.position.set(0, -height / 2 + frameBorder / 2, 0);
    fasciaGroup.add(bottomRail);

    // White fascia board backing
    const boardGeo = new THREE.BoxGeometry(length - 0.02, height - frameBorder * 2, 0.015);
    const board = new THREE.Mesh(boardGeo, this.fasciaMat);
    board.position.set(0, 0, 0);
    fasciaGroup.add(board);

    // Branding text canvas applied to front face
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clean background matching fasciaColor
      ctx.fillStyle = this.config.fasciaColor;
      ctx.fillRect(0, 0, 2048, 256);

      // Draw subtle top/bottom accent line
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 250, 2048, 6);

      // Draw Branding Text
      ctx.fillStyle = this.config.textColor || '#0f172a';
      ctx.font = 'bold 100px "Segoe UI", "Montserrat", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const displayText = isFront ? (text || 'COMPANY NAME') : (text || 'COMPANY NAME');
      ctx.fillText(displayText, 1024, 128);

      // Optional logo or company tag
      ctx.font = '600 36px "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('STAND 3000 x 3000 mm', 1024, 200);
    }

    const brandingTexture = new THREE.CanvasTexture(canvas);
    brandingTexture.minFilter = THREE.LinearFilter;
    const signMat = new THREE.MeshBasicMaterial({
      map: brandingTexture,
      transparent: true,
    });

    const signPlaneGeo = new THREE.PlaneGeometry(length - 0.04, height - frameBorder * 2.2);
    const signPlane = new THREE.Mesh(signPlaneGeo, signMat);
    signPlane.position.set(0, 0, frameDepth / 2 + 0.002);
    fasciaGroup.add(signPlane);

    return fasciaGroup;
  }

  /**
   * Realistic Octanorm Table:
   * Dimensions:
   * Length = 1065 mm (1.065 m)
   * Breadth/Depth = 580 mm (0.58 m)
   * Height = 750 mm (0.75 m)
   * - White rectangular tabletop with silver-grey rounded edge trim
   * - White side and front panels
   * - Vertical aluminium corner profiles
   * - Realistic panel seams and solid exhibition look
   */
  public buildOctanormTable(): THREE.Group {
    const table = new THREE.Group();
    table.name = 'OctanormTable';

    const L = 1.065; // 1065 mm
    const D = 0.580; // 580 mm
    const H = 0.750; // 750 mm
    const topThick = 0.028; // 28 mm tabletop
    const profileSize = 0.035; // 35 mm octanorm profile

    // 1. Table Top (white laminate with silver edge band)
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1,
    });
    const edgeTrimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.8,
    });

    const topGeo = new THREE.BoxGeometry(L, topThick, D);
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.set(0, H - topThick / 2, 0);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    table.add(topMesh);

    // Silver edge banding around tabletop
    const edgeBandGeo = new THREE.BoxGeometry(L + 0.008, topThick + 0.002, D + 0.008);
    const edgeBand = new THREE.Mesh(edgeBandGeo, edgeTrimMat);
    edgeBand.position.set(0, H - topThick / 2, 0);
    table.add(edgeBand);

    // Re-place top mesh slightly higher inside or prioritize topMesh
    topMesh.scale.set(0.995, 1.01, 0.995);

    // 2. 4 Vertical Octagonal Aluminium Corner Profiles
    const legH = H - topThick;
    const legRadius = profileSize / 2;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legH, 8);

    const cornerOffsets = [
      { x: -L / 2 + legRadius, z: -D / 2 + legRadius },
      { x: L / 2 - legRadius, z: -D / 2 + legRadius },
      { x: -L / 2 + legRadius, z: D / 2 - legRadius },
      { x: L / 2 - legRadius, z: D / 2 - legRadius },
    ];

    cornerOffsets.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, this.frameMat);
      leg.position.set(pos.x, legH / 2, pos.z);
      leg.castShadow = true;
      table.add(leg);

      // Foot glider
      const footGeo = new THREE.CylinderGeometry(legRadius * 1.2, legRadius * 1.2, 0.015, 12);
      const footMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(pos.x, 0.0075, pos.z);
      table.add(foot);
    });

    // 3. Front and Side Infill Panels (White melamine panels fitted into Octanorm grooves)
    const panelThickness = 0.012;
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.05,
    });

    // Front panel (facing exhibition visitor)
    const frontPanelW = L - profileSize * 2;
    const frontPanelH = legH - 0.06;
    const frontPanelGeo = new THREE.BoxGeometry(frontPanelW, frontPanelH, panelThickness);
    const frontPanel = new THREE.Mesh(frontPanelGeo, panelMat);
    frontPanel.position.set(0, legH / 2 + 0.01, D / 2 - legRadius);
    frontPanel.castShadow = true;
    table.add(frontPanel);

    // Left and Right side panels
    const sidePanelW = D - profileSize * 2;
    const sidePanelGeo = new THREE.BoxGeometry(panelThickness, frontPanelH, sidePanelW);

    const leftPanel = new THREE.Mesh(sidePanelGeo, panelMat);
    leftPanel.position.set(-L / 2 + legRadius, legH / 2 + 0.01, 0);
    table.add(leftPanel);

    const rightPanel = new THREE.Mesh(sidePanelGeo, panelMat);
    rightPanel.position.set(L / 2 - legRadius, legH / 2 + 0.01, 0);
    table.add(rightPanel);

    // Internal shelf / mid brace inside table
    const shelfGeo = new THREE.BoxGeometry(L - 0.08, 0.018, D - 0.08);
    const shelf = new THREE.Mesh(shelfGeo, panelMat);
    shelf.position.set(0, legH * 0.45, 0);
    table.add(shelf);

    return table;
  }

  /**
   * Realistic Modern Exhibition Chair
   */
  public buildChair(): THREE.Group {
    const chair = new THREE.Group();
    chair.name = 'ExhibitionChair';

    const seatH = 0.45; // 450 mm standard seat height
    const seatW = 0.44;
    const seatD = 0.42;

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.2,
    });

    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.6,
      metalness: 0.05,
    });

    // Seat cushion
    const seatGeo = new THREE.BoxGeometry(seatW, 0.04, seatD);
    const seat = new THREE.Mesh(seatGeo, cushionMat);
    seat.position.set(0, seatH, 0);
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(seatW, 0.38, 0.035);
    const back = new THREE.Mesh(backGeo, cushionMat);
    back.position.set(0, seatH + 0.22, -seatD / 2 + 0.02);
    back.rotation.x = -0.08;
    back.castShadow = true;
    chair.add(back);

    // Chair chrome tubular legs (4 angled legs)
    const legRadius = 0.012;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, seatH, 12);

    const legPositions = [
      { x: -seatW / 2 + 0.03, z: -seatD / 2 + 0.03, rotX: 0.08, rotZ: -0.06 },
      { x: seatW / 2 - 0.03, z: -seatD / 2 + 0.03, rotX: 0.08, rotZ: 0.06 },
      { x: -seatW / 2 + 0.03, z: seatD / 2 - 0.03, rotX: -0.08, rotZ: -0.06 },
      { x: seatW / 2 - 0.03, z: seatD / 2 - 0.03, rotX: -0.08, rotZ: 0.06 },
    ];

    legPositions.forEach((lp) => {
      const leg = new THREE.Mesh(legGeo, chromeMat);
      leg.position.set(lp.x, seatH / 2, lp.z);
      leg.rotation.x = lp.rotX;
      leg.rotation.z = lp.rotZ;
      leg.castShadow = true;
      chair.add(leg);
    });

    return chair;
  }

  /**
   * 3 Spotlights attached to upper frame/fascia pointing inwards onto table & display
   */
  public buildSpotlights(w: number, h: number, d: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'Spotlights';

    const numSpots = 3;
    const spacing = w / (numSpots + 1);

    for (let i = 1; i <= numSpots; i++) {
      const spotX = -w / 2 + spacing * i;
      const spotY = h - 0.05;
      const spotZ = d / 2 - 0.04;

      const singleSpot = new THREE.Group();
      singleSpot.position.set(spotX, spotY, spotZ);

      // Clamp / mounting bracket on aluminum beam
      const bracketGeo = new THREE.BoxGeometry(0.06, 0.04, 0.06);
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const bracket = new THREE.Mesh(bracketGeo, metalMat);
      singleSpot.add(bracket);

      // Goose neck / extension rod
      const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8);
      const rod = new THREE.Mesh(rodGeo, metalMat);
      rod.position.set(0, -0.08, -0.06);
      rod.rotation.x = Math.PI / 4;
      singleSpot.add(rod);

      // Lamp cone housing
      const lampGeo = new THREE.ConeGeometry(0.045, 0.1, 16);
      lampGeo.rotateX(Math.PI / 2);
      const lampHousing = new THREE.Mesh(lampGeo, metalMat);
      lampHousing.position.set(0, -0.14, -0.13);
      lampHousing.lookAt(spotX, 0.75, 0.5); // look down toward table
      singleSpot.add(lampHousing);

      // Light bulb emitter
      const bulbGeo = new THREE.SphereGeometry(0.022, 12, 12);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff4e6 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, -0.14, -0.13);
      singleSpot.add(bulb);

      // Actual Three.js spotlight illuminating display interior
      const light = new THREE.SpotLight(0xfff8ee, 2.2, 5.0, Math.PI / 4.5, 0.4, 1.2);
      light.position.set(spotX, spotY - 0.15, spotZ - 0.15);
      light.target.position.set(spotX * 0.5, 0.75, 0.5);
      group.add(light.target);
      light.castShadow = true;
      group.add(light);

      group.add(singleSpot);
    }

    return group;
  }

  /**
   * Wall-mounted Electrical Socket
   */
  public buildElectricalSocket(): THREE.Group {
    const socket = new THREE.Group();
    socket.name = 'ElectricalSocket';

    // Faceplate (standard UK/EU exhibition socket 86x86mm = 0.086m)
    const plateGeo = new THREE.BoxGeometry(0.086, 0.086, 0.012);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    socket.add(plate);

    // Socket switch and receptacle details
    const innerGeo = new THREE.BoxGeometry(0.045, 0.045, 0.014);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.2,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    socket.add(inner);

    // Small red LED power indicator
    const ledGeo = new THREE.BoxGeometry(0.01, 0.005, 0.015);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.02, 0.025, 0);
    socket.add(led);

    return socket;
  }

  private positionSocket(socket: THREE.Group, w: number, _h: number, d: number) {
    const posY = this.config.socketHeightY / 1000;
    const posX = this.config.socketPositionX / 1000;

    if (this.config.socketWall === 'rear') {
      socket.position.set(posX, posY, -d / 2 + 0.01);
      socket.rotation.set(0, 0, 0);
    } else if (this.config.socketWall === 'left') {
      socket.position.set(-w / 2 + 0.01, posY, posX);
      socket.rotation.set(0, Math.PI / 2, 0);
    } else {
      socket.position.set(w / 2 - 0.01, posY, posX);
      socket.rotation.set(0, -Math.PI / 2, 0);
    }
  }

  /**
   * Small exhibition dustbin
   */
  public buildDustbin(): THREE.Group {
    const bin = new THREE.Group();
    bin.name = 'ExhibitionDustbin';

    const binH = 0.32; // 320 mm
    const binRTop = 0.12;
    const binRBot = 0.09;

    const binGeo = new THREE.CylinderGeometry(binRTop, binRBot, binH, 20, 1, true);
    const binMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.65,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    const binMesh = new THREE.Mesh(binGeo, binMat);
    binMesh.position.set(0, binH / 2, 0);
    binMesh.castShadow = true;
    bin.add(binMesh);

    // Rim ring
    const rimGeo = new THREE.TorusGeometry(binRTop, 0.008, 8, 24);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(0, binH, 0);
    bin.add(rim);

    // Bottom plate
    const botGeo = new THREE.CylinderGeometry(binRBot, binRBot, 0.008, 16);
    const bot = new THREE.Mesh(botGeo, binMat);
    bot.position.set(0, 0.004, 0);
    bin.add(bot);

    return bin;
  }

  /**
   * Stall dimension lines:
   * - Front width: 3000 mm
   * - Side depth: 3000 mm
   * - Overall height: 2400 mm
   * - Fascia height: 229 mm
   */
  private buildStallDimensions(w: number, h: number, d: number, fH: number): THREE.Group {
    const dimGroup = new THREE.Group();
    dimGroup.name = 'StallDimensionsGroup';

    const unit = this.config.dimensionUnit || 'ft';

    // 1. Front Width: from (-w/2, 0, d/2) to (w/2, 0, d/2)
    const frontStart = new THREE.Vector3(-w / 2, 0.02, d / 2);
    const frontEnd = new THREE.Vector3(w / 2, 0.02, d / 2);
    const frontWidthDim = createDimensionLine(
      frontStart,
      frontEnd,
      new THREE.Vector3(0, 0, 1),
      0.35,
      `W: ${formatMeasurement(this.config.width, unit)}`
    );
    dimGroup.add(frontWidthDim);

    // 2. Side Depth: from (w/2, 0, d/2) to (w/2, 0, -d/2)
    const sideStart = new THREE.Vector3(w / 2, 0.02, d / 2);
    const sideEnd = new THREE.Vector3(w / 2, 0.02, -d / 2);
    const sideDepthDim = createDimensionLine(
      sideStart,
      sideEnd,
      new THREE.Vector3(1, 0, 0),
      0.35,
      `D: ${formatMeasurement(this.config.depth, unit)}`
    );
    dimGroup.add(sideDepthDim);

    // 3. Overall Height: from (-w/2, 0, d/2) to (-w/2, h, d/2)
    const heightStart = new THREE.Vector3(-w / 2, 0, d / 2);
    const heightEnd = new THREE.Vector3(-w / 2, h, d / 2);
    const heightDim = createDimensionLine(
      heightStart,
      heightEnd,
      new THREE.Vector3(-1, 0, 0),
      0.35,
      `H: ${formatMeasurement(this.config.height, unit)}`
    );
    dimGroup.add(heightDim);

    // 4. Fascia Height: from (w/2, h - fH, d/2) to (w/2, h, d/2)
    const fasciaStart = new THREE.Vector3(w / 2, h - fH, d / 2);
    const fasciaEnd = new THREE.Vector3(w / 2, h, d / 2);
    const fasciaDim = createDimensionLine(
      fasciaStart,
      fasciaEnd,
      new THREE.Vector3(0, 0, 1),
      0.25,
      `Fascia: ${formatMeasurement(this.config.fasciaHeight, unit)}`
    );
    dimGroup.add(fasciaDim);

    return dimGroup;
  }

  /**
   * Furniture Dimensions:
   * - Table length: 1065 mm (~3.5 ft)
   * - Table depth: 580 mm (~1.9 ft)
   * - Table height: 750 mm (~2.46 ft)
   */
  private buildFurnitureDimensions(tx: number, tz: number): THREE.Group {
    const dimGroup = new THREE.Group();
    dimGroup.name = 'FurnitureDimensionsGroup';

    const unit = this.config.dimensionUnit || 'ft';
    const L = 1.065;
    const D = 0.580;
    const H = 0.750;

    // Table length along X
    const p1 = new THREE.Vector3(tx - L / 2, H, tz + D / 2);
    const p2 = new THREE.Vector3(tx + L / 2, H, tz + D / 2);
    const lengthDim = createDimensionLine(
      p1,
      p2,
      new THREE.Vector3(0, 0, 1),
      0.18,
      `L: ${formatMeasurement(1065, unit)}`,
      0xe11d48 // rose accent for furniture
    );
    dimGroup.add(lengthDim);

    // Table depth along Z
    const pd1 = new THREE.Vector3(tx + L / 2, H, tz + D / 2);
    const pd2 = new THREE.Vector3(tx + L / 2, H, tz - D / 2);
    const depthDim = createDimensionLine(
      pd1,
      pd2,
      new THREE.Vector3(1, 0, 0),
      0.18,
      `D: ${formatMeasurement(580, unit)}`,
      0xe11d48
    );
    dimGroup.add(depthDim);

    // Table height along Y
    const ph1 = new THREE.Vector3(tx - L / 2, 0, tz - D / 2);
    const ph2 = new THREE.Vector3(tx - L / 2, H, tz - D / 2);
    const heightDim = createDimensionLine(
      ph1,
      ph2,
      new THREE.Vector3(-1, 0, 0),
      0.18,
      `H: ${formatMeasurement(750, unit)}`,
      0xe11d48
    );
    dimGroup.add(heightDim);

    return dimGroup;
  }
}
