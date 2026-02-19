// --- constants ---
const T_start = 0.6;
const L_start = 156;
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

let spins_A, spins_B, spins_C, dx, dy;

function get_color(value) {
  if (value === 1) {
    return "#000000";
  } else if (value === 0) {
    return "#FFFFFF";
  } else {
    return "#FF00FF"; // error
  }
}

function initLattice() {
  spins_A = Array.from({ length: L/3 }, () => Array(L).fill(0));
  spins_B = Array.from({ length: L/3 }, () => Array(L).fill(0));
  spins_C = Array.from({ length: L/3 }, () => Array(L).fill(0));
  dx = W / L;
  dy = H / L;
}

function get_spin(x, y, sublattice) {
  // periodic boundary conditions
  const X = (x + L) % (L/3);
  // console.log(x, y, array, X);
  const Y = (y + L) % (L);
  const array = (sublattice+3) % 3;
  if (array === 0) {
    return spins_A[X][Y];
  } else if (array === 1) {
    return spins_B[X][Y];
  } else if (array === 2) {
    return spins_C[X][Y];
  }
}

function set_spin(x, y, value, array) {
  // periodic boundary conditions
  const X = (x + L) % (L/3);
  const Y = (y + L) % (L);
  if (array === 0) {
    spins_A[X][Y] = value;
  } else if (array === 1) {
    spins_B[X][Y] = value;
  } else if (array === 2) {
    spins_C[X][Y] = value;
  }
}

function flip_at(x, y) {
  const sublattice = (x + (y % 2)) % 3;
  const this_y = Math.floor(y);
  const this_x = Math.floor(x/3);
  // console.log(x, y, sublattice, this_x, this_y);
  const current = get_spin(this_x, this_y, sublattice);
  set_spin(this_x, this_y, 1 - current, sublattice);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#000000";
  // ctx.fillRect(Math.floor(L/2) * dx, Math.floor(L/2) * dy, dx, dy);
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // Ising spins as black or white squares
      if (y % 2 === 0) {
        let sublattice = x % 3;
        ctx.fillStyle = get_color(get_spin(Math.floor(x/3), Math.floor(y), sublattice));
        ctx.fillRect(x * dx, y * dy, dx, dy);
      }
      else {
        let sublattice = (x + 1) % 3;
        ctx.fillStyle = get_color(get_spin(Math.floor(x/3), Math.floor(y), sublattice));
        // console.log(x, y, sublattice, get_spin(x, y, sublattice));
        ctx.fillRect(x * dx - dx/2, y * dy, dx, dy);
      }
    }
  }
}

function slide() {
  // make new array to hold updated spins
  const new_spins_A = Array.from({ length: L/3 }, () => Array(L).fill(0));
  const new_spins_B = Array.from({ length: L/3 }, () => Array(L).fill(0));
  const new_spins_C = Array.from({ length: L/3 }, () => Array(L).fill(0));
  // shift four sublattices
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L/3; x++) {
      new_spins_A[x][y] = get_spin(x + (y%2), y - 1, 0);
      new_spins_B[x][y] = get_spin(x, y + 2, 1);
      new_spins_C[x][y] = get_spin(x - (y%2), y - 1, 2);
    }
  }
  spins_A = new_spins_A;
  spins_B = new_spins_B;
  spins_C = new_spins_C;
}

function single_vote() {
  const x = Math.floor(Math.random() * L/3);
  const y = Math.floor(Math.random() * L);
  const sublattice = Math.floor(Math.random() * 3);
  // get four neighbors
  let sum = get_spin(x + (sublattice === 2 ? 1 : 0), y, sublattice + 1) +
            get_spin(x - (sublattice === 0 ? 1 : 0), y, sublattice - 1);
  // console.log(x, y, sublattice, sum);
  if (y % 2 === 0) {
    sum += get_spin(x + (sublattice === 2 ? 1 : 0), y - 1, sublattice + 1) +
           get_spin(x - (sublattice === 0 ? 1 : 0), y - 1, sublattice - 1) +
            get_spin(x + (sublattice === 2 ? 1 : 0), y + 1, sublattice + 1) +
            get_spin(x - (sublattice === 0 ? 1 : 0), y + 1, sublattice - 1);
  } else {
    sum += get_spin(x + (sublattice === 2 ? 1 : 0), y + 1, sublattice + 1) +
           get_spin(x - (sublattice === 0 ? 1 : 0), y + 1, sublattice - 1) +
            get_spin(x + (sublattice === 2 ? 1 : 0), y - 1, sublattice + 1) +
            get_spin(x - (sublattice === 0 ? 1 : 0), y - 1, sublattice - 1);
  }

  // Heat bath dynamics
  const prob_up = 1 / (1 + Math.exp(-2 * (sum - 3 - h) / T));
  // console.log(sum, prob_up);
  if (Math.random() < prob_up) {
    set_spin(x, y, 1, sublattice);
  } else {
    set_spin(x, y, 0, sublattice);
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
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      if ((Math.abs(x - L/2) + Math.abs(y - L/2)/2 + (x<L/2)*(y%2)/2) < L/4 && Math.abs(y - L/2) < L/4) {
        flip_at(x, y);
      }
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
  vote(L*L);
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
