import * as THREE from "./node_modules/three/build/three.module.js";
import { ARButton } from "./node_modules/three/examples/jsm/webxr/ARButton.js";

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  20,
);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(ARButton.createButton(renderer));

// Lights for better visibility and shadow effects
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft ambient light
scene.add(ambientLight);

const blockSize = 0.02; // Tetromino block size
let stackHeight = 0;
let speed = 0.01;
let currentTetromino;
const placedTetrominoes = [];

// Tetromino shapes
const tetrominoes = [
  [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
  ], // T-shape
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ], // Square
  [
    [0, 0],
    [1, 0],
    [-1, 0],
    [-1, 1],
  ], // L-shape
  [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [1, 0],
  ], // J-shape
];

function createBlock(material) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(blockSize, blockSize, blockSize),
    material,
  );
  block.castShadow = true;
  block.receiveShadow = true;
  return block;
}

function createTetromino() {
  const shape = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
  });

  const group = new THREE.Group();
  shape.forEach(([x, y]) => {
    const block = createBlock(material);
    block.position.set(x * blockSize, y * blockSize, 0);
    group.add(block);
  });

  group.position.set(0, stackHeight + 1.5, -0.5);
  scene.add(group);
  return group;
}

function createGridHelpers() {
  const gridBlocks = 10; // Number of blocks in one row/column (adjust as needed)
  const gridSize = gridBlocks * blockSize; //

  const horizontalGrid = new THREE.GridHelper(
    gridSize,
    gridBlocks,
    0x00ff00,
    0x808080,
  );
  horizontalGrid.position.z = -0.5;
  horizontalGrid.position.x = 0.01;
  scene.add(horizontalGrid);

  const verticalGrid = new THREE.GridHelper(
    gridSize,
    gridBlocks,
    0x00ff00,
    0x808080,
  );
  verticalGrid.rotation.x = Math.PI / 2;

  verticalGrid.position.z = -0.5;
  verticalGrid.position.x = 0.009;
  verticalGrid.position.y = 0.1;
  scene.add(verticalGrid);

  const sideGrid = new THREE.GridHelper(
    gridSize,
    gridBlocks,
    0x00ff00,
    0x808080,
  );
  sideGrid.rotation.z = Math.PI / 2;
  sideGrid.position.x = 0.1;
  sideGrid.position.z = -0.5;

  sideGrid.position.y = 0.1;
  scene.add(sideGrid);
}

createGridHelpers();

function onSelect() {
  if (currentTetromino) {
    currentTetromino.rotation.z += Math.PI / 2;

    currentTetromino.children.forEach((block) => {
      block.material.color.setHex(0xff0000); // Change to red briefly
    });

    setTimeout(() => {
      currentTetromino.children.forEach((block) => {
        block.material.color.set(Math.random() * 0xffffff); // Reset color
      });
    }, 200); // Reset after 200ms
  }
}

function detectCollision(tetromino) {
  const blocks = tetromino.children;
  for (const block of blocks) {
    const worldPosition = block.getWorldPosition(new THREE.Vector3());
    const blockY = worldPosition.y;

    if (blockY <= stackHeight + blockSize / 2) return true;

    for (const placed of placedTetrominoes) {
      const placedBlocks = placed.children;
      for (const placedBlock of placedBlocks) {
        const placedWorldPosition = placedBlock.getWorldPosition(
          new THREE.Vector3(),
        );
        if (
          Math.abs(worldPosition.x - placedWorldPosition.x) < blockSize &&
          Math.abs(worldPosition.y - placedWorldPosition.y) < blockSize &&
          Math.abs(worldPosition.z - placedWorldPosition.z) < blockSize
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function gameOver() {
  alert("Game Over! Refresh to restart.");
  renderer.setAnimationLoop(null); // Stop animation
}

renderer.setAnimationLoop(() => {
  if (stackHeight > 0.5) gameOver();

  if (currentTetromino) {
    if (detectCollision(currentTetromino)) {
      placedTetrominoes.push(currentTetromino);
      stackHeight += blockSize;
      speed = Math.min(0.01 + stackHeight * 0.001, 0.05); // Speed scaling

      currentTetromino = createTetromino();
    } else {
      currentTetromino.position.y -= speed;
    }
  } else {
    currentTetromino = createTetromino();
  }

  renderer.render(scene, camera);
});

const controller = renderer.xr.getController(0);
controller.addEventListener("selectstart", onSelect);
scene.add(controller);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
