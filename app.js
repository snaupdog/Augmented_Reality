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

// Create a random Tetromino block
function createTetromino() {
  const shape = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  const material = new THREE.MeshBasicMaterial({
    color: Math.random() * 0xffffff,
  });

  const group = new THREE.Group();
  shape.forEach(([x, y]) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      material,
    );
    block.position.set(x * 0.1, y * 0.1, 0);
    group.add(block);
  });

  group.position.set(0, 1.5, -0.5); // Start above the player
  scene.add(group);

  return group;
}

// Create and drop the tetromino
let currentTetromino = createTetromino();
let speed = 0.01; // Falling speed

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
