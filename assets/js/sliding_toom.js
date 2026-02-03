// --- constants ---
const T_start = 1.0;
const L_start = 50;
const h_start = 0;
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
  spins = Array.from({ length: L }, () => Array(L).fill(0));
  dx = W / L;
  dy = H / L;
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
  ctx.strokeStyle = "#000000";
  // ctx.fillRect(Math.floor(L/2) * dx, Math.floor(L/2) * dy, dx, dy);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // Ising spins as black or white squares
      if (spins[x][y] === 1) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(x * dx, y * dy, dx, dy);
      } else if (spins[x][y] === 0) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x * dx, y * dy, dx, dy);
      } else {
        ctx.fillStyle = "#FF00FF"; // error
        ctx.fillRect(x * dx, y * dy, dx, dy);
      }
    }
  }
}

function slide() {
  // make new array to hold updated spins
  const new_spins = Array.from({ length: L }, () => Array(L).fill(0));
  // shift four sublattices
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      if (x % 2) {
        if (y % 2) {
          new_spins[x][y] = get_spin(x + 2, y);
        } else {
          new_spins[x][y] = get_spin(x-1, y-1);
        }
      } else {
        if (y % 2) {
          new_spins[x][y] = get_spin(x-1, y-1);
        } else {
          new_spins[x][y] = get_spin(x, y + 2);
        }
      }
    }
  }
  spins = new_spins;
}

function single_vote() {
  const x = Math.floor(Math.random() * L);;
  const y = Math.floor(Math.random() * L);
  // get four neighbors
  const sum =
    get_spin(x + 1, y) +
    get_spin(x, y + 1) +
    get_spin(x - 1, y) +
    get_spin(x, y - 1);

  // Heat bath dynamics
  const prob_up = 1 / (1 + Math.exp(-2 * (sum - 2 - h) / T));
  // console.log(sum, prob_up);
  if (Math.random() < prob_up) {
    set_spin(x, y, 1);
  } else {
    set_spin(x, y, 0);
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
    const votes_per_frame = Math.floor(speed * L * L);
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
  // flip middle square
  for (let y = Math.floor(L/4); y <= Math.floor(3*L/4); y++) {
    for (let x = Math.floor(L/4); x <= Math.floor(3*L/4); x++) {
      set_spin(x, y, 1 - get_spin(x, y));
    }
  }
  draw();
  // console.log("Flipped middle square");
});

document.getElementById("slideBtn").addEventListener("click", () => {
  slide();
  draw();
});

document.getElementById("voteBtn").addEventListener("click", () => {
  vote();
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
