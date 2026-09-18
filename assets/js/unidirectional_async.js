// --- constants ---
const T_start = 0.6;
const L_start = 150;
const h_start = -.02;
const V_start = 1.0;
const speed_start = 1.0; // simulation speed

// --- mutable variables ---
let L = L_start;
let T = T_start;
let h = h_start;
let V = V_start;
let speed = speed_start;
let running = true;    // pause / resume toggle
let shift_accum = 0;

// --- initialize UI elements ---
document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(1);

document.getElementById("Hslider").value = h_start;
document.getElementById("Hval").textContent = h_start.toFixed(2);

document.getElementById("Vslider").value = V_start;
document.getElementById("Vval").textContent = V_start.toFixed(1);

document.getElementById("Speedslider").value = speed_start;
document.getElementById("Speedval").textContent = speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let spins, dx, dy;

function initLattice() {
  spins = Array.from({ length: L }, () => Array.from({ length: L }, () => [0, 0]));
  dx = W / L;
  dy = H / L;
}

function get_spin(x, y, layer) {
  // periodic boundary conditions
  const X = (x + L) % L;
  const Y = (y + L) % L;
  return spins[X][Y][layer];
}

function set_spin(x, y, layer, value) {
  // periodic boundary conditions
  const X = (x + L) % L;
  const Y = (y + L) % L;
  spins[X][Y][layer] = value;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const a = spins[x][y][0], b = spins[x][y][1];
      if (a === 0 && b === 0) {
        ctx.fillStyle = "#FFFFFF";
      } else if (a === 1 && b === 1) {
        ctx.fillStyle = "#000000";
      } else {
        ctx.fillStyle = "#808080";
      }
      ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }
}

function slide() {
  // make new array to hold updated spins
  const new_spins = Array.from({ length: L }, () => Array.from({ length: L }, () => [0, 0]));
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      new_spins[x][y][0] = get_spin(x - 1, y, 0); // layer 0 slides right
      new_spins[x][y][1] = get_spin(x + 1, y, 1); // layer 1 slides left
    }
  }
  spins = new_spins;
}

function single_vote() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  const layer = Math.floor(Math.random() * 2); // choose layer 0 or 1
  const other = 1 - layer;
  // four neighbors within the same layer, plus the site and its four neighbors on the other layer
  const sum =
    get_spin(x + 1, y, layer) +
    get_spin(x, y + 1, layer) +
    get_spin(x - 1, y, layer) +
    get_spin(x, y - 1, layer) +
    // get_spin(x + 1, y, other) +
    // get_spin(x, y + 1, other) +
    // get_spin(x - 1, y, other) +
    // get_spin(x, y - 1, other) +
    get_spin(x, y, other);

  // Heat bath dynamics
  const prob_up = 1 / (1 + Math.exp(-2 * (sum - 2.5 - h) / T));
  if (Math.random() < prob_up) {
    set_spin(x, y, layer, 1);
  } else {
    set_spin(x, y, layer, 0);
  }
}

function vote(updates) {
  for (let n = 0; n < updates; n++) {
    single_vote();
  }
}

function loop() {
  if (running) {
    shift_accum += speed*V;
    const shifts = Math.floor(shift_accum);
    shift_accum -= shifts;
    for (let s = 0; s < shifts; s++) {
      slide();
    }
    const votes_per_frame = Math.floor(speed * L * L * 2);
    vote(votes_per_frame);
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
  if (T === 0) T = 0.00001; // prevent division by zero
  document.getElementById("Tval").textContent = T.toFixed(1);
});

document.getElementById("Hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("Hval").textContent = h.toFixed(2);
});

document.getElementById("Vslider").addEventListener("input", e => {
  V = parseFloat(e.target.value);
  document.getElementById("Vval").textContent = V.toFixed(1);
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1) + "×";
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

document.getElementById("middleBtn").addEventListener("click", () => {
  // flip a circle in the middle, both layers
  const cx = L / 2, cy = L / 2;
  const r = L / 4;
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const ddx = x - cx, ddy = y - cy;
      if (ddx * ddx + ddy * ddy <= r * r) {
        set_spin(x, y, 0, 1 - get_spin(x, y, 0));
        set_spin(x, y, 1, 1 - get_spin(x, y, 1));
      }
    }
  }
  draw();
});

document.getElementById("slideBtn").addEventListener("click", () => {
  slide();
  draw();
});

document.getElementById("voteBtn").addEventListener("click", () => {
  vote(L*L*2);
  draw();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  initLattice();
  draw();
});

// Initialize
initLattice();
draw();
loop();
