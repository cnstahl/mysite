// --- constants ---
const T_start = 1.5;
const J_NE_start = 1.0;
const J_SW_start = 0.5;
const L_start = 200;
const Speed_start = 1.0;

// --- mutable variables ---
let T = T_start;
let L = L_start;
let J_NE = J_NE_start;
let J_SW = J_SW_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("J_NEslider").value = J_NE_start;
document.getElementById("J_NEval").textContent = J_NE_start.toFixed(1);

document.getElementById("J_SWslider").value = J_SW_start;
document.getElementById("J_SWval").textContent = J_SW_start.toFixed(1);

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

function totalMagnetization() {
  let M = 0;
  for (let y = 0; y < L; y++)
    for (let x = 0; x < L; x++) M += spin[y][x];
  return M / (L * L);
}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    const x = Math.floor(Math.random() * L);
    const y = Math.floor(Math.random() * L);
    const xp = (x + 1) % L, xm = (x - 1 + L) % L;
    const yp = (y + 1) % L, ym = (y - 1 + L) % L;

    let field = 0;
    // field += J_NE * (spin[y][xp] + spin[ym][x]);
    // field += J_SW * (spin[y][xm] + spin[yp][x]);
    field += J_NE*spin[y][xp] + J_SW*spin[y][xm] + spin[ym][x] + spin[yp][x];
    const dE = 2 * spin[y][x] * field;

    if (Math.random() < (1.0/(1.0 + Math.exp(dE / T)))) {
      spin[y][x] *= -1;
    }
  }
}

function loop() {
  if (running) {
    step();
    draw();
    // const m = totalMagnetization();
    // document.getElementById("Edisp").textContent = m.toFixed(3);
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

document.getElementById("J_NEslider").addEventListener("input", e => {
  J_NE = parseFloat(e.target.value);
  document.getElementById("J_NEval").textContent = J_NE.toFixed(1);
});

document.getElementById("J_SWslider").addEventListener("input", e => {
  J_SW = parseFloat(e.target.value);
  document.getElementById("J_SWval").textContent = J_SW.toFixed(1);
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1) + "×";
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

document.getElementById("circleBtn").addEventListener("click", () => {
  // flip a circle of spins in the middle
  const cx = L / 2, cy = L / 2;
  const r = L / 4;
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const ddx = x - cx, ddy = y - cy;
      if (ddx * ddx + ddy * ddy <= r * r) {
        spin[y][x] *= -1;
      }
    }
  }
  draw();
});

// Initialize
initLattice();
draw();
loop();
