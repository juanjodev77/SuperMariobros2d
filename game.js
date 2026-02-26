// Get a reference to the canvas element
const canvas = document.getElementById('gameCanvas');
// Get the 2D rendering context
const ctx = canvas.getContext('2d');

// Game Constants
const gravity = 0.5;
const maxFallSpeed = 10;
const friction = 0.8;
const acceleration = 0.4;
const frameDuration = 1/60;

// Game State
let gameState = 'PLAYING'; // 'PLAYING', 'GAMEOVER', 'WIN'
let lastTime = 0;

// Camera
const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height
};

// Mario Representation
const mario = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  color: 'blue',
  velocityX: 0,
  velocityY: 0,
  maxSpeed: 5,
  jumpStrength: 12,
  isJumping: false,
  onGround: true,
  lives: 3,
  score: 0,
  isInvincible: false,
  invincibilityDuration: 1.5,
  invincibilityTimer: 0,
  stompBounceStrength: 8
};

// Platforms
const platforms = [
  { x: 0, y: 580, width: 1000, height: 20, color: '#654321' },
  { x: 1200, y: 580, width: 800, height: 20, color: '#654321' },
  { x: 2200, y: 580, width: 800, height: 20, color: '#654321' },
  { x: 150, y: 500, width: 100, height: 20, color: 'green' },
  { x: 300, y: 420, width: 100, height: 20, color: 'green' },
  { x: 450, y: 340, width: 100, height: 20, color: 'green' },
  { x: 600, y: 260, width: 100, height: 20, color: 'green' },
  { x: 800, y: 500, width: 200, height: 20, color: 'green' },
  { x: 1050, y: 420, width: 150, height: 20, color: 'purple' },
  { x: 1300, y: 340, width: 100, height: 20, color: 'green' },
  { x: 1500, y: 260, width: 100, height: 20, color: 'green' },
  { x: 1700, y: 500, width: 200, height: 20, color: 'green' },
  { x: 2000, y: 420, width: 100, height: 20, color: 'green' },
  { x: 2300, y: 340, width: 100, height: 20, color: 'green' },
  { x: 2500, y: 500, width: 400, height: 20, color: 'green' },
];

// Enemies
const enemies = [
  { x: 160, y: 470, width: 30, height: 30, color: 'red', speed: 1, direction: 1, patrolStartX: 150, patrolEndX: 240 },
  { x: 850, y: 470, width: 30, height: 30, color: 'orange', speed: 1.2, direction: -1, patrolStartX: 800, patrolEndX: 970 },
  { x: 1350, y: 470, width: 30, height: 30, color: 'red', speed: 1, direction: 1, patrolStartX: 1300, patrolEndX: 1470 },
  { x: 1850, y: 470, width: 30, height: 30, color: 'red', speed: 1, direction: 1, patrolStartX: 1800, patrolEndX: 1970 },
  { x: 2600, y: 470, width: 30, height: 30, color: 'orange', speed: 1.5, direction: -1, patrolStartX: 2500, patrolEndX: 2870 }
];

// Coins
const coins = [
  { x: 200, y: 460, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 350, y: 380, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 500, y: 300, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 650, y: 220, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 850, y: 460, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 1150, y: 380, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 1450, y: 300, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 1650, y: 220, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 2150, y: 380, width: 15, height: 15, color: 'yellow', collected: false },
  { x: 2350, y: 300, width: 15, height: 15, color: 'yellow', collected: false },
];

// Goal
const goal = {
  x: 2850,
  y: 400,
  width: 20,
  height: 180,
  color: 'gold'
};

// Input handling
const keys = { left: false, right: false, up: false };
document.addEventListener('keydown', (e) => {
  if (gameState !== 'PLAYING' && (e.key === 'r' || e.key === 'R')) {
    restartGame();
  }
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp' || e.key === ' ') keys.up = true;
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'ArrowUp' || e.key === ' ') keys.up = false;
});

// Mobile Controls
const setupButtonListener = (id, keyName) => {
  const btn = document.getElementById(id);
  const press = (e) => { e.preventDefault(); keys[keyName] = true; };
  const release = (e) => { e.preventDefault(); keys[keyName] = false; };
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
  btn.addEventListener('touchstart', press);
  btn.addEventListener('touchend', release);
};
setupButtonListener('btnLeft', 'left');
setupButtonListener('btnRight', 'right');
setupButtonListener('btnJump', 'up');

// Logic Functions
function update(dt) {
  if (gameState !== 'PLAYING') return;

  // Horizontal movement with acceleration and friction
  if (keys.left) {
    mario.velocityX -= acceleration;
  } else if (keys.right) {
    mario.velocityX += acceleration;
  } else {
    mario.velocityX *= friction;
    if (Math.abs(mario.velocityX) < 0.1) mario.velocityX = 0;
  }

  // Cap horizontal speed
  if (mario.velocityX > mario.maxSpeed) mario.velocityX = mario.maxSpeed;
  if (mario.velocityX < -mario.maxSpeed) mario.velocityX = -mario.maxSpeed;

  // Jump
  if (keys.up && mario.onGround) {
    mario.velocityY = -mario.jumpStrength;
    mario.onGround = false;
    mario.isJumping = true;
  }

  // Apply gravity and variable jump height
  if (!mario.onGround) {
    let currentGravity = gravity;
    // If we are jumping and released the jump key early, fall faster (shorter jump)
    if (mario.velocityY < 0 && !keys.up) {
        currentGravity *= 2.5;
    }
    mario.velocityY += currentGravity;
    if (mario.velocityY > maxFallSpeed) mario.velocityY = maxFallSpeed;
  }

  // Temporary variables for collision detection
  let nextX = mario.x + mario.velocityX;
  let nextY = mario.y + mario.velocityY;
  let prevY = mario.y;

  mario.onGround = false;

  // Platform collision
  platforms.forEach(p => {
    if (nextX < p.x + p.width && nextX + mario.width > p.x &&
        nextY < p.y + p.height && nextY + mario.height > p.y) {

      // Collision from top
      if (mario.velocityY >= 0 && (prevY + mario.height) <= p.y) {
        nextY = p.y - mario.height;
        mario.velocityY = 0;
        mario.onGround = true;
        mario.isJumping = false;
      }
      // Collision from bottom
      else if (mario.velocityY < 0 && prevY >= (p.y + p.height)) {
        nextY = p.y + p.height;
        mario.velocityY = 0;
      }
      // Side collisions
      else {
        if (mario.velocityX > 0 && mario.x + mario.width <= p.x) {
          nextX = p.x - mario.width;
        } else if (mario.velocityX < 0 && mario.x >= p.x + p.width) {
          nextX = p.x + p.width;
        }
      }
    }
  });

  mario.x = nextX;
  mario.y = nextY;

  // World boundaries
  if (mario.x < 0) mario.x = 0;
  // if (mario.x + mario.width > canvas.width) mario.x = canvas.width - mario.width; // Allow moving beyond canvas width
  if (mario.y > canvas.height) {
    mario.lives--;
    if (mario.lives <= 0) {
        gameState = 'GAMEOVER';
    } else {
        // Reset to last safe position or just start
        mario.x = Math.max(0, mario.x - 200);
        mario.y = 0;
        mario.velocityY = 0;
        mario.isInvincible = true;
        mario.invincibilityTimer = mario.invincibilityDuration;
    }
  }

  // Coin collision
  coins.forEach(coin => {
    if (!coin.collected &&
        mario.x < coin.x + coin.width && mario.x + mario.width > coin.x &&
        mario.y < coin.y + coin.height && mario.y + mario.height > coin.y) {
      coin.collected = true;
      mario.score += 50;
    }
  });

  // Goal collision
  if (mario.x < goal.x + goal.width && mario.x + mario.width > goal.x &&
      mario.y < goal.y + goal.height && mario.y + mario.height > goal.y) {
    gameState = 'WIN';
  }

  // Invincibility timer
  if (mario.isInvincible) {
    mario.invincibilityTimer -= dt;
    if (mario.invincibilityTimer <= 0) {
      mario.isInvincible = false;
    }
  }

  // Update enemies
  enemies.forEach(enemy => {
    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x <= enemy.patrolStartX) {
      enemy.x = enemy.patrolStartX;
      enemy.direction = 1;
    } else if (enemy.x >= enemy.patrolEndX) {
      enemy.x = enemy.patrolEndX;
      enemy.direction = -1;
    }

    // Mario-Enemy collision
    if (!mario.isInvincible &&
        mario.x < enemy.x + enemy.width && mario.x + mario.width > enemy.x &&
        mario.y < enemy.y + enemy.height && mario.y + mario.height > enemy.y) {

      if (mario.velocityY > 0 && (mario.y + mario.height - mario.velocityY) <= enemy.y) {
        // Stomp
        enemies.splice(enemies.indexOf(enemy), 1);
        mario.velocityY = -mario.stompBounceStrength;
        mario.score += 100;
      } else {
        // Hit
        mario.lives--;
        if (mario.lives <= 0) {
          gameState = 'GAMEOVER';
        } else {
          mario.isInvincible = true;
          mario.invincibilityTimer = mario.invincibilityDuration;
        }
      }
    }
  });

  // Camera Follow
  camera.x = mario.x - canvas.width / 2 + mario.width / 2;
  if (camera.x < 0) camera.x = 0;
}

// Draw Functions
function drawBackground() {
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, '#87CEEB'); // Sky Blue
  skyGradient.addColorStop(1, '#E0F6FF'); // Lighter Blue
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x * 0.3, 0); // Parallax effect

  // Simple clouds
  ctx.fillStyle = 'white';
  for (let i = 0; i < 15; i++) {
    const x = i * 400 + 100;
    const y = 80 + (i % 4) * 40;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 10, 20, 0, Math.PI * 2);
    ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // Simple hills
  ctx.fillStyle = '#2d5a27'; // Darker Green
  for (let i = 0; i < 15; i++) {
    const x = i * 500 - 100;
    const y = 580;
    ctx.beginPath();
    ctx.moveTo(x - 150, y);
    ctx.quadraticCurveTo(x + 100, y - 120, x + 350, y);
    ctx.fill();
  }

  ctx.restore();
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Draw Platforms
  platforms.forEach(p => {
    ctx.fillStyle = p.color || 'gray';
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });

  // Draw Goal
  ctx.fillStyle = goal.color;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

  // Draw Coins
  coins.forEach(coin => {
    if (!coin.collected) {
      ctx.fillStyle = coin.color;
      ctx.beginPath();
      ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Draw Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    // Body
    ctx.fillRect(e.x, e.y, e.width, e.height);
    // Eyes
    ctx.fillStyle = 'black';
    ctx.fillRect(e.x + 5, e.y + 5, 4, 4);
    ctx.fillRect(e.x + e.width - 9, e.y + 5, 4, 4);
    // Feet
    ctx.fillStyle = '#440000';
    ctx.fillRect(e.x, e.y + e.height - 5, 10, 5);
    ctx.fillRect(e.x + e.width - 10, e.y + e.height - 5, 10, 5);
  });

  // Draw Mario
  if (!mario.isInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
    // Body
    ctx.fillStyle = mario.color;
    ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
    // Hat
    ctx.fillStyle = 'red';
    ctx.fillRect(mario.x - 2, mario.y, mario.width + 4, 8);
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(mario.x + 22, mario.y + 12, 10, 10);
    ctx.fillStyle = 'black';
    ctx.fillRect(mario.x + 26, mario.y + 14, 4, 4);
    // Overall/Strap
    ctx.fillStyle = 'red';
    ctx.fillRect(mario.x + 5, mario.y + 20, 10, mario.height - 20);
    ctx.fillRect(mario.x + mario.width - 15, mario.y + 20, 10, mario.height - 20);
  }

  ctx.restore();

  // Draw HUD
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 3;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  
  ctx.strokeText(`Lives: ${mario.lives}`, 20, 40);
  ctx.fillText(`Lives: ${mario.lives}`, 20, 40);
  
  ctx.strokeText(`Score: ${mario.score}`, 150, 40);
  ctx.fillText(`Score: ${mario.score}`, 150, 40);

  // Draw Screens
  if (gameState === 'GAMEOVER') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 50);
  } else if (gameState === 'WIN') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'yellow';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${mario.score}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Press R to Play Again', canvas.width / 2, canvas.height / 2 + 100);
  }
}

function restartGame() {
  mario.x = 50;
  mario.y = 0;
  mario.velocityX = 0;
  mario.velocityY = 0;
  mario.lives = 3;
  mario.score = 0;
  mario.onGround = false;
  mario.isInvincible = false;
  gameState = 'PLAYING';
  coins.forEach(c => c.collected = false);
  // In a more complex game we would reset enemy positions too
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// Initial Position
mario.y = platforms[0].y - mario.height;

requestAnimationFrame(gameLoop);
