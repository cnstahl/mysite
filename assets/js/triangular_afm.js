// --- constants ---
const T_start = 1.5;
const L_start = 60;
const h_start = 0.0;
const Speed_start = 1.0;

// --- mutable variables ---
let T = T_start;
let L = L_start;
let h = h_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Hslider").value = h_start;
document.getElementById("Hval").textContent = h_start.toFixed(1);

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

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    const x = Math.floor(Math.random() * L);
    const y = Math.floor(Math.random() * L);
    const xp = (x + 1) % L, xm = (x - 1 + L) % L;
    const yp = (y + 1) % L, ym = (y - 1 + L) % L;

    // N, S, E, W plus the NW/SE diagonal
    const neighborSum = spin[y][xp] + spin[y][xm] + spin[yp][x] + spin[ym][x] + spin[ym][xm] + spin[yp][xp];
    const dE = -2 * spin[y][x] * (neighborSum - h);   // antiferromagnetic (J = 1) plus field h

    if (dE <= 0 || Math.random() < Math.exp(-dE / T)) {
      spin[y][x] *= -1;
    }
  }
}

function loop() {
  if (running) {
    step();
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

document.getElementById("Hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("Hval").textContent = h.toFixed(1);
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
