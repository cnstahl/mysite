// --- constants ---
const L_start = 100;
const T_start = 1.0;
const K_start = 0.0;
const h_start = 0.0;
const Speed_start = 1.0;

// --- mutable variables ---
let L = L_start;
let T = T_start;
let K = K_start;
let h = h_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Kslider").value = K_start;
document.getElementById("Kval").textContent = K_start.toFixed(1);

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

    // tentative flip and energy change
    const energy_before = energy_near(x, y);
    spin[y][x] *= -1;  // flip
    const energy_after = energy_near(x, y);
    const dE = energy_after - energy_before;

    // flip back if not accepted
    if (Math.random() >= Math.exp(-dE / T)) {
      spin[y][x] *= -1;
    }
  }
}

function energy_near(x, y) {
  const xp = (x + 1) % L, xm = (x - 1 + L) % L;
  const yp = (y + 1) % L, ym = (y - 1 + L) % L;
  const xp2 = (x + 2) % L, xm2 = (x - 2 + L) % L;
  const yp2 = (y + 2) % L, ym2 = (y - 2 + L) % L;
  const spin_C  = spin[y][x];
  const spin_N  = spin[yp][x],  spin_S  = spin[ym][x],  spin_E  = spin[y][xp],  spin_W  = spin[y][xm];
  const spin_NN = spin[yp2][x], spin_SS = spin[ym2][x], spin_EE = spin[y][xp2], spin_WW = spin[y][xm2];

  const DW_N = spin_C * spin_N;
  const DW_S = spin_C * spin_S;
  const DW_E = spin_C * spin_E;
  const DW_W = spin_C * spin_W;

  const DW_energy = -1 * (DW_N + DW_S + DW_E + DW_W);

  // // external field depends on domain wall configuration
  // var spin_energies = 0;
  // // spin_energies += -h * spin_C * (DW_N + DW_S - DW_E - DW_W);  
  // if (DW_N === -1 || DW_S === -1) spin_energies += -h * spin_C;
  // if (DW_E === -1 || DW_W === -1) spin_energies += h * spin_C;
  // return DW_energy + spin_energies;
  const spin_energy = -h * spin_C;

  const K_energy = -K * (spin_NN * spin_N * spin_C + spin_N * spin_C * spin_S + spin_C * spin_S * spin_SS) -
                    -K * (spin_EE * spin_E * spin_C + spin_E * spin_C * spin_W + spin_C * spin_W * spin_WW);
  return DW_energy + spin_energy + K_energy;
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

document.getElementById("Hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("Hval").textContent = h.toFixed(1);
});

document.getElementById("Kslider").addEventListener("input", e => {
  K = parseFloat(e.target.value);
  document.getElementById("Kval").textContent = K.toFixed(1);
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
