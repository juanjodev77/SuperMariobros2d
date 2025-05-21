// Get a reference to the canvas element
const canvas = document.getElementById('gameCanvas');
// Get the 2D rendering context
const ctx = canvas.getContext('2d');

// Game Constants
const gravity = 0.6;
const maxFallSpeed = 10;
let gameOver = false; // Game Over State
const frameDuration = 1/60; // Approximate frame duration in seconds for timers

// Mario Representation
const mario = {
  x: 50,
  y: canvas.height - 60,
  width: 40,
  height: 40,
  color: 'blue',
  originalColor: 'blue',
  velocityX: 0,
  velocityY: 0,
  speed: 4,
  jumpStrength: 13,
  isJumping: false,
  onGround: true,
  lives: 3,
  score: 0, // Added score property
  isInvincible: false,
  invincibilityDuration: 1.5,
  invincibilityTimer: 0,
  stompBounceStrength: 8
};

// Platform Definition (unchanged)
const platforms = [
  { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, color: '#654321' },
  { x: 150, y: canvas.height - 100, width: 150, height: 20, color: 'green' },
  { x: 400, y: canvas.height - 180, width: 120, height: 20, color: 'green' },
  { x: 600, y: canvas.height - 250, width: 100, height: 20, color: 'green' },
  { x: 300, y: canvas.height - 350, width: 100, height: 20, color: 'purple' }
];

// Enemy Definition (unchanged)
const enemyHeight = 30;
const enemyWidth = 30;
const enemies = [
  {
    x: platforms[1].x + 10, y: platforms[1].y - enemyHeight,
    width: enemyWidth, height: enemyHeight, color: 'red', speed: 1, direction: 1,
    patrolStartX: platforms[1].x, patrolEndX: platforms[1].x + platforms[1].width - enemyWidth
  },
  {
    x: platforms[2].x + 50, y: platforms[2].y - enemyHeight,
    width: enemyWidth, height: enemyHeight, color: 'orange', speed: 0.8, direction: -1,
    patrolStartX: platforms[2].x, patrolEndX: platforms[2].x + platforms[2].width - enemyWidth
  }
];

// Keyboard input state (unchanged)
const keys = { left: false, right: false, up: false };
document.addEventListener('keydown', function(event) {
  if (gameOver) return;
  if (event.key === 'ArrowLeft') keys.left = true;
  else if (event.key === 'ArrowRight') keys.right = true;
  else if (event.key === 'ArrowUp' || event.key === ' ') keys.up = true;
});
document.addEventListener('keyup', function(event) {
  if (gameOver) return;
  if (event.key === 'ArrowLeft') keys.left = false;
  else if (event.key === 'ArrowRight') keys.right = false;
  else if (event.key === 'ArrowUp' || event.key === ' ') keys.up = false;
});

// Button References and Event Listeners (unchanged)
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnJump = document.getElementById('btnJump');
const setupButtonListener = (button, keyName) => {
  const press = (e) => { if (gameOver || !e) return; e.preventDefault(); keys[keyName] = true; };
  const release = (e) => { if (gameOver || !e) return; e.preventDefault(); keys[keyName] = false; };
  button.addEventListener('mousedown', press);
  button.addEventListener('mouseup', release);
  button.addEventListener('mouseleave', release);
  button.addEventListener('touchstart', press);
  button.addEventListener('touchend', release);
};
setupButtonListener(btnLeft, 'left');
setupButtonListener(btnRight, 'right');
setupButtonListener(btnJump, 'up');

// Function to draw UI (Score and Lives)
function drawUI() {
  ctx.fillStyle = 'white'; // Color for the text
  ctx.font = '18px Arial'; // Font size and type
  ctx.textAlign = 'left'; // Align text to the left

  // Display Lives
  ctx.fillText("Lives: " + mario.lives, 10, 25); // Position: 10px from left, 25px from top

  // Display Score
  ctx.fillText("Score: " + mario.score, 100, 25); // Position: 100px from left, 25px from top
}

// Function to draw Mario (unchanged from previous step with invincibility flash)
function drawMario() {
  if (mario.isInvincible) {
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }
  }
  ctx.fillStyle = mario.color;
  ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
}

// Function to draw Platforms (unchanged)
function drawPlatforms() {
  platforms.forEach(platform => {
    ctx.fillStyle = platform.color || 'gray';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });
}

// Function to draw Enemies (unchanged)
function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

// Function to update Enemy Positions (unchanged)
function updateEnemies() {
  enemies.forEach(enemy => {
    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x <= enemy.patrolStartX) {
      enemy.x = enemy.patrolStartX; enemy.direction = 1;
    } else if (enemy.x >= enemy.patrolEndX) {
      enemy.x = enemy.patrolEndX; enemy.direction = -1;
    }
  });
}

// Mario-Enemy Collision Detection and Handling (unchanged)
function checkMarioEnemyCollisions() {
  if (mario.isInvincible) return;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (mario.x < enemy.x + enemy.width &&
        mario.x + mario.width > enemy.x &&
        mario.y < enemy.y + enemy.height &&
        mario.y + mario.height > enemy.y) {
      const marioBottom = mario.y + mario.height;
      const enemyTop = enemy.y;
      if (mario.velocityY > 0 && (marioBottom - mario.velocityY) <= enemyTop) {
        console.log("Enemy stomped!");
        enemies.splice(i, 1);
        mario.velocityY = -mario.stompBounceStrength;
        mario.isJumping = true;
        mario.onGround = false;
        // mario.score += 100; // Score will be updated here later
      } else {
        if (!mario.isInvincible) {
            mario.lives--;
            mario.isInvincible = true;
            mario.invincibilityTimer = mario.invincibilityDuration;
            console.log("Mario hit! Lives left: " + mario.lives);
            if (mario.lives <= 0) {
                console.log("Game Over");
                gameOver = true;
            }
        }
      }
    }
  }
}

// Update Mario's Position and Handle Collisions (platform part largely unchanged)
function updateMarioPosition() {
  mario.onGround = false;

  if (keys.left) mario.velocityX = -mario.speed;
  else if (keys.right) mario.velocityX = mario.speed;
  else mario.velocityX = 0;
  
  const prevMarioY = mario.y;
  let appliedvelocityY = mario.velocityY;

  if (keys.up && mario.onGround) {
    appliedvelocityY = -mario.jumpStrength;
    mario.isJumping = true;
    mario.onGround = false;
  }

  if (!mario.onGround) {
      appliedvelocityY += gravity;
      if (appliedvelocityY > maxFallSpeed) appliedvelocityY = maxFallSpeed;
  }

  let nextMarioX = mario.x + mario.velocityX;
  let nextMarioY = mario.y + appliedvelocityY;

  platforms.forEach(platform => {
    if (nextMarioX < platform.x + platform.width &&
        nextMarioX + mario.width > platform.x &&
        nextMarioY < platform.y + platform.height &&
        nextMarioY + mario.height > platform.y) {
      if (appliedvelocityY >= 0 && (prevMarioY + mario.height) <= platform.y && (nextMarioY + mario.height) >= platform.y) {
        nextMarioY = platform.y - mario.height;
        appliedvelocityY = 0;
        mario.isJumping = false;
        mario.onGround = true;
      }
      else if (appliedvelocityY < 0 && prevMarioY >= (platform.y + platform.height) && nextMarioY <= (platform.y + platform.height)) {
        nextMarioY = platform.y + platform.height;
        appliedvelocityY = Math.max(0, appliedvelocityY + gravity);
      }
      else {
          if (mario.velocityX > 0 && (nextMarioX + mario.width) >= platform.x && (prevMarioY + mario.height) > platform.y && prevMarioY < (platform.y + platform.height) && (mario.x + mario.width) <= platform.x) {
              nextMarioX = platform.x - mario.width; mario.velocityX = 0;
          }
          else if (mario.velocityX < 0 && nextMarioX <= (platform.x + platform.width) && (prevMarioY + mario.height) > platform.y && prevMarioY < (platform.y + platform.height) && mario.x >= (platform.x + platform.width)) {
              nextMarioX = platform.x + platform.width; mario.velocityX = 0;
          }
      }
    }
  });
  
  mario.velocityY = appliedvelocityY;
  mario.x = nextMarioX;
  mario.y = nextMarioY;

  if (mario.x < 0) { mario.x = 0; mario.velocityX = 0; }
  if (mario.x + mario.width > canvas.width) { mario.x = canvas.width - mario.width; mario.velocityX = 0; }
  if (mario.y < 0) { mario.y = 0; if (mario.velocityY < 0) mario.velocityY = 0; }

  if (mario.isInvincible) {
    mario.invincibilityTimer -= frameDuration;
    if (mario.invincibilityTimer <= 0) {
      mario.isInvincible = false;
    }
  }
}

// Game Loop
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "24px sans-serif";
    ctx.fillText("Refresh to try again.", canvas.width / 2, canvas.height / 2 + 50);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlatforms();
  drawMario();
  drawEnemies();
  
  updateMarioPosition();
  updateEnemies();
  checkMarioEnemyCollisions();
  
  drawUI(); // Draw UI elements last

  requestAnimationFrame(gameLoop);
}

// Initial setup (unchanged)
platforms[0].y = canvas.height - platforms[0].height;
platforms[0].width = canvas.width;
mario.y = platforms[0].y - mario.height;
mario.onGround = true;
enemies.forEach(enemy => {
    let platformToSitOn = platforms.find(p => enemy.x >= p.x && enemy.x + enemy.width <= p.x + p.width && enemy.y + enemy.height === p.y) ||
                         platforms.find(p => enemy.x >= p.x && enemy.x + enemy.width <= p.x + p.width) ||
                         platforms[0];
    enemy.y = platformToSitOn.y - enemy.height;
    enemy.patrolStartX = platformToSitOn.x;
    enemy.patrolEndX = platformToSitOn.x + platformToSitOn.width - enemy.width;
    if(enemy.patrolEndX <= enemy.patrolStartX) enemy.patrolEndX = enemy.patrolStartX;
    enemy.x = Math.max(enemy.patrolStartX, Math.min(enemy.x, enemy.patrolEndX));
});

console.log("game.js loaded with UI display. Starting game loop.");
gameLoop();
