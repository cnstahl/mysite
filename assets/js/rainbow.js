// --- constants ---
const L_start = 50;
const h_start = 0;
const p_start = 0;
const Speed_start = 1.0;

// --- mutable variables ---
let L = L_start;
let h = h_start;
let p = p_start;
let speed = Speed_start;
let running = true;    // pause / resume toggle
let m = 3;             // number of nontrivial colors
let counter = 0;

// --- initialize UI elements ---
document.getElementById("Lslider").value = L_start;
document.getElementById("Lval").textContent = L_start;

document.getElementById("hslider").value = h_start;
document.getElementById("hval").textContent = h_start.toFixed(2);

document.getElementById("pslider").value = p_start;
document.getElementById("pval").textContent = p_start.toFixed(2);

document.getElementById("Speedslider").value = Speed_start;
document.getElementById("Speedval").textContent = Speed_start.toFixed(1) + "×";

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let horiz, vert, dx, dy, face_table, vertex_table;

// color array [black, red, green, blue]
const colors = ["#000000", "#a8003b", "#417865", "#0379ee"];

function initLattice() {
  spins = Array(2*L*L).fill(0);
  dx = W / L;
  dy = H / L;
}

// getters and setters for horizontal and vertical edges
function index_from_coords(x, y, dir) {
  return ((x+L) % L)*L*2 + ((y+L) % L)*2 + dir
}

function get_spin(x, y, dir) {
  return spins[index_from_coords(x, y, dir)];
}

function set_spin(x, y, dir, value) {
  spins[index_from_coords(x, y, dir)] = value;
}

function initTable() {
  face_table = Array.from({ length: m+1 }, () =>
    Array.from({ length: m+1 }, () =>
      Array.from({ length: m+1 }, () =>
        Array(m+1).fill(0)
      )
    )
  );
  vertex_table = Array.from({ length: m+1 }, () =>
    Array.from({ length: m+1 }, () =>
      Array.from({ length: m+1 }, () =>
        Array(m+1).fill(0)
      )
    )
  );
  for (let a = 0; a <= m; a++) {
    for (let b = 0; b <= m; b++) {
      for (let c = 0; c <= m; c++) {
        for (let d = 0; d <= m; d++) {
          if (a==0 && c==0 && b>0 && d>0 && b!=d) face_table[a][b][c][d] = 1;
          if (b==0 && d==0 && a>0 && c>0 && a!=c) face_table[a][b][c][d] = 1;
          if (a==0 && c==0 && b==d && b>0) vertex_table[a][b][c][d] = 1;
          if (b==0 && d==0 && a==c && a>0) vertex_table[a][b][c][d] = 1;
        }
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
      ctx.lineWidth = get_spin(x, y, 0) ? 3 : 1;
      ctx.strokeStyle = colors[get_spin(x, y, 0)];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo((x + 1) * dx, y * dy);
      ctx.stroke();

      // left vertical edge
      ctx.lineWidth = get_spin(x, y, 1) ? 3 : 1;
      ctx.strokeStyle = colors[get_spin(x, y, 1)];
      ctx.beginPath();
      ctx.moveTo(x * dx, y * dy);
      ctx.lineTo(x * dx, (y + 1) * dy);
      ctx.stroke();
    }
  }
}

// function totalEnergy() {
//   let E = 0;
//   for (let y = 0; y < L; y++)
//     for (let x = 0; x < L; x++) E += get_spin(x, y, 0) + get_spin(x, y, 1);
//   const totalEdges = 2 * L * L;
//   return E / totalEdges;
// }

// function is_flippable(x, y) {
//   let i = 0;
//   let nontrivial_spins = 0;

//   a = get_spin(x, y, 0);
//   b = get_spin((x + 1) % L, y, 0);
//   c = get_spin(x, y, 1);
//   d = get_spin(x, (y + 1) % L, 1);

//   for (const spin of [a, b, c, d]) {
//     if (spin !== 0) {
//       nontrivial_spins += 1;
//       if (i === 0) i = spin;
//       else if (spin !== i) return false;  // different nontrivial spins
//     }
//   }
//   return true;
// }

//function takes four spins at a plaquette and returns 1 if form an aligned state, 0 otherwise
function face_lookup(x, y) {
  let spin_a = get_spin(x, y, 0);
  let spin_b = get_spin(x+1, y, 1);
  let spin_c = get_spin(x, y+1, 0);
  let spin_d = get_spin(x, y, 1);
  return face_table[spin_a][spin_b][spin_c][spin_d];  
}

function total_alignment() {
  let total = 3;
  for (let x = 0; x < L; x++) {
    for (let y = 0; y < L; y++) {
      total += face_lookup(x, y);
    }
  }
  return total;
}

function vertex_lookup(x, y) {
  let spin_a = get_spin(x, y, 0);
  let spin_b = get_spin(x, y, 1);
  let spin_c = get_spin(x-1, y, 0);
  let spin_d = get_spin(x, y-1, 1);
  return vertex_table[spin_a][spin_b][spin_c][spin_d];
}

function glauber_four() {
  const x = Math.floor(Math.random() * L);
  const y = Math.floor(Math.random() * L);
  let i = 0;
  let nontrivial_spins = 0;

  let old_a = get_spin(x, y, 0);
  let old_b = get_spin(x+1, y, 1);
  let old_c = get_spin(x, y+1, 0);
  let old_d = get_spin(x, y, 1);

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

  let tot_h_before = (old_a > 0) + (old_b > 0) + (old_c > 0) + (old_d > 0);
  let tot_p_before = 0;
  tot_p_before += face_lookup(x, y-1) + face_lookup(x-1, y) + face_lookup(x+1, y) + face_lookup(x, y+1);
  // tot_p_before += vertex_lookup(x, y) + vertex_lookup(x+1, y) + vertex_lookup(x, y+1) + vertex_lookup(x+1, y+1);

  let new_a = i-old_a;
  let new_b = i-old_b;
  let new_c = i-old_c;
  let new_d = i-old_d;

  // tentatively flip the spins
  set_spin(x, y, 0, new_a);
  set_spin(x+1, y, 1, new_b);
  set_spin(x, y+1, 0, new_c);
  set_spin(x, y, 1, new_d);

  let tot_h_after = (new_a > 0) + (new_b > 0) + (new_c > 0) + (new_d > 0);
  let tot_p_after = 0;
  tot_p_after += face_lookup(x, y-1) + face_lookup(x-1, y) + face_lookup(x+1, y) + face_lookup(x, y+1);
  // tot_p_after += vertex_lookup(x, y) + vertex_lookup(x+1, y) + vertex_lookup(x, y+1) + vertex_lookup(x+1, y+1);

  let dE = h * (tot_h_after - tot_h_before) + p * (tot_p_before - tot_p_after);
  // console.log("(" + String(old_a) + String(old_b) + String(old_c) + String(old_d) + ") -> (" + String(new_a) + String(new_b) + String(new_c) + String(new_d) + ")" , x, y, dE, 1.0/(1.0+Math.exp(dE)))

  if (Math.random() > 1.0/(1.0+Math.exp(dE))) {
    // reject the flip, restore old spins
    set_spin(x, y, 0, old_a);
    set_spin(x+1, y, 1, old_b);
    set_spin(x, y+1, 0, old_c);
    set_spin(x, y, 1, old_d);
  }

}

function step() {
  const updates = Math.floor(speed * L * L);
  for (let n = 0; n < updates; n++) {
    glauber_four();
  }

  // console.log("step " + String(counter++), "alignment", total_alignment());
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
document.getElementById("Lslider").addEventListener("input", e => {
  L = parseInt(e.target.value);
  if (L > 100) colors[0] = "transparent"; // change background to clear for large L
  else colors[0] = "#000000";
  document.getElementById("Lval").textContent = L;
  initLattice();
});

document.getElementById("hslider").addEventListener("input", e => {
  h = parseFloat(e.target.value);
  document.getElementById("hval").textContent = h.toFixed(2);
});

document.getElementById("pslider").addEventListener("input", e => {
  p = parseFloat(e.target.value);
  document.getElementById("pval").textContent = p.toFixed(2);
});

document.getElementById("Speedslider").addEventListener("input", e => {
  speed = parseFloat(e.target.value);
  document.getElementById("Speedval").textContent = speed.toFixed(1) + "×";
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("toggleBtn").textContent = running ? "⏸️ Pause" : "▶️ Resume";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  counter = 0;
  initLattice();
  draw();
});

document.getElementById("insertLine").addEventListener("click", () => {
  initLattice();
  // insert a random horizontal line of spins
  const y = Math.floor(Math.random() * L);
  const spin_value = Math.floor(Math.random() * m) + 1;
  for (let x = 0; x < L; x++) {
    set_spin(x, y, 0, spin_value);
  }
  draw();
});

// Initialize
initLattice();
initTable();
draw();
loop();
