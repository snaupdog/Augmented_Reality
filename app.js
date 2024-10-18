// Import necessary Three.js modules
import * as THREE from "./node_modules/three/build/three.module.js";
import { ARButton } from "./node_modules/three/examples/jsm/webxr/ARButton.js";

// Set up basic scene, camera, and renderer
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

// AR Button to enable AR Mode
document.body.appendChild(ARButton.createButton(renderer));

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

// Function to create a single block and return its size
function createBlock(material) {
  const blockSize = 0.01; // 5cm block size
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(blockSize, blockSize, blockSize),
    material,
  );

  // Compute the bounding box to get the actual size
  const boundingBox = new THREE.Box3().setFromObject(block);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  return { block, size };
}

// Create a random Tetromino with dynamically calculated spacing
function createTetromino() {
  const shape = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  const material = new THREE.MeshBasicMaterial({
    color: Math.random() * 0xffffff,
  });

  const group = new THREE.Group();
  const { size } = createBlock(material); // Get the size dynamically

  shape.forEach(([x, y]) => {
    const { block } = createBlock(material); // Create block instances
    block.position.set(x * size.x, y * size.y, 0); // Use the size for spacing
    group.add(block);
  });

  group.position.set(0, 1.5, -0.5); // Start above the player
  scene.add(group);

  return group;
}

// Create and drop the tetromino
let currentTetromino = createTetromino();
let speed = 0.005; // Adjust speed for smaller blocks

// Animation loop
renderer.setAnimationLoop(() => {
  if (currentTetromino.position.y > 0) {
    currentTetromino.position.y -= speed; // Drop the block
  } else {
    currentTetromino = createTetromino(); // Create a new block when it lands
  }

  renderer.render(scene, camera);
});

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
