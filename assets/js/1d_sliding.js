// --- constants ---
const T_start = 0.6;
const L_start = 150;
const h_start = -.02;
const V_start = 1.0;
const Speed_start = 1.0;
const J = 1.0; // per-neighbor coupling weight implicit in the vote formula

// --- mutable variables ---
let L = L_start;
let T = T_start;
let h = h_start;
let V = V_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let shift_accum = 0;
let steps_remain = 0;

// --- initialize UI elements ---
document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(2);

document.getElementById("Hslider").value = h_start;
document.getElementById("Hval").textContent = h_start.toFixed(2);

document.getElementById("Vslider").value = V_start;
document.getElementById("Vval").textContent = V_start.toFixed(1);

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

function updateDelta() {
  const beta = 1 / T;
  const delta = 1 / (1 + Math.exp(-2 * beta * (J - Math.abs(h))));
  document.getElementById("Deltaval").textContent = delta.toFixed(4);
}
updateDelta();

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let spins, history, dx, dy;

// display colors: both layers 0 -> white, both 1 -> black, disagree -> grey
const colors = ["#FFFFFF", "#000000", "#808080"];

function initLattice() {
  spins = [Array(L).fill(0), Array(L).fill(0)];
  history = Array.from({ length: L }, () => Array(L).fill(0));
  dx = W / L;
  dy = H / L;
}

function get_spin(i, layer) {
  return spins[layer][(i + L) % L];
}

function set_spin(i, layer, value) {
  spins[layer][(i + L) % L] = value;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      ctx.fillStyle = colors[history[y][x]];
      ctx.fillRect(x * dx, y * dy, dx, dy);
    }
  }
}

function slide() {
  const new_spins = [Array(L).fill(0), Array(L).fill(0)];
  for (let i = 0; i < L; i++) {
    new_spins[0][i] = get_spin(i - 1, 0); // layer 0 slides right
    new_spins[1][i] = get_spin(i + 1, 1); // layer 1 slides left
  }
  spins = new_spins;
}

function single_vote() {
  const i = Math.floor(Math.random() * L);
  const layer = Math.floor(Math.random() * 2); // choose layer 0 or 1
  const other = 1 - layer;
  // two neighbors within the same layer, plus the site on the other layer
  const sum = get_spin(i - 1, layer) + get_spin(i + 1, layer) + get_spin(i, other);

  // Heat bath dynamics
  const prob_up = 1 / (1 + Math.exp(-2 * (sum - 1.5 - h) / T));
  set_spin(i, layer, Math.random() < prob_up ? 1 : 0);
}

function vote(updates) {
  for (let n = 0; n < updates; n++) {
    single_vote();
  }
}

function record() {
  // shift the spacetime history down a row and log the current combined state
  for (let y = L - 1; y > 0; y--) {
    for (let x = 0; x < L; x++) {
      history[y][x] = history[y - 1][x];
    }
  }
  for (let x = 0; x < L; x++) {
    const a = get_spin(x, 0), b = get_spin(x, 1);
    history[0][x] = (a === 0 && b === 0) ? 0 : (a === 1 && b === 1) ? 1 : 2;
  }
}

function generation() {
  shift_accum += V;
  while (shift_accum >= 1) {
    slide();
    shift_accum -= 1;
  }
  vote(2 * L); // one sweep's worth of asynchronous single-site updates
  record();
}

function loop() {
  if (running) {
    steps_remain += speed;
    while (steps_remain > 1) {
      generation();
      steps_remain--;
    }
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
  document.getElementById("Tval").textContent = T.toFixed(2);
  updateDelta();
});

document.getElementById("Hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("Hval").textContent = h.toFixed(2);
  updateDelta();
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
  // flip a segment in the middle, both layers
  for (let i = Math.floor(2*L / 5); i < Math.floor(3 * L / 5); i++) {
    set_spin(i, 0, 1 - get_spin(i, 0));
    set_spin(i, 1, 1 - get_spin(i, 1));
  }
  record();
  draw();
});

document.getElementById("slideBtn").addEventListener("click", () => {
  slide();
  record();
  draw();
});

document.getElementById("voteBtn").addEventListener("click", () => {
  vote(2 * L);
  record();
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
