// --- constants ---
const T_start = 3.0;
const L_start = 50;
const Speed_start = 1.0;

// --- mutable variables ---
let T = T_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle

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
      // if even sublattice, majority of upper spins; otherwise majority of lower spins
      if (x % 2) {
        if (y % 2) {
          new_spins[x][y] = get_spin(x, y - 2);
        } else {
          new_spins[x][y] = get_spin(x - 2, y);
        }
      } else {
        if (y % 2) {
          new_spins[x][y] = get_spin(x, y + 2);
        } else {
          new_spins[x][y] = get_spin(x + 2, y);
        }
      }
    }
  }
  spins = new_spins;
}

function vote() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    const x = Math.floor(Math.random() * L);;
    const y = Math.floor(Math.random() * L);
    // majority vote among self and four neighbors
    const sum =
      get_spin(x, y) +
      get_spin(x + 1, y) +
      get_spin(x, y + 1) +
      get_spin(x - 1, y) +
      get_spin(x, y - 1);
    spins[x][y] = (sum >=3) ? 1 : 0;
  } 
}

function step() {
  slide();
  vote();
}

function loop() {
  if (running) {
    step();
    draw();
    // const e = totalEnergy();
    // document.getElementById("Edisp").textContent = e.toFixed(3);
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
