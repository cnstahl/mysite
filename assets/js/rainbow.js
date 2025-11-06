// --- constants ---
const h_start = 0;
const L_start = 50;
const Speed_start = 1.0;

// --- mutable variables ---
let h = h_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let m = 3;             // number of nontrivial colors

// --- initialize UI elements ---
document.getElementById("hslider").value = h_start;
document.getElementById("hval").textContent = h_start.toFixed(2);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let horiz, vert, dx, dy;

// color array [black, red, green, blue]
const colors = ["#000000", "#a8003b", "#417865", "#0379ee"];

function initLattice() {
  horiz = Array.from({ length: L }, () => Array(L).fill(0));
  vert  = Array.from({ length: L }, () => Array(L).fill(0));
  dx = W / L;
  dy = H / L;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#000";
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // top horizontal edge
      ctx.lineWidth = horiz[x][y] ? 3 : 1;
      ctx.strokeStyle = colors[horiz[x][y]];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo((x + 1) * dx, y * dy);
      ctx.stroke();

      // left vertical edge
      ctx.lineWidth = vert[x][y] ? 3 : 1;
      ctx.strokeStyle = colors[vert[x][y]];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo(x * dx, (y + 1) * dy);
      ctx.stroke();
    }
  }
}

function totalEnergy() {
  let E = 0;
  for (let y = 0; y < L; y++)
    for (let x = 0; x < L; x++) E += horiz[x][y] + vert[x][y];
  const totalEdges = 2 * L * L;
  return E / totalEdges;
}

function is_flippable(x, y) {
  let i = 0;
  let nontrivial_spins = 0;

  a = horiz[x][y];
  b = horiz[(x + 1) % L][y];
  c = vert[x][y];
  d = vert[x][(y + 1) % L];

  for (const spin of [a, b, c, d]) {
    if (spin !== 0) {
      nontrivial_spins += 1;
      if (i === 0) i = spin;
      else if (spin !== i) return false;  // different nontrivial spins
    }
  }
  return true;
}

function glauber_four() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  let i = 0;
  let nontrivial_spins = 0;

  let old_a = vert[x][y];
  let old_b = vert[(x + 1) % L][y];
  let old_c = horiz[x][y];
  let old_d = horiz[x][(y + 1) % L];

  for (const spin of [old_a, old_b, old_c, old_d]) {
    if (spin !== 0) {
      nontrivial_spins += 1;
      if (i === 0) i = spin;
      else if (spin !== i) return;  // different nontrivial spins
    }
  }

  // if all spins match, then set to random color
  if (old_a == old_b && old_b == old_c && old_c == old_d) {
    i = old_a + ((old_a + Math.floor(Math.random() * (m+1))) % (m+1));  // i might be out of range but we set to i-spins, not i
  }

  let new_a = i-old_a;
  let new_b = i-old_b;
  let new_c = i-old_c;
  let new_d = i-old_d;

  let tot_before = (old_a > 0) + (old_b > 0) + (old_c > 0) + (old_d > 0);
  let tot_after  = (new_a > 0) + (new_b > 0) + (new_c > 0) + (new_d > 0);
  let dE = h * (tot_after - tot_before);

  if (Math.random() < Math.exp(-dE)) {
    vert[x][y] = new_a;
    vert[(x + 1) % L][y] = new_b;
    horiz[x][y] = new_c;
    horiz[x][(y + 1) % L] = new_d;
  }

}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    glauber_four();
  }
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
document.getElementById("hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("hval").textContent = h.toFixed(2);
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
