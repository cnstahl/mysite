// --- constants ---
const T_start = 3.0;
const L_start = 50;
const Speed_start = 1.0;

// --- mutable variables ---
let T = T_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let stepAccum = 0;     // fractional step accumulator, lets speed < 1 work

// --- initialize UI elements ---
document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let spin, dx, dy;

function initLattice() {
  spin = Array.from({ length: L }, () => Array.from({ length: L }, () => (Math.random() < 0.5 ? 1 : -1)));
  dx = W / L;
  dy = H / L;
}

function draw() {
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      ctx.fillStyle = spin[y][x] === 1 ? "#000000" : "#ffffff";
      ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }
}

// noise probability applied to each spin after a majority-vote half-step:
// -> 0 as T -> 0 (exact majority vote), -> 0.5 as T grows (coin flip)
function noiseProb() {
  return 1 / (1 + Math.exp(2 / T));
}

function verticalStep() {
  const p = noiseProb();
  const next = Array.from({ length: L }, () => Array(L).fill(0));
  for (let y = 0; y < L; y++) {
    const yp = (y + 1) % L, ym = (y - 1 + L) % L;
    for (let x = 0; x < L; x++) {
      const sum = spin[ym][x] + spin[y][x] + spin[yp][x];
      let majority = sum > 0 ? 1 : -1;
      if (Math.random() < p) majority *= -1;
      next[y][x] = majority;
    }
  }
  spin = next;
}

function horizontalStep() {
  const p = noiseProb();
  const next = Array.from({ length: L }, () => Array(L).fill(0));
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const xp = (x + 1) % L, xm = (x - 1 + L) % L;
      const sum = spin[y][xm] + spin[y][x] + spin[y][xp];
      let majority = sum > 0 ? 1 : -1;
      if (Math.random() < p) majority *= -1;
      next[y][x] = majority;
    }
  }
  spin = next;
}

function step() {
  verticalStep();
  horizontalStep();
}

function loop() {
  if (running) {
    stepAccum += speed;
    while (stepAccum >= 1) {
      step();
      stepAccum -= 1;
    }
    draw();
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("Tslider").addEventListener("input", e => {
  T = parseFloat(e.target.value);
  document.getElementById("Tval").textContent = T.toFixed(1);
});

document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  document.getElementById("Lval").textContent = L;
  initLattice();
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1) + "×";
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

// Initialize
initLattice();
draw();
loop();
