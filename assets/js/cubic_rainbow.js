// --- constants ---
const h_start = 0;
const f_start = 0;
const L_start = 32;
const T_start = 0;
const Speed_start = 1.0;

// --- mutable variables ---
let h = h_start;
let F = f_start;
let T = T_start;
let L = L_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let m = 3;             // number of nontrivial colors
let n_membs = 0;

// (m+1)x(m+1)x(m+1)x(m+1) table, 1 if the face is not allowed
// initially fill with zeros, then set to one if there is an odd number of any nontrivial color
let face_table = new Uint8Array((m+1) * (m+1) * (m+1) * (m+1));
for (let a = 0; a <= m; a++) {
  for (let b = 0; b <= m; b++) {
    for (let c = 0; c <= m; c++) {
      for (let d = 0; d <= m; d++) {
        // set to one if there is an odd number of any nontrivial color
        let counts = new Array(m+1).fill(0);
        counts[a] += 1;
        counts[b] += 1;
        counts[c] += 1;
        counts[d] += 1;
        if ((counts[1] % 2 === 1) || (counts[2] % 2 === 1) || (counts[3] % 2 === 1)) {
          face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d] = 
                ((counts[1] % 2 === 1) + (counts[2] % 2 === 1) + (counts[3] % 2 === 1));
          continue;
        }
        // set to one if a>0, b>0, a!=b, and c!=b
        if (a > 0 && b > 0 && a != b && c != b) {
          face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d] = 1;
        }
      }
    }
  }
}

// --- initialize UI elements ---
document.getElementById("hslider").value = h_start;
document.getElementById("hval").textContent = h_start.toFixed(2);

document.getElementById("fslider").value = f_start;
document.getElementById("fval").textContent = f_start.toFixed(2);

document.getElementById("Tslider").value = T_start;
document.getElementById("Tval").textContent = T_start.toFixed(2);

document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let dx, dy;

// color array [black, red, green, blue]
const colors = ["#000000", "#a8003b", "#417865", "#0379ee"];

// getters and setters for spins
function getSpin(x, y, z, dir) {
  x = (x + L) % L;
  y = (y + L) % L;
  z = (z + L) % L;
  return spins[dir * L * L * L + z * L * L + y * L + x];
}

function setSpin(x, y, z, dir, value) {
  x = (x + L) % L;
  y = (y + L) % L;
  z = (z + L) % L;
  spins[dir * L * L * L + z * L * L + y * L + x] = value;
}

// now do a 3d lattice with cubic rainbow colors
function initLattice() {
  spins = new Uint8Array(L * L * L * 3); // reset spins
  dx = W / L;
  dy = H / L;
}

function initRed() {
  for (let z = 0; z < L; z++) {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        setSpin(x, y, z, 0, 1); // set all x-spins to red
        setSpin(x, y, z, 1, 1);
        setSpin(x, y, z, 2, 1);
      }
    }
  }
}

function insertMembrane() {
  initLattice();
  let color = 0;
  for (let j = 0; j < n_membs; j++) {
    const y = j+5;
    color = (color + Math.floor(Math.random() * (m-1) + 1)) % m; // random nontrivial color
    for (let z = 0; z < L; z++) {
      for (let x = 0; x < L; x++) {
        setSpin(x, y, z, 1, color+1);
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#000";
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      // top horizontal edge
      ctx.lineWidth = getSpin(x, y, 0, 1) ? 3 : 1;
      ctx.strokeStyle = colors[getSpin(x, y, 0, 1)];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo((x - 1) * dx, y * dy);
      ctx.stroke();

      // left vertical edge
      ctx.lineWidth = getSpin(x, y, 0, 0) ? 3 : 1;
      ctx.strokeStyle = colors[getSpin(x, y, 0, 0)];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo(x * dx, (y - 1) * dy);
      ctx.stroke();
    }
  }
}

function is_flippable(x, y, z) {
  let i = 0;
  let nontrivial_spins = 0;

  a = getSpin(x, y, z, 0);
  b = getSpin(x - 1, y, z, 0);
  c = getSpin(x, y, z, 1);
  d = getSpin(x, y - 1, z, 1);
  e = getSpin(x, y, z, 2);
  f = getSpin(x, y, z - 1, 2);

  for (const spin of [a, b, c, d, e, f]) {
    if (spin !== 0) {
      nontrivial_spins += 1;
      if (i === 0) i = spin;
      else if (spin !== i) return false;  // different nontrivial spins
    }
  }
  return true;
}

function is_aligned(x, y, z) {
  min_triv = 1;
  a = getSpin(x, y, z, 0);
  b = getSpin(x - 1, y, z, 0);
  c = getSpin(x, y, z, 1);
  d = getSpin(x, y - 1, z, 1);
  e = getSpin(x, y, z, 2);
  f = getSpin(x, y, z - 1, 2);
  // if (a != 0 && a != b && b != 0 && c == 0 && d == 0 && e == 0 && f == 0) return true;
  // if (c != 0 && c != d && d != 0 && a == 0 && b == 0 && e == 0 && f == 0) return true;
  // if (e != 0 && e != f && f != 0 && a == 0 && b == 0 && c == 0 && d == 0) return true;
  if (a !== 0 && a !== b && b !== 0 && (((c === 0) + (d === 0) + (e === 0) + (f === 0)) > min_triv)) return true;
  if (c !== 0 && c !== d && d !== 0 && (((a === 0) + (b === 0) + (e === 0) + (f === 0)) > min_triv)) return true;
  if (e !== 0 && e !== f && f !== 0 && (((a === 0) + (b === 0) + (c === 0) + (d === 0)) > min_triv)) return true;
  return false;
}

function cube_term(x, y, z) {
  return !is_aligned(x, y, z);
}

function total_cube() {
  let total = 0;
  for (let z = 0; z < L; z++) {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        total += cube_term(x, y, z);
      }
    }
  }
  return total;
}

function glauber_six() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  const z = Math.floor(Math.random() * L);
  let i = 0;
  let spins_before = 0;

  let old_a = getSpin(x, y, z, 0);
  let old_b = getSpin(x - 1, y, z, 0);
  let old_c = getSpin(x, y, z, 1);
  let old_d = getSpin(x, y - 1, z, 1);
  let old_e = getSpin(x, y, z, 2);
  let old_f = getSpin(x, y, z - 1, 2); 
  for (const spin of [old_a, old_b, old_c, old_d, old_e, old_f]) {
    if (spin !== 0) {
      spins_before += 1;
      if (i === 0) i = spin;
      else if (spin !== i) return;  // different nontrivial spins
    }
  }

  // if all spins match, then set to random color
  if (old_a == old_b && old_b == old_c && old_c == old_d && old_d == old_e && old_e == old_f) {
    i = old_a + ((old_a + Math.floor(Math.random() * m) + 1) % (m+1));  // i might be out of range but we set to i-spins, not i
    // i = old_a + ((old_a + Math.floor(Math.random() * (m+1))) % (m+1));  // i might be out of range but we set to i-spins, not i
  }

  let cubes_before = cube_term(x+1, y, z) + cube_term(x, y+1, z) + cube_term(x, y, z+1) +
                      cube_term(x-1, y, z) + cube_term(x, y-1, z) + cube_term(x, y, z-1);

  // tentatively set new spins
  setSpin(x, y, z, 0, i-old_a);
  setSpin(x - 1, y, z, 0, i-old_b);
  setSpin(x, y, z, 1, i-old_c);
  setSpin(x, y - 1, z, 1, i-old_d);
  setSpin(x, y, z, 2, i-old_e);
  setSpin(x, y, z - 1, 2, i-old_f);

  let spins_after = ((i-old_a) !== 0) + ((i-old_b) !== 0) + ((i-old_c) !== 0) + ((i-old_d) !== 0) + ((i-old_e) !== 0) + ((i-old_f) !== 0);
  let cubes_after = cube_term(x+1, y, z) + cube_term(x, y+1, z) + cube_term(x, y, z+1) +
                     cube_term(x-1, y, z) + cube_term(x, y-1, z) + cube_term(x, y, z-1);

  let dE = h * (spins_after - spins_before) + F * (cubes_after - cubes_before);

  // console.log(`a ${old_a} -> ${i-old_a}, b ${old_b} -> ${i-old_b}, c ${old_c} -> ${i-old_c}, d ${old_d} -> ${i-old_d}, e ${old_e} -> ${i-old_e}, f ${old_f} -> ${i-old_f}`);
  // console.log(`flip ${flips_before} -> ${flips_after}, spins ${spins_before} -> ${spins_after}, dE = ${dE}, prob = ${1.0/(1.0+Math.exp(dE))}`);

  // revert if not accepted
  if (Math.random() > 1.0/(1.0+Math.exp(dE))) {
    setSpin(x, y, z, 0, old_a);
    setSpin(x - 1, y, z, 0, old_b);
    setSpin(x, y, z, 1, old_c);
    setSpin(x, y - 1, z, 1, old_d);
    setSpin(x, y, z, 2, old_e);
    setSpin(x, y, z - 1, 2, old_f);
  }

}

function flux_xy_face(x, y, z) {
  const a = getSpin(x,   y,   z, 0);
  const b = getSpin(x+1, y,   z, 1);
  const c = getSpin(x,   y+1, z, 0);
  const d = getSpin(x,   y,   z, 1);
  return face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d];
}

function print_xy_face(x, y, z) {
  const a = getSpin(x,   y,   z, 0);
  const b = getSpin(x+1, y,   z, 1);
  const c = getSpin(x,   y+1, z, 0);
  const d = getSpin(x,   y,   z, 1);
  console.log(`xy face at (${x}, ${y}, ${z}): a=${a}, b=${b}, c=${c}, d=${d}, flux=${face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d]}`);
}

function flux_yz_face(x, y, z) {
  const a = getSpin(x, y  , z,   1);
  const b = getSpin(x, y+1, z  , 2);
  const c = getSpin(x, y  , z+1, 1);
  const d = getSpin(x, y,   z  , 2);
  return face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d];
}

function print_yz_face(x, y, z) {
  const a = getSpin(x, y  , z,   1);
  const b = getSpin(x, y+1, z  , 2);
  const c = getSpin(x, y  , z+1, 1);
  const d = getSpin(x, y,   z  , 2);
  console.log(`yz face at (${x}, ${y}, ${z}): a=${a}, b=${b}, c=${c}, d=${d}, flux=${face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d]}`);
}

function flux_xz_face(x, y, z) {
  const a = getSpin(x  , y, z,   0);
  const b = getSpin(x+1, y, z  , 2);
  const c = getSpin(x  , y, z+1, 0);
  const d = getSpin(x,   y, z  , 2);
  return face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d];
}

function print_xz_face(x, y, z) {
  const a = getSpin(x  , y, z,   0);
  const b = getSpin(x+1, y, z  , 2);
  const c = getSpin(x  , y, z+1, 0);
  const d = getSpin(x,   y, z  , 2);
  console.log(`xz face at (${x}, ${y}, ${z}): a=${a}, b=${b}, c=${c}, d=${d}, flux=${face_table[a * (m+1) * (m+1) * (m+1) + b * (m+1) * (m+1) + c * (m+1) + d]}`);
}

function totalFlux() {
  let total = 0;
  for (let z = 0; z < L; z++) {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        total += flux_xy_face(x, y, z) + flux_yz_face(x, y, z) + flux_xz_face(x, y, z);
      }
    }
  }
  return total;
}

function energy_at_edge(x, y, z, dir) {
  let energy = h * (getSpin(x, y, z, dir) === 0 ? 0 : 1);
  if (dir == 0) {
    energy += (flux_xy_face(x, y, z) + flux_xy_face(x, y-1, z) + flux_xz_face(x, y, z) + flux_xz_face(x, y, z-1)) / T;
    energy += F * (cube_term(x, y, z) + cube_term(x+1, y, z));
  } else if (dir == 1) {
    energy += (flux_xy_face(x, y, z) + flux_xy_face(x-1, y, z) + flux_yz_face(x, y, z) + flux_yz_face(x, y, z-1)) / T;
    energy += F * (cube_term(x, y, z) + cube_term(x, y+1, z));
  } else if (dir == 2) {
    energy += (flux_xz_face(x, y, z) + flux_xz_face(x-1, y, z) + flux_yz_face(x, y, z) + flux_yz_face(x, y-1, z)) / T;
    energy += F * (cube_term(x, y, z) + cube_term(x, y, z+1));
  }
  return energy;
}

function print_faces(x, y, z, dir) {
  if (dir == 0) {
    print_xy_face(x, y, z);
    print_xy_face(x, y-1, z);
    print_xz_face(x, y, z);
    print_xz_face(x, y, z-1);
  } else if (dir == 1) {
    print_xy_face(x, y, z);
    print_xy_face(x-1, y, z);
    print_yz_face(x, y, z);
    print_yz_face(x, y, z-1);
  } else if (dir == 2) {
    print_xz_face(x, y, z);
    print_xz_face(x-1, y, z);
    print_yz_face(x, y, z);
    print_yz_face(x, y-1, z);
  }
}

function glauber_single() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  const z = Math.floor(Math.random() * L);
  const dir = Math.floor(Math.random() * 3);
  const old_spin = getSpin(x, y, z, dir);
  const new_spin = (old_spin + Math.floor(Math.random() * m) + 1) % (m+1);

  const old_energy = energy_at_edge(x, y, z, dir);
  setSpin(x, y, z, dir, new_spin);
  const new_energy = energy_at_edge(x, y, z, dir);

  const dE = new_energy - old_energy;

  // {
  //   console.log(`proposed flip at (${x}, ${y}, ${z}), dir ${dir}`);
  //   console.log(`update ${old_spin} -> ${new_spin}: old energy: ${old_energy}, new energy: ${new_energy}, dE = ${dE}, prob = ${1.0/(1.0+Math.exp(dE))}`);
  //   print_faces(x, y, z, dir);
  //   console.log(`new total flux: ${totalFlux()}`);
  // }

  if (Math.random() > 1.0/(1.0+Math.exp(dE))) {
    setSpin(x, y, z, dir, old_spin); // revert
  }
}

function micro_step() {
  glauber_six();
  if (T > 0) {
    for (let i = 0; i < 3; i++) {
      glauber_single();
    }
  }
}

function step() {
  const updates = Math.floor(speed * L * L * L);
  for (let n = 0; n < updates; n++) {
    micro_step();
  }
}

const small_canvas = document.getElementById("colorChart");
const small_ctx = small_canvas.getContext("2d");

// Keep a short history
const maxPoints = 100;  // how many time steps to show
const history = {
  red:   [],
  green: [],
  blue:  [],
  flip: []
};

function updateLineChart() {
  let spins = [0 , 0, 0, 0]; // red, green, blue counts

  for (let z = 0; z < L; z++) {
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        spins[getSpin(x, y, z, 0)] += 1;
        spins[getSpin(x, y, z, 1)] += 1;
        spins[getSpin(x, y, z, 2)] += 1;
      }
    }
  }

  // print values to console
  // console.log(`Red: ${spins[1]}, Green: ${spins[2]}, Blue: ${spins[3]}`);

  // push new values
  history.red.push(spins[1]);
  history.green.push(spins[2]);
  history.blue.push(spins[3]);
  history.flip.push(total_cube());
  // trim to maxPoints
  if (history.red.length > maxPoints) {
    history.red.shift();
    history.green.shift();
    history.blue.shift();
    history.flip.shift();
  }

  drawChart();
}

function drawChart() {
  const w = small_canvas.width;
  const h = small_canvas.height;

  small_ctx.clearRect(0, 0, w, h);

  const padding = 20;
  const innerW = w - 2 * padding;
  const innerH = h - 2 * padding;

  // find max value in history for scaling
  let maxVal = L * L * L * 3;
  // let maxVal = 1;
  // for (const arr of [history.red, history.green, history.blue]) {
  //   for (const v of arr) {
  //     if (v > maxVal) maxVal = v;
  //   }
  // }

  // axes
  small_ctx.strokeStyle = "#000";
  small_ctx.lineWidth = 1;
  small_ctx.beginPath();
  small_ctx.moveTo(padding, padding);
  small_ctx.lineTo(padding, padding + innerH);
  small_ctx.lineTo(padding + innerW, padding + innerH);
  small_ctx.stroke();

  // helper to draw one colored line
  function drawSeries(arr, color) {
    if (arr.length < 2) return;

    small_ctx.strokeStyle = color;
    small_ctx.lineWidth = 2;
    small_ctx.beginPath();

    arr.forEach((v, i) => {
      const x = padding + (i / (maxPoints - 1)) * innerW;
      const y = padding + innerH - (v / maxVal) * innerH;
      if (i === 0) small_ctx.moveTo(x, y);
      else small_ctx.lineTo(x, y);
    });

    small_ctx.stroke();
  }

  drawSeries(history.red,   colors[1]);
  drawSeries(history.green, colors[2]);
  drawSeries(history.blue,  colors[3]);
  drawSeries(history.flip,  "#888888"); // grey for flux
}


function loop() {
  if (running) {
    step();
    draw();
    // const e = totalEnergy();
    // document.getElementById("Edisp").textContent = e.toFixed(3);
    updateLineChart();
  }
  requestAnimationFrame(loop);
}

// UI controls
document.getElementById("hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("hval").textContent = h.toFixed(2);
});

document.getElementById("fslider").addEventListener("input", e => {
  F = parseFloat(e.target.value);
  document.getElementById("fval").textContent = F.toFixed(2);
});

document.getElementById("Tslider").addEventListener("input", e => {
  T = parseFloat(e.target.value);
  document.getElementById("Tval").textContent = T.toFixed(2);
});

document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  if (L > 100) colors[0] = "#ffffff"; // change background to white for large L
  else colors[0] = "#000000";
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

// reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  n_membs = 0;
  initLattice();
  draw();
});

// all red button
document.getElementById("allRed").addEventListener("click", () => {
  initRed();
  draw();
});

// insert random membrane button
document.getElementById("insertMemb").addEventListener("click", () => {
  n_membs += 1;
  insertMembrane();
  draw();
});

// single step button
document.getElementById("singleStep").addEventListener("click", () => {
  for (let i = 0; i < 100; i++) {
    micro_step();
  }
  draw();
});

// Initialize
initLattice();
draw();
loop();
