import * as THREE from "./node_modules/three/build/three.module.js";

// Constants for game
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 1;

class ARTetris {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Game state
    this.board = Array(BOARD_HEIGHT)
      .fill()
      .map(() => Array(BOARD_WIDTH).fill(0));
    this.currentPiece = null;
    this.gameOver = false;

    this.init();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.z = 25;
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(ambientLight, directionalLight);

    // Create game board frame
    this.createBoardFrame();

    // Start game loop
    this.animate();

    // Setup controls
    this.setupControls();

    // Spawn first piece
    this.spawnNewPiece();
  }

  createBoardFrame() {
    const geometry = new THREE.BoxGeometry(
      BOARD_WIDTH * BLOCK_SIZE,
      BOARD_HEIGHT * BLOCK_SIZE,
      BLOCK_SIZE * 0.1,
    );
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.2,
    });
    const frame = new THREE.Mesh(geometry, material);
    frame.position.set(0, 0, 0);
    this.scene.add(frame);
  }

  // Tetromino definitions
  getTetrominos() {
    return {
      I: {
        shape: [[1, 1, 1, 1]],
        color: 0x00ffff,
      },
      O: {
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: 0xffff00,
      },
      T: {
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        color: 0xff00ff,
      },
      L: {
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
        color: 0xff8c00,
      },
      J: {
        shape: [
          [0, 1],
          [0, 1],
          [1, 1],
        ],
        color: 0x0000ff,
      },
      S: {
        shape: [
          [0, 1, 1],
          [1, 1, 0],
        ],
        color: 0x00ff00,
      },
      Z: {
        shape: [
          [1, 1, 0],
          [0, 1, 1],
        ],
        color: 0xff0000,
      },
    };
  }

  spawnNewPiece() {
    const pieces = this.getTetrominos();
    const types = Object.keys(pieces);
    const type = types[Math.floor(Math.random() * types.length)];

    this.currentPiece = {
      type: type,
      shape: pieces[type].shape,
      color: pieces[type].color,
      x:
        Math.floor(BOARD_WIDTH / 2) -
        Math.floor(pieces[type].shape[0].length / 2),
      y: BOARD_HEIGHT - pieces[type].shape.length,
      mesh: null,
    };

    this.createPieceMesh();
  }

  createPieceMesh() {
    if (this.currentPiece.mesh) {
      this.scene.remove(this.currentPiece.mesh);
    }

    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const material = new THREE.MeshPhongMaterial({
      color: this.currentPiece.color,
    });

    const pieceMesh = new THREE.Group();

    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const block = new THREE.Mesh(geometry, material);
          block.position.set(
            (x + this.currentPiece.x - BOARD_WIDTH / 2) * BLOCK_SIZE,
            (y + this.currentPiece.y - BOARD_HEIGHT / 2) * BLOCK_SIZE,
            0,
          );
          pieceMesh.add(block);
        }
      }
    }

    this.currentPiece.mesh = pieceMesh;
    this.scene.add(pieceMesh);
  }

  rotatePiece() {
    const rotated = [];
    const M = this.currentPiece.shape.length;
    const N = this.currentPiece.shape[0].length;

    for (let i = 0; i < N; i++) {
      rotated[i] = [];
      for (let j = 0; j < M; j++) {
        rotated[i][j] = this.currentPiece.shape[M - 1 - j][i];
      }
    }

    const oldShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;

    if (this.checkCollision()) {
      this.currentPiece.shape = oldShape;
    } else {
      this.createPieceMesh();
    }
  }

  checkCollision() {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;

          if (
            boardX < 0 ||
            boardX >= BOARD_WIDTH ||
            boardY < 0 ||
            boardY >= BOARD_HEIGHT ||
            this.board[boardY][boardX]
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  movePiece(dx, dy) {
    this.currentPiece.x += dx;
    this.currentPiece.y += dy;

    if (this.checkCollision()) {
      this.currentPiece.x -= dx;
      this.currentPiece.y -= dy;

      if (dy < 0) {
        this.lockPiece();
        this.clearLines();
        this.spawnNewPiece();

        if (this.checkCollision()) {
          this.gameOver = true;
          console.log("Game Over!");
        }
      }
      return false;
    }

    this.createPieceMesh();
    return true;
  }

  lockPiece() {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;
          this.board[boardY][boardX] = {
            color: this.currentPiece.color,
          };
        }
      }
    }
    this.updateBoardMesh();
  }

  clearLines() {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (this.board[y].every((cell) => cell !== 0)) {
        // Remove the line
        this.board.splice(y, 1);
        // Add new empty line at the top
        this.board.push(Array(BOARD_WIDTH).fill(0));
        // Update visuals
        this.updateBoardMesh();
      }
    }
  }

  updateBoardMesh() {
    // Remove old board blocks
    this.scene.children = this.scene.children.filter(
      (child) => child !== this.currentPiece.mesh && !child.isStaticBlock,
    );

    // Create new blocks for locked pieces
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.board[y][x]) {
          const material = new THREE.MeshPhongMaterial({
            color: this.board[y][x].color,
          });
          const block = new THREE.Mesh(geometry, material);
          block.isStaticBlock = true;
          block.position.set(
            (x - BOARD_WIDTH / 2) * BLOCK_SIZE,
            (y - BOARD_HEIGHT / 2) * BLOCK_SIZE,
            0,
          );
          this.scene.add(block);
        }
      }
    }
  }

  setupControls() {
    document.addEventListener("keydown", (event) => {
      if (this.gameOver) return;

      switch (event.key) {
        case "ArrowLeft":
          this.movePiece(-1, 0);
          break;
        case "ArrowRight":
          this.movePiece(1, 0);
          break;
        case "ArrowDown":
          this.movePiece(0, -1);
          break;
        case "ArrowUp":
        case "Space":
          this.rotatePiece();
          break;
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!this.gameOver) {
      // Auto-drop piece every second
      const currentTime = Date.now();
      if (!this.lastDropTime) this.lastDropTime = currentTime;

      if (currentTime - this.lastDropTime > 1000) {
        this.movePiece(0, -1);
        this.lastDropTime = currentTime;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize game
const game = new ARTetris();

// Handle window resize
window.addEventListener("resize", () => {
  game.camera.aspect = window.innerWidth / window.innerHeight;
  game.camera.updateProjectionMatrix();
  game.renderer.setSize(window.innerWidth, window.innerHeight);
});
