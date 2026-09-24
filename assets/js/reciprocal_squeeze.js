// --- constants ---
const L_start = 300;
const T_start = 0.0;
const J_start = 1.0;
const R_start = 0.0;
const h_start = 0.0;
const p_start = 0.0;
const Speed_start = 1.0;

// --- mutable variables ---
let L = L_start;
let T = T_start;
let J = J_start;
let R = R_start;
let h = h_start;
let p = p_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

// --- initialize UI elements ---
document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Pslider").value = p_start;
document.getElementById("Pval").textContent = p_start.toFixed(3);

document.getElementById("Jslider").value = J_start;
document.getElementById("Jval").textContent = J_start.toFixed(2);

document.getElementById("Rslider").value = R_start;
document.getElementById("Rval").textContent = R_start.toFixed(3);

document.getElementById("Hslider").value = h_start;
document.getElementById("Hval").textContent = h_start.toFixed(3);

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
      // y grows North, so flip vertically when drawing to the canvas (which grows downward)
      ctx.fillRect(x * dx, (L - 1 - y) * dy, dx, dy);
    }
  }
}

// the selfish energy term centered on site (x, y)
function site_energy(x, y) {
  const xp = (x + 1) % L;
  const yp = (y + 1) % L, ym = (y - 1 + L) % L;
  const spin_C = spin[y][x];
  const spin_N = spin[yp][x], spin_E = spin[y][xp], spin_S = spin[ym][x];
  return -J * (Math.min(spin_N, spin_E) + Math.max(spin_E, spin_S)) * spin_C - h * spin_C;
}

// every term of H containing spin (x, y): its own at full weight, plus the terms
// centered on S, W, N (which see it as their N, E, S neighbor) at weight R
function update_energy(x, y) {
  const xm = (x - 1 + L) % L;
  const yp = (y + 1) % L, ym = (y - 1 + L) % L;
  return site_energy(x, y) + R * (site_energy(x, ym) + site_energy(xm, y) + site_energy(x, yp));
}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    const x = Math.floor(Math.random() * L);
    const y = Math.floor(Math.random() * L);

    // with probability p the update is an error: flip the spin regardless of energy
    if (Math.random() < p) {
      spin[y][x] *= -1;
      continue;
    }

    // energy with the spin held up vs down
    spin[y][x] = 1;
    const energy_up = update_energy(x, y);
    spin[y][x] = -1;
    const energy_down = update_energy(x, y);

    // divide by 1 + 3|R| so the field scale is comparable across R. |R| matters: the
    // divisor would vanish at R = -1/3 and go negative below it, flipping the sign of dE
    const dE = (energy_up - energy_down);

    // heat bath: resample the spin from its conditional distribution.
    // at T = 0 the exponent diverges but the Boltzmann factor does not, so this stays
    // finite; the dE = 0 case is spelled out because 0/0 would be NaN, and ties are
    // common here (min = -1, max = +1 at h = 0)
    const prob_up = dE === 0 ? 0.5 : 1 / (1 + Math.exp(dE / T));
    spin[y][x] = Math.random() < prob_up ? 1 : -1;
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
document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  document.getElementById("Lval").textContent = L;
  initLattice();
});

document.getElementById("Tslider").addEventListener("input", e => {
  T = parseFloat(e.target.value);
  document.getElementById("Tval").textContent = T.toFixed(1);
});

document.getElementById("Jslider").addEventListener("input", e => {
  J = parseFloat(e.target.value);
  document.getElementById("Jval").textContent = J.toFixed(2);
});

document.getElementById("Rslider").addEventListener("input", e => {
  R = parseFloat(e.target.value);
  document.getElementById("Rval").textContent = R.toFixed(3);
});

document.getElementById("Hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("Hval").textContent = h.toFixed(3);
});

document.getElementById("Pslider").addEventListener("input", e => {
  p = parseFloat(e.target.value);
  document.getElementById("Pval").textContent = p.toFixed(3);
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

document.getElementById("randomBtn").addEventListener("click", () => {
  initLattice();
  draw();
});

document.getElementById("allUpBtn").addEventListener("click", () => {
  for (let y = 0; y < L; y++)
    for (let x = 0; x < L; x++) spin[y][x] = 1;
  draw();
});

document.getElementById("allDownBtn").addEventListener("click", () => {
  for (let y = 0; y < L; y++)
    for (let x = 0; x < L; x++) spin[y][x] = -1;
  draw();
});

// Initialize
initLattice();
draw();
loop();
