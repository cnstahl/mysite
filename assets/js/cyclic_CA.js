// --- constants ---
const L_start = 50;
const N_start = 5;  // number of colors
const T_start = 1;  // synchronicity factor
const V_start = 0.1;  // drive rate
const s_start = 1.0;  // updates per site per frame

// Precomputed tables for spin angles
let cosTable = [];
let sinTable = [];
let cosTable_offset = [];
let sinTable_offset = [];

// --- mutable variables ---
let N = N_start;
let L = L_start;
let T = T_start;
let V = V_start;
let speed = s_start;
let running = true;    // pause / resume toggle
let frame = 0;
const skip = 1;  // frames to skip between updates
let colors = [];

// --- initialize UI elements ---
document.getElementById("Nslider").value = N_start;
document.getElementById("Nval").textContent = N_start;

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(2);

document.getElementById("Driveslider").value = V_start;
document.getElementById("Driveval").textContent = V_start.toFixed(2);

document.getElementById("Speedslider").value = speed;
document.getElementById("Speedval").textContent = speed.toFixed(1);

// --- main simulation code ---

const ctx = document.getElementById("lattice").getContext("2d");
const W = ctx.canvas.width, H = ctx.canvas.height;

let spins, dx, dy;

function initLattice() {
  // random initial spins
  spins = Array.from({ length: L }, () => Array(L).fill(0));
  dx = W / L;
  dy = H / L;
}

function randomizeLattice() {
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      spins[x][y] = Math.floor(Math.random() * N);
    }
  }
}

function initSim() {
  colors = [];
  for (let i = 0; i < N; i++) {
    const hue = (i / N) * 360;
    colors.push(`hsl(${hue}, 100%, 50%)`);
  }
  cosTable = new Array(N);
  sinTable = new Array(N);
  for (let n = 0; n < N; n++) {
    const theta = 2 * Math.PI * (n) / N;
    cosTable[n] = Math.cos(theta);
    sinTable[n] = Math.sin(theta);
    cosTable_offset[n] = Math.cos(theta + V);
    sinTable_offset[n] = Math.sin(theta + V);
  }
}

function get_spin(x, y) {
  // periodic boundary conditions
  const X = (x + L) % L;
  const Y = (y + L) % L;
  return spins[X][Y];
}

function set_spin(x, y, value) {
  // periodic boundary conditions
  const X = (x + L) % L;
  const Y = (y + L) % L;
  spins[X][Y] = value;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // ctx.fillRect(Math.floor(L/2) * dx, Math.floor(L/2) * dy, dx, dy);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // draw square from spectrum based on spin value
      ctx.fillStyle = colors[get_spin(x, y)];
      ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }
}

function update() {
  for (let i = 0; i < speed*L*L; i++) {
    const x = Math.floor(Math.random() * L);
    const y = Math.floor(Math.random() * L);
    updateSite(x, y);
  }
}

function updateSite(x, y) {
  // 1. Compute local field
  let hx = 0.0, hy = 0.0;
  for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
    const nj = get_spin(x + dx, y + dy);
    hx += cosTable_offset[nj];
    hy += sinTable_offset[nj];
  }

  // 2. Compute Boltzmann weights (with stabilization)
  let weights = new Array(N);
  let maxA = -Infinity;

  let maxN = 0;
  for (let n = 0; n < N; n++) {
    const a = (hx * cosTable[n] + hy * sinTable[n]) / T;
    weights[n] = a;
    if (a > maxA) {
      maxA = a;
      maxN = n;
    }
  }

  // 3. Exponentiate and normalize
  let Z = 0.0;
  for (let n = 0; n < N; n++) {
    weights[n] = Math.exp(weights[n] - maxA);
    Z += weights[n];
  }

  // 4. Sample from the discrete distribution
  let r = Math.random() * Z;
  let cum = 0.0;
  for (let n = 0; n < N; n++) {
    cum += weights[n];
    if (r < cum) {
      set_spin(x, y, n);
      return;
    }
  }

  // Fallback (numerical safety)
  set_spin(x, y, N-1);
}


function step() {
  update();
}

function loop() {
  if (running) {
    if (frame % (skip + 1) === 0) {
      step();
    }
    draw();
    // const e = totalEnergy();
    // document.getElementById("Edisp").textContent = e.toFixed(3);
    frame++;
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("Nslider").addEventListener("input", e => {
  N = parseInt(e.target.value);
  document.getElementById("Nval").textContent = N;
  initSim();
  initLattice();
  randomizeLattice();
});

document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  document.getElementById("Lval").textContent = L;
  initLattice();
  randomizeLattice();
});

document.getElementById("Tslider").addEventListener("input", e => {
  T = parseFloat(e.target.value);
  if (T === 0) T = 0.0001;  // prevent division by zero
  document.getElementById("Tval").textContent = T.toFixed(2);
});

document.getElementById("Driveslider").addEventListener("input", e => {
  V = parseFloat(e.target.value);
  document.getElementById("Driveval").textContent = V.toFixed(2);
  initSim();
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1);
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  initLattice();
  draw();
});

document.getElementById("randomBtn").addEventListener("click", () => {
  randomizeLattice();
  draw();
});

// Initialize
initLattice();
initSim();
draw();
loop();
