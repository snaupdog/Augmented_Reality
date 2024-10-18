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
document.body.appendChild(renderer.domElement);
document.body.appendChild(ARButton.createButton(renderer));

const blockSize = 0.02; // Block size for tetrominoes
let stackHeight = 0; // Track total stack height
let speed = 0.01; // Falling speed
let currentTetromino; // Store the current falling tetromino

// Track all placed tetrominoes in a simple array
const placedTetrominoes = [];

// Tetromino shapes (as 2D arrays of coordinates)
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

// Create a single block with material
function createBlock(material) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(blockSize, blockSize, blockSize),
    material,
  );
  return block;
}

// Create a random tetromino group
function createTetromino() {
  const shape = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  const material = new THREE.MeshBasicMaterial({
    color: Math.random() * 0xffffff,
  });

  const group = new THREE.Group();
  shape.forEach(([x, y]) => {
    const block = createBlock(material);
    block.position.set(x * blockSize, y * blockSize, 0);
    group.add(block);
  });

  // Start above the stack
  group.position.set(0, stackHeight + 1.5, -0.5);
  scene.add(group);
  return group;
}

// Rotate tetromino on click
function onSelect() {
  if (currentTetromino) {
    console.log("hello");
    currentTetromino.rotation.z += Math.PI / 2; // Rotate 90 degrees
  }
}

// Detect collision with ground or another tetromino
function detectCollision(tetromino) {
  const blocks = tetromino.children; // Get the blocks of the tetromino
  for (const block of blocks) {
    const worldPosition = block.getWorldPosition(new THREE.Vector3());
    const blockY = worldPosition.y;

    // Check if it has reached the stack height or ground
    if (blockY <= stackHeight + blockSize / 2) {
      return true; // Collision detected
    }

    // Check if block overlaps with any placed tetromino
    for (const placed of placedTetrominoes) {
      const placedBlocks = placed.children;

      for (const placedBlock of placedBlocks) {
        const placedWorldPosition = placedBlock.getWorldPosition(
          new THREE.Vector3(),
        );
        const placedBlockY = placedWorldPosition.y;

        // If both blocks are in the same position, we have a collision
        if (
          Math.abs(worldPosition.x - placedWorldPosition.x) < blockSize &&
          Math.abs(blockY - placedBlockY) < blockSize
        ) {
          return true; // Collision detected with an existing block
        }
      }
    }
  }

  return false; // No collision detected
}

// Main animation loop
renderer.setAnimationLoop(() => {
  if (currentTetromino) {
    if (detectCollision(currentTetromino)) {
      // Add tetromino to the placed tetrominoes list
      placedTetrominoes.push(currentTetromino);
      stackHeight += blockSize; // Increase stack height

      // Generate a new tetromino
      currentTetromino = createTetromino();
    } else {
      // Keep falling if no collision
      currentTetromino.position.y -= speed;
    }
  } else {
    // Create the first tetromino
    currentTetromino = createTetromino();
  }

  renderer.render(scene, camera);
});

// Handle AR input sources (e.g., taps)
const controller = renderer.xr.getController(0);
controller.addEventListener("selectstart", onSelect);
scene.add(controller);

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
