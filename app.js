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

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const blockSize = 0.02; // Tetromino block size
let stackHeight = 0;
let speed = 0.002;
let currentTetromino;
const placedTetrominoes = [];
const moveDistance = blockSize;
const rotationAngle = Math.PI / 2;
const gridBlocks = 10; // Number of blocks in one row/column
const rowsCleared = new Set(); // Track cleared rows

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

  group.position.set(0, 0.5, -0.5);
  scene.add(group);
  return group;
}

function createGridHelpers() {
  const gridSize = gridBlocks * blockSize;

  const horizontalGrid = new THREE.GridHelper(
    gridSize,
    gridBlocks,
    0x00ff00,
    0x808080,
  );
  horizontalGrid.position.z = -0.5;
  scene.add(horizontalGrid);

  const verticalGrid = new THREE.GridHelper(
    gridSize,
    gridBlocks,
    0x00ff00,
    0x808080,
  );
  verticalGrid.rotation.x = Math.PI / 2;
  verticalGrid.position.y = 0.1;
  scene.add(verticalGrid);
}

createGridHelpers();

function onSelect() {
  if (currentTetromino) {
    currentTetromino.rotation.z += Math.PI / 2;
  }
}

function detectCollision(tetromino) {
  const blocks = tetromino.children;

  for (const block of blocks) {
    const worldPosition = block.getWorldPosition(new THREE.Vector3());

    // Check if block is out of bounds (left, right, bottom)
    if (
      worldPosition.y <= 0.01 ||
      worldPosition.x < -0.15 ||
      worldPosition.x >= 0.15
    ) {
      return true;
    }

    // Check for collision with placed blocks
    for (const placed of placedTetrominoes) {
      const placedBlocks = placed.children;

      for (const placedBlock of placedBlocks) {
        const placedWorldPosition = placedBlock.getWorldPosition(
          new THREE.Vector3(),
        );

        const xCollision =
          Math.abs(worldPosition.x - placedWorldPosition.x) < blockSize * 0.9;
        const yCollision =
          Math.abs(worldPosition.y - placedWorldPosition.y) < blockSize * 0.9;
        const zCollision =
          Math.abs(worldPosition.z - placedWorldPosition.z) < blockSize * 0.9;

        // Ensure collision is detected if the blocks are close enough
        if (xCollision && yCollision && zCollision) {
          return true;
        }
      }
    }
  }
  return false;
}

function gameOver() {
  alert("Game Over! Refresh to restart.");
  renderer.setAnimationLoop(null);
}

function handleKeyDown(event) {
  if (!currentTetromino) return;

  switch (event.key) {
    case "h":
      currentTetromino.position.x -= moveDistance;
      if (detectCollision(currentTetromino)) {
        currentTetromino.position.x += moveDistance;
      }
      break;
    case "l":
      currentTetromino.position.x += moveDistance;
      if (detectCollision(currentTetromino)) {
        currentTetromino.position.x -= moveDistance;
      }
      break;
    case "k":
      currentTetromino.rotation.z += rotationAngle;
      if (detectCollision(currentTetromino)) {
        currentTetromino.rotation.z -= rotationAngle;
      }
      break;
    case "j":
      currentTetromino.position.y -= speed * 6;
      if (detectCollision(currentTetromino)) {
        currentTetromino.position.y += speed * 2;
      }
      break;
  }
}

window.addEventListener("keydown", handleKeyDown);

renderer.setAnimationLoop(() => {
  if (currentTetromino) {
    if (detectCollision(currentTetromino)) {
      placedTetrominoes.push(currentTetromino);
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
