import { OrbitControls } from './OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let ball;
let ballVelocity = new THREE.Vector3(0, 0, 0);
let isBallMoving = false;
let moveLeft = false;
let moveRight = false;
let moveForward = false;
let moveBackward = false;
let scored = false;
let totalAttempts = 0;
let successfulShots = 0;
let totalScore = 0;
let gameStarted = false;
let timeLeft = 60;
let timerInterval = null;
let gameOver = false;
let isTimerMode = false;

let highScore = parseInt(localStorage.getItem("highScore")) || 0;
document.getElementById("highScoreText").innerText = `High Score 🏆: ${highScore}`;

document.addEventListener('keydown', (e) => {
  // Start timer on first movement (only in non-timer mode)
  if (!gameStarted && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    gameStarted = true;
  }
  // Prevent any controls if the game is over
  if (gameOver) return;
  // Toggle orbit camera control
  if (e.key === "O") {
    isOrbitEnabled = !isOrbitEnabled;
    showMessage("Camera View Toggled");
  // Ball movement controls
  } else if (e.code === "ArrowLeft") {
    moveLeft = true;
  } else if (e.code === "ArrowRight") {
    moveRight = true;
  } else if (e.code === "ArrowUp") {
    moveForward = true;
  } else if (e.code === "ArrowDown") {
    moveBackward = true;
  }  // Reset the game with 'R'
  else if(e.code == 'KeyR') {
    resetGame();
    showMessage("Game Reset!");
  }  // Start timer mode with 'T'
  else if (e.code === "KeyT") {
    if (!isTimerMode) {
      isTimerMode = true;
      gameOver = false;
      gameStarted = true;
      timeLeft = 60;
      updateTimerDisplay();
      clearInterval(timerInterval); //Ensure no old timer is running
      showMessage("Timer Mode Started ⏱");
      startTimer();
    }
  } // Increase throw power with 'W' (max 100%)
  else if (e.code === "KeyW") {
    throwPower = Math.min(1, throwPower + 0.05); 
    throwPowerText.innerHTML = `Throw Power: ${Math.round(throwPower * 100)}%`;
    powerBar.style.width = `${throwPower * 100}%`; 
  } // Decrease throw power with 'S' (min 0%)
   else if (e.code === "KeyS") {
    throwPower = Math.max(0, throwPower - 0.05); 
    throwPowerText.innerHTML = `Throw Power: ${Math.round(throwPower * 100)}%`;
    powerBar.style.width = `${throwPower * 100}%`; 

  } // Shoot the ball with spacebar
  else if (e.code === "Space" && !isBallMoving) {
    scored = false; // Reset scoring state
    totalAttempts += 1;
    updateStats();

    const x = ball.position.x;
    const z = ball.position.z;

    // Special predefined shooting spots with fixed velocities
    const shootingSpots = [
      { x: 11, z: 0, velocity: new THREE.Vector3(-0.35, 0.6, 0) },
      { x: 10, z: 1, velocity: new THREE.Vector3(-0.33, 0.6, -0.05) },
      { x: -11, z: 0, velocity: new THREE.Vector3(0.35, 0.6, 0) },
      { x: -10, z: -1, velocity: new THREE.Vector3(0.33, 0.6, 0.05) }
    ];

    let usedSpecialShot = false;

    for (const spot of shootingSpots) {
      const dx = Math.abs(x - spot.x);
      const dz = Math.abs(z - spot.z);
      if (dx < 0.5 && dz < 0.5) {
        ballVelocity.copy(spot.velocity.clone().multiplyScalar(throwPower));
        usedSpecialShot = true;
        break;
      }
    }
    // General shooting logic toward the closest hoop
    if (!usedSpecialShot) {
      const leftHoopX = -11;
      const rightHoopX = 11;

      const distanceToLeft = Math.abs(x - leftHoopX);
      const distanceToRight = Math.abs(x - rightHoopX);
      const shootDirection = distanceToLeft < distanceToRight ? -1 : 1;

      const baseX = 0.3;
      const baseY = 0.5;
      ballVelocity.set(baseX * throwPower * shootDirection, baseY * throwPower + 0.2, 0);

    }

    isBallMoving = true;

  }
});

// Handle key release to stop movement
document.addEventListener('keyup', (e) => {
  if (e.code === "ArrowLeft") moveLeft = false;
  if (e.code === "ArrowRight") moveRight = false;
  if (e.code === "ArrowUp") moveForward = false;
  if (e.code === "ArrowDown") moveBackward = false;
});

// Update game stats on the screen (attempts, score, accuracy, etc.)
function updateStats() {
  const accuracy = totalAttempts > 0 ? (successfulShots / totalAttempts * 100).toFixed(1) : 0;
  totalAttemptsText.innerHTML = `Attempts: ${totalAttempts}`;
  successfulShotsText.innerHTML = `Successful Shots: ${successfulShots}`;
  accuracyText.innerHTML = `Accuracy: ${accuracy}%`;
  totalScoreText.innerHTML = `Total Score: ${totalScore}`;
}

// Reset game state to initial values
function resetGame() {
  // Reset ball
  ball.position.set(0, 0.3, 0);
  ballVelocity.set(0, 0, 0);
  isBallMoving = false;
  scored = false;
  // Reset stats
  leftScore = 0;
  rightScore = 0;
  totalAttempts = 0;
  successfulShots = 0;
  totalScore = 0;
  throwPower = 0.5;
  // Update UI
  throwPowerText.innerHTML = `Throw Power: ${Math.round(throwPower * 100)}%`;
  leftScoreText.innerHTML = `Left Score: ${leftScore}`;
  rightScoreText.innerHTML = `Right Score: ${rightScore}`;
  powerBar.style.width = `${throwPower * 100}%`;
  updateStats();
  // Reset timer
  timeLeft = 60;
  gameOver = false;
  gameStarted = false;
  isTimerMode = false;
  clearInterval(timerInterval);
  updateTimerDisplay();
}

// Start the countdown timer (used in Timer Mode)
function startTimer() {
  clearInterval(timerInterval); 
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

// Update the timer text display on screen
function updateTimerDisplay() {
  const timerText = document.getElementById("timerText");
  if (timerText) {
    timerText.innerHTML = `Time Left: ${timeLeft}s`;
  }
}

// Handle game ending when timer reaches zero
function endGame() {
  clearInterval(timerInterval);
  gameOver = true;
  showMessage("Time's up!");
  isBallMoving = true; 

  const summaryDiv = document.getElementById("summaryScreen");
  const acc = totalAttempts > 0 ? (successfulShots / totalAttempts * 100).toFixed(1) : 0;

  document.getElementById("summaryAttempts").innerText = `Total Attempts: ${totalAttempts}`;
  document.getElementById("summarySuccess").innerText = `Successful Shots: ${successfulShots}`;
  document.getElementById("summaryAccuracy").innerText = `Accuracy: ${acc}%`;
  document.getElementById("summaryScore").innerText = `Total Score: ${totalScore}`;

  summaryDiv.style.display = "block";

  const canvas = document.querySelector("canvas");
  if (canvas) canvas.style.display = "none";

  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.onclick = () => {
      resetGame();
      summaryDiv.style.display = "none";
      if (canvas) canvas.style.display = "block";
      // Timer does NOT restart here (only on 'T' key press)
      gameOver = false;
    };
  }

  if (totalScore > highScore) {
    highScore = totalScore;
    localStorage.setItem("highScore", highScore);
    document.getElementById("highScoreText").innerText = `High Score 🏆: ${highScore}`;
    document.getElementById("summaryHighScore").innerText = `High Score 🏆: ${highScore}`;
    showMessage("NEW HIGH SCORE!");
  } else {
    document.getElementById("summaryHighScore").innerText = `High Score 🏆: ${highScore}`;
  }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;                 // Enable shadow support in the renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Softer shadows (optional)
document.body.appendChild(renderer.domElement);

//Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
scene.add(ambientLight);

// Light from Right
const lightRight = new THREE.DirectionalLight(0xffffff, 0.5);
lightRight.position.set(20, 30, 20);
lightRight.castShadow = true;
lightRight.target.position.set(0, 0, 0);
scene.add(lightRight);
scene.add(lightRight.target);

// Light from Left
const lightLeft = new THREE.DirectionalLight(0xffffff, 0.5);
lightLeft.position.set(-20, 30, 20);
lightLeft.castShadow = true;
lightLeft.target.position.set(0, 0, 0);
scene.add(lightLeft);
scene.add(lightLeft.target);

// Configure shadow properties for both lights
[lightRight, lightLeft].forEach(light => {
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 50;
  light.shadow.camera.left = -30;
  light.shadow.camera.right = 30;
  light.shadow.camera.top = 30;
  light.shadow.camera.bottom = -30;
});


// Court + Components 
function createBasketballCourt() {
  // -Court floor-
  // Wooden rectangular floor of the basketball court
  const courtGeometry = new THREE.BoxGeometry(30, 0.2, 15);
  const courtMaterial = new THREE.MeshPhongMaterial({ color: 0xc68642, shininess: 50 });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;  //Getting shadows
  scene.add(court);

  // -Center line-
  // White line dividing the court in half
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.11, -15 / 2),
    new THREE.Vector3(0, 0.11, 15 / 2),
  ]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const centerLine = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(centerLine);

  // -Center circle-
  //White circle at the center of the court
  const circleGeometry = new THREE.CircleGeometry(2, 64);
  const circleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const circle = new THREE.Mesh(circleGeometry, circleMaterial);
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, 0.11, 0);
  circle.receiveShadow = true;
  scene.add(circle);

  
  //-Side three-point arcs-
  // Draws left and right three-point arcs using points along a curve
  function createSideThreePointArc(radius, segments, centerX, centerZ, flipDirection) {
    const points = [];
    const startAngle = flipDirection ? Math.PI / 2 : -Math.PI / 2;
    const endAngle = flipDirection ? (3 * Math.PI) / 2 : Math.PI / 2;
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (i / segments) * (endAngle - startAngle);
      const x = centerX + radius * Math.cos(angle);
      const z = centerZ + radius * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0.11, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const arc = new THREE.Line(geometry, material);
    scene.add(arc);
  }
  createSideThreePointArc(6.75, 64, -13.5, 0, false); // Left arc
  createSideThreePointArc(6.75, 64, 13.5, 0, true); // Right arc

  //-Backboards (left & right)-
  // Transparent white boards behind each basket
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1, 1.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  backboard.position.set(-14.6, 3.05, 0);
  backboard.castShadow = true;  //Casts a shadow
  scene.add(backboard);

  //Right Backboard
  const backboardRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1, 1.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  backboardRight.position.set(14.6, 3.05, 0);
  backboardRight.castShadow = true;
  scene.add(backboardRight);

  // -Rims (left & right)-
  // Orange hoops
  //Left Rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.05, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0xff6600 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(-14.2, 3.05, 0);
  rim.castShadow = true;
  scene.add(rim);

  //Right Rim
  const rimRight = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.05, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0xff6600 })
  );
  rimRight.rotation.x = Math.PI / 2;
  rimRight.position.set(14.2, 3.05, 0);
  rimRight.castShadow = true;
  scene.add(rimRight);

  // -Nets (left & right)-
  // Vertical lines forming the net under each rim
  //Left Net
  const centerXLeft = -14.2;
  const centerZ = 0;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const xTop = centerXLeft + 0.45 * Math.cos(angle);
    const zTop = centerZ + 0.45 * Math.sin(angle);
    const xBottom = centerXLeft + 0.23 * Math.cos(angle); 
    const zBottom = centerZ + 0.2 * Math.sin(angle);
  
    const points = [
      new THREE.Vector3(xTop, 3.05, zTop),
      new THREE.Vector3(xBottom, 2.5, zBottom)
    ];
  
    const netGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const netLine = new THREE.Line(netGeometry, netMaterial);
    scene.add(netLine);
  }

  //Right Net
  const centerXRight = 14.2;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const xTop = centerXRight + 0.45 * Math.cos(angle);
    const zTop = centerZ + 0.45 * Math.sin(angle);
    const xBottom = centerXRight + 0.23 * Math.cos(angle);
    const zBottom = centerZ + 0.2 * Math.sin(angle);
  
    const points = [
      new THREE.Vector3(xTop, 3.05, zTop),
      new THREE.Vector3(xBottom, 2.5, zBottom)
    ];
  
    const netGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const netLine = new THREE.Line(netGeometry, netMaterial);
    scene.add(netLine);
  }

  //-Poles and arms (left & right)-
  // Support structures for the backboards

  // Left Pole
  const poleLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4),
    new THREE.MeshPhongMaterial({ color: 0x555555 })
  );
  poleLeft.position.set(-15.3, 2, 0);
  poleLeft.castShadow = true;
  scene.add(poleLeft);

  // Right Pole
  const poleRight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4),
    new THREE.MeshPhongMaterial({ color: 0x555555 })
  );
  poleRight.position.set(15.3, 2, 0);
  poleRight.castShadow = true;
  scene.add(poleRight);

  //Left Arm
  const armLeft = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 0.1),
    new THREE.MeshPhongMaterial({ color: 0xaaaaaa })
  );
  armLeft.position.set(-14.9, 3.05, 0);
  armLeft.castShadow = true;
  scene.add(armLeft);

  //Right Arm
  const armRight = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 0.1),
    new THREE.MeshPhongMaterial({ color: 0xaaaaaa })
  );
  armRight.position.set(14.9, 3.05, 0);
  armRight.castShadow = true;
  scene.add(armRight);

  // -Center ball-
  // Orange basketball placed in the center of the court
  const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff8000 });
  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, 0.3, 0); 
  ball.castShadow = true;
  scene.add(ball);

  // -Ball seams-
  // Black lines across the ball to simulate basketball seams  
  const seamMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

  // Horizontal line around the ball
  const horizontalSeam = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * 2 * Math.PI;
    const x = 0.3 * Math.cos(angle);
    const z = 0.3 * Math.sin(angle);
    horizontalSeam.push(new THREE.Vector3(x, 0, z)); 
  }
  const horizontalSeamGeometry = new THREE.BufferGeometry().setFromPoints(horizontalSeam);
  const horizontalSeamLine = new THREE.LineLoop(horizontalSeamGeometry, seamMaterial);

  // Vertical line around the ball
  const verticalSeam = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) *  2 * Math.PI;
    const y = 0.3 * Math.cos(angle);
    const z = 0.3 * Math.sin(angle);
    verticalSeam.push(new THREE.Vector3(0, y, z)); 
  }
  const verticalSeamGeometry = new THREE.BufferGeometry().setFromPoints(verticalSeam);
  const verticalSeamLine = new THREE.Line(verticalSeamGeometry, seamMaterial);
  ball.add(horizontalSeamLine);
  ball.add(verticalSeamLine);
}

function addFreeThrowAreaLines(scene) {
  const scaleFactor = 1.14;

  const paintWidth = 5.4 * scaleFactor;
  const paintLength = 3.6 * scaleFactor;
  const dashedCircleRadius = paintLength / 2;
  const courtHalfLength = 15;
  const courtWidth = 14;

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const dashedMaterial = new THREE.LineDashedMaterial({
    color: 0xffffff,
    dashSize: 0.2,
    gapSize: 0.1,
  });

  for (let direction of [-1, 1]) {
    const paintEndX = direction * courtHalfLength;
    const paintStartX = paintEndX - direction * paintWidth;
    const circleCenterX = paintStartX;

    // -Free throw rectangle-
    // Draws the painted area ("the key") near each basket
    const paintPoints = [
      new THREE.Vector3(paintStartX, 0.11, -paintLength / 2),
      new THREE.Vector3(paintStartX, 0.11, paintLength / 2),
      new THREE.Vector3(paintEndX, 0.11, paintLength / 2),
      new THREE.Vector3(paintEndX, 0.11, -paintLength / 2),
      new THREE.Vector3(paintStartX, 0.11, -paintLength / 2)
    ];
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(paintPoints),
      lineMaterial
    ));

    // -Free throw line-
    // Vertical line at the edge of the painted area
    const freeThrowLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(paintStartX, 0.11, -paintLength / 2),
        new THREE.Vector3(paintStartX, 0.11, paintLength / 2),
      ]),
      lineMaterial
    );
    scene.add(freeThrowLine);

    // -Dashed half-circle (facing basket)-
    // Draws outer dashed semicircle around free throw area
    const dashedHalf = new THREE.EllipseCurve(
      0, 0,
      dashedCircleRadius, dashedCircleRadius,
      direction === 1 ? -Math.PI / 2 : Math.PI / 2,
      direction === 1 ? Math.PI / 2 : 3 * Math.PI / 2,
      false
    );
    const dashedPoints = dashedHalf.getPoints(50).map(p =>
      new THREE.Vector3(circleCenterX + p.x, 0.11, p.y)
    );
    const dashedGeometry = new THREE.BufferGeometry().setFromPoints(dashedPoints);
    const dashedLine = new THREE.Line(dashedGeometry, dashedMaterial);
    dashedLine.computeLineDistances();
    scene.add(dashedLine);

    // -Solid half-circle (facing court center)-
    // Inner solid semicircle of free throw area
    const solidHalf = new THREE.EllipseCurve(
      0, 0,
      dashedCircleRadius, dashedCircleRadius,
      direction === 1 ? Math.PI / 2 : -Math.PI / 2,
      direction === 1 ? 3 * Math.PI / 2 : Math.PI / 2,
      false
    );
    const solidPoints = solidHalf.getPoints(50).map(p =>
      new THREE.Vector3(circleCenterX + p.x, 0.11, p.y)
    );
    const solidGeometry = new THREE.BufferGeometry().setFromPoints(solidPoints);
    scene.add(new THREE.Line(solidGeometry, lineMaterial));

    // -Three-point arc (side)-
    // Creates a semi-arc for each side of the court
    const threePointRadius = courtWidth / 2;
    const threePointCurve = new THREE.EllipseCurve(
      0, 0,
      threePointRadius, threePointRadius,
      Math.PI / 2, 3 * Math.PI / 2,
      direction === -1
    );
    const arcPoints = threePointCurve.getPoints(60).map(p =>
      new THREE.Vector3(paintEndX, 0.11, p.y)
    );
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcLine = new THREE.Line(arcGeometry, lineMaterial);

    if (direction === 1 && window.rightArc) scene.remove(window.rightArc);
    if (direction === -1 && window.leftArc) scene.remove(window.leftArc);

    if (direction === 1) window.rightArc = arcLine;
    if (direction === -1) window.leftArc = arcLine;

    scene.add(arcLine);
  }
}

function addStadiumTribunes(scene) {
  // Parameters for the tribune steps (height, width, depth, color)
  const steps = 5; // Number of steps in each tribune
  const stepDepth = 1;
  const stepHeight = 0.4;
  const stepWidth = 30; // Matches the court length

  const tribuneColor = '#a9a9a9'; // Light gray color

  // Loop to create and position each step of the tribunes
  for (let i = 0; i < steps; i++) {
    const geometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
    const material = new THREE.MeshStandardMaterial({ color: tribuneColor });
    
    // Right-side tribune step
    const rightTribune = new THREE.Mesh(geometry, material);
    rightTribune.position.set(
      0,
      stepHeight / 2 + i * stepHeight,
      7.5 + i * stepDepth + 1
    );
    scene.add(rightTribune);

    // Left-side tribune step
    const leftTribune = new THREE.Mesh(geometry, material);
    leftTribune.position.set(
      0,
      stepHeight / 2 + i * stepHeight,
      -7.5 - i * stepDepth - 1
    );
    scene.add(leftTribune);
  }
}

createBasketballCourt();
addFreeThrowAreaLines(scene);
addStadiumTribunes(scene);

// Camera
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);


// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

document.addEventListener('keydown', (e) => {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
});

// -Score Display-

let leftScore = 0;
let rightScore = 0;

// Left score text
let leftScoreText = document.createElement('div');
leftScoreText.style.position = 'absolute';
leftScoreText.style.top = '10px';
leftScoreText.style.left = '10px';
leftScoreText.style.color = 'white';
leftScoreText.style.fontSize = '20px';
leftScoreText.innerHTML = `Left Score: ${leftScore}`;
document.body.appendChild(leftScoreText);

// Right score text
let rightScoreText = document.createElement('div');
rightScoreText.style.position = 'absolute';
rightScoreText.style.top = '10px';
rightScoreText.style.right = '10px';
rightScoreText.style.color = 'white';
rightScoreText.style.fontSize = '20px';
rightScoreText.innerHTML = `Right Score: ${rightScore}`;
document.body.appendChild(rightScoreText);

// Check if the ball has passed through one of the hoops (from above)
function ballScored(ballPosition) {
  const hoopCenters = [
    new THREE.Vector3(14.2, 3.05, 0), // Right hoop center 
    new THREE.Vector3(-14.2, 3.05, 0) // Left hoop center 
  ];

  for (const center of hoopCenters) {
    const dx = ballPosition.x - center.x;
    const dz = ballPosition.z - center.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    const isWithinRim = horizontalDistance < 0.45;
    const isBelowRim = ballPosition.y < 3.05 && ballPosition.y > 2.4;

    if (isWithinRim && isBelowRim) {
      return true;
    }
  }

  return false;
}

function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();
  renderer.render(scene, camera);

  if (!isBallMoving) {
    const moveSpeed = 0.2;
    if (moveLeft) ball.position.x -= moveSpeed;
    if (moveRight) ball.position.x += moveSpeed;
    if (moveForward) ball.position.z -= moveSpeed;
    if (moveBackward) ball.position.z += moveSpeed;

    ball.position.x = Math.max(-14.5, Math.min(14.5, ball.position.x));
    ball.position.z = Math.max(-7, Math.min(7, ball.position.z));
  }

  const velocityLength = ballVelocity.length();
  if (velocityLength > 0.05) {
    const rotationAxis = new THREE.Vector3().copy(ballVelocity).normalize().cross(new THREE.Vector3(0, 1, 0)).normalize();
    const rotationAngle = velocityLength * 0.05;
    ball.rotateOnAxis(rotationAxis, rotationAngle);
  }

  if (isBallMoving) {
    const timeFactor = 0.65;
    ballVelocity.y -= 0.02 * timeFactor;
    ball.position.addScaledVector(ballVelocity, timeFactor);

    if (ball.position.y <= 0.3) {
      ball.position.y = 0.3;
      if (Math.abs(ballVelocity.y) > 0.1) {
        ballVelocity.y *= -0.7;
        ballVelocity.x *= 0.95;
        ballVelocity.z *= 0.95;
      } else {
        ballVelocity.set(0, 0, 0);
        isBallMoving = false;

        if (!scored) {
          showMessage("MISSED SHOT");
        }
      }
    }

    if (ball.position.x < -14.7 || ball.position.x > 14.7) {
      ballVelocity.x *= -0.5;
      ball.position.x = THREE.MathUtils.clamp(ball.position.x, -14.7, 14.7);
    }

    if (ball.position.z < -9.8 || ball.position.z > 9.8) {
      ballVelocity.z *= -0.5;
      ball.position.z = THREE.MathUtils.clamp(ball.position.z, -9.8, 9.8);
    }

    //Accurate shooting test based on real entry into the basket
    if (!scored && ballScored(ball.position) && ballVelocity.y < 0) {
      scored = true;
      totalScore += 2;
      successfulShots += 1;
      showMessage("SHOT MADE!");

      if (ball.position.x > 0) {
        rightScore += 2;
        rightScoreText.innerHTML = `Right Score: ${rightScore}`;
      } else {
        leftScore += 2;
        leftScoreText.innerHTML = `Left Score: ${leftScore}`;
      }

      updateStats();
    }
  }
}

function showMessage(msg) {
  const messageText = document.getElementById("messageText");
  messageText.innerHTML = msg;
  setTimeout(() => {
    messageText.innerHTML = '';
  }, 1000);
}

// Initial throw power value (50%)
let throwPower = 0.5;

// Create and style the throw power text element (e.g., "Throw Power: 50%")
let throwPowerText = document.createElement('div');
throwPowerText.style.position = 'absolute';
throwPowerText.style.bottom = '50px';
throwPowerText.style.right = '10px';
throwPowerText.style.color = 'white';
throwPowerText.style.fontSize = '20px';
throwPowerText.innerHTML = `Throw Power: ${Math.round(throwPower * 100)}%`;
document.body.appendChild(throwPowerText);

// Create container for power bar (frame)
const powerBarContainer = document.createElement('div');
powerBarContainer.style.position = 'absolute';
powerBarContainer.style.bottom = '20px';
powerBarContainer.style.right = '10px';
powerBarContainer.style.width = '200px';
powerBarContainer.style.height = '20px';
powerBarContainer.style.border = '2px solid white';
powerBarContainer.style.backgroundColor = 'black';
document.body.appendChild(powerBarContainer);

// Create inner fill bar that represents the current throw power
const powerBar = document.createElement('div');
powerBar.style.height = '100%';
powerBar.style.width = `${throwPower * 100}%`;
powerBar.style.backgroundColor = 'yellow';
powerBarContainer.appendChild(powerBar);

// Start the animation loop (defined elsewhere)
animate();