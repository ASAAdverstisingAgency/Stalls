import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { StallConfig } from '../types/config';
import { StallBuilder } from './stallBuilder';

export type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'isometric';

export class StallScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private stallBuilder: StallBuilder;
  private stallGroup: THREE.Group | null = null;
  private animationFrameId: number | null = null;
  private currentConfig: StallConfig;
  private resizeObserver: ResizeObserver | null = null;

  // Smooth camera animation target state
  private isAnimatingCamera = false;
  private camStartPos = new THREE.Vector3();
  private camEndPos = new THREE.Vector3();
  private camStartTarget = new THREE.Vector3();
  private camEndTarget = new THREE.Vector3();
  private camAnimProgress = 0;

  constructor(container: HTMLElement, config: StallConfig) {
    this.container = container;
    this.currentConfig = config;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7f8fa); // Soft studio backdrop matching UI chrome

    // 2. Camera setup - set near plane to 0.3 to maximize depth buffer precision and prevent z-fighting
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.3, 100);
    // Default Isometric presentation position
    this.camera.position.set(4.2, 3.2, 5.0);

    // 3. Renderer setup with logarithmicDepthBuffer to completely eliminate polygon z-fighting & flickering
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // For capturing screenshots / PNG export
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 15;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.01; // Don't dip below floor
    this.controls.target.set(0, 1.1, 0); // Stall center height

    // 5. Lighting
    this.setupLighting();

    // 6. Ground Studio Platform & Grid
    this.setupStudioEnvironment();

    // 7. Stall Builder
    this.stallBuilder = new StallBuilder(config);
    this.buildScene();

    // 8. Event listeners & Loop — observe container for mobile/tablet layout changes
    window.addEventListener('resize', this.onWindowResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(container);
    }
    this.animate();
  }

  private setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Key Directional Light (Sun/Ceiling soft warm studio light)
    const keyLight = new THREE.DirectionalLight(0xfffcf0, 1.4);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    const d = 4.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    this.scene.add(keyLight);

    // Fill Directional Light (cooler blue-tinted fill from opposite angle)
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.6);
    fillLight.position.set(-5, 6, -3);
    this.scene.add(fillLight);

    // Front soft light to illuminate interior and table clearly
    const frontFill = new THREE.DirectionalLight(0xffffff, 0.4);
    frontFill.position.set(0, 3, 6);
    this.scene.add(frontFill);
  }

  private setupStudioEnvironment() {
    // Soft circular studio floor — light grey like the UI reference
    const podiumGeo = new THREE.CylinderGeometry(7, 7.2, 0.04, 64);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0xeef1f5,
      roughness: 0.95,
      metalness: 0.02,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(0, -0.025, 0);
    podium.receiveShadow = true;
    this.scene.add(podium);

    // Very light technical grid
    const gridHelper = new THREE.GridHelper(12, 24, 0xd0d7e2, 0xe2e8f0);
    gridHelper.position.set(0, -0.003, 0);
    this.scene.add(gridHelper);
  }

  public updateConfig(config: StallConfig) {
    this.currentConfig = config;
    this.stallBuilder.updateConfig(config);
    this.buildScene();
  }

  private buildScene() {
    if (this.stallGroup) {
      this.scene.remove(this.stallGroup);
      this.disposeHierarchy(this.stallGroup);
    }
    this.stallGroup = this.stallBuilder.buildStall();
    this.scene.add(this.stallGroup);
    this.updateDimensionVisibility();
  }

  private disposeHierarchy(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  public setCameraPreset(preset: CameraPreset) {
    this.isAnimatingCamera = true;
    this.camAnimProgress = 0;
    this.camStartPos.copy(this.camera.position);
    this.camStartTarget.copy(this.controls.target);

    const targetH = 1.1;
    // Scale framing with stall footprint (config is mm → meters)
    const w = this.currentConfig.width / 1000;
    const d = this.currentConfig.depth / 1000;
    const span = Math.max(w, d, 2);
    const side = Math.max(4.5, span * 1.35);
    const elev = Math.max(1.4, span * 0.35);
    const topH = Math.max(5.5, span * 1.55);

    switch (preset) {
      case 'front':
        this.camEndPos.set(0, elev, side);
        this.camEndTarget.set(0, targetH, 0);
        break;
      case 'back':
        this.camEndPos.set(0, elev + 0.3, -side);
        this.camEndTarget.set(0, targetH, 0);
        break;
      case 'left':
        this.camEndPos.set(-side, elev + 0.15, 0);
        this.camEndTarget.set(0, targetH, 0);
        break;
      case 'right':
        this.camEndPos.set(side, elev + 0.15, 0);
        this.camEndTarget.set(0, targetH, 0);
        break;
      case 'top':
        // Top view: slight Z offset to prevent Gimbal lock / up vector singularity
        this.camEndPos.set(0, topH, 0.05);
        this.camEndTarget.set(0, 0, 0);
        break;
      case 'isometric':
      default:
        this.camEndPos.set(side * 0.85, elev * 1.8, side * 0.95);
        this.camEndTarget.set(0, targetH, 0);
        break;
    }
  }

  public resetView() {
    this.setCameraPreset('isometric');
  }

  public captureScreenshot(): string {
    // Render immediately to ensure drawing buffer is up to date
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width < 1 || height < 1) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
  };

  /**
   * Show dimension annotations from the front view cone only. The +Z side is
   * the stall entrance; the rear and side views should not show annotations.
   */
  private updateDimensionVisibility() {
    const cameraOffset = this.camera.position.clone().sub(this.controls.target);
    const angleFromFront = Math.abs(Math.atan2(cameraOffset.x, cameraOffset.z));
    const maxFrontAngle = (58 * Math.PI) / 180;
    const isFrontView = cameraOffset.z > 0.25 && angleFromFront <= maxFrontAngle;

    const stallDimGroup = this.scene.getObjectByName('StallDimensionsGroup');
    if (stallDimGroup) {
      stallDimGroup.visible = this.currentConfig.showDimensions && isFrontView;
    }

    const furnitureDimGroup = this.scene.getObjectByName('FurnitureDimensionsGroup');
    if (furnitureDimGroup) {
      furnitureDimGroup.visible = this.currentConfig.showFurnitureDimensions && isFrontView;
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (this.isAnimatingCamera) {
      this.camAnimProgress += 0.045;
      if (this.camAnimProgress >= 1) {
        this.camAnimProgress = 1;
        this.isAnimatingCamera = false;
        this.camera.position.copy(this.camEndPos);
        this.controls.target.copy(this.camEndTarget);
      } else {
        // Ease out cubic
        const t = 1 - Math.pow(1 - this.camAnimProgress, 3);
        this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, t);
        this.controls.target.lerpVectors(this.camStartTarget, this.camEndTarget, t);
      }
    } else {
      this.controls.update();
    }

    // Update all dimension visibility based on camera view angle and toggles.
    this.updateDimensionVisibility();

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
