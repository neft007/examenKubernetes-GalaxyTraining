// La API se consume por ruta relativa: Nginx hace de proxy /api -> gym-api:8080
const API = '/api/v1';
const output = document.getElementById('output');

// La API no tiene endpoints para listar socios/clases, así que guardamos
// en localStorage los que se crean desde este front para poder elegirlos.
const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  add(key, item) {
    const list = store.get(key);
    list.push(item);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignorar */ }
  }
};

function show(data, isError = false) {
  output.textContent = JSON.stringify(data, null, 2);
  output.className = isError ? 'error' : '';
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    show({ status: res.status, ...body }, true);
    throw new Error(body.message || res.statusText);
  }
  show(body);
  return body;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function refreshSelects() {
  const socios = store.get('socios');
  const clases = store.get('clases');
  document.querySelectorAll('.sel-socio').forEach(sel => {
    sel.innerHTML = '<option value="">-- Selecciona socio --</option>' +
      socios.map(s => `<option value="${s.id}">${s.nombre} (${s.dni})</option>`).join('');
  });
  document.querySelectorAll('.sel-clase').forEach(sel => {
    sel.innerHTML = '<option value="">-- Selecciona clase --</option>' +
      clases.map(c => `<option value="${c.id}">${c.nombre} - ${new Date(c.fechaInicio).toLocaleString()}</option>`).join('');
  });
}

function nombreClase(id) {
  const c = store.get('clases').find(c => c.id === id);
  return c ? c.nombre : `<code>${id}</code>`;
}

// 1. Registrar socio
document.getElementById('form-socio').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const socio = await api('/socios', { method: 'POST', body: JSON.stringify(formData(e.target)) });
    store.add('socios', socio);
    refreshSelects();
    e.target.reset();
  } catch { /* el error ya se muestra */ }
});

// 2. Crear clase
document.getElementById('form-clase').addEventListener('submit', async e => {
  e.preventDefault();
  const d = formData(e.target);
  const body = {
    nombre: d.nombre,
    instructor: d.instructor,
    fechaInicio: new Date(d.fechaInicio).toISOString(),
    duracionMinutos: Number(d.duracionMinutos),
    aforoMaximo: Number(d.aforoMaximo)
  };
  try {
    const clase = await api('/clases', { method: 'POST', body: JSON.stringify(body) });
    store.add('clases', clase);
    refreshSelects();
    e.target.reset();
  } catch { }
});

// 3. Reservar plaza
document.getElementById('form-reserva').addEventListener('submit', async e => {
  e.preventDefault();
  const { socioId, claseId } = formData(e.target);
  try {
    await api(`/clases/${claseId}/reservas`, { method: 'POST', body: JSON.stringify({ socioId }) });
  } catch { }
});

// 4. Disponibilidad
document.getElementById('form-disponibilidad').addEventListener('submit', async e => {
  e.preventDefault();
  const { claseId } = formData(e.target);
  try { await api(`/clases/${claseId}/disponibilidad`); } catch { }
});

// 5. Reservas de un socio + cancelar
const formReservas = document.getElementById('form-reservas-socio');
const tabla = document.getElementById('tabla-reservas');

async function cargarReservas() {
  const { socioId, estado } = formData(formReservas);
  if (!socioId) return;
  const qs = estado ? `?estado=${estado}` : '';
  try {
    const page = await api(`/socios/${socioId}/reservas${qs}`);
    tabla.innerHTML = page.items.length ? page.items.map(r => `
      <tr>
        <td><code>${r.id.slice(0, 8)}…</code></td>
        <td>${nombreClase(r.claseId)}</td>
        <td>${new Date(r.fechaReserva).toLocaleString()}</td>
        <td>${r.estado}</td>
        <td>${r.estado === 'CONFIRMADA'
          ? `<button class="danger" data-id="${r.id}">Cancelar</button>` : ''}</td>
      </tr>`).join('')
      : '<tr><td colspan="5">Sin reservas</td></tr>';
  } catch {
    tabla.innerHTML = '';
  }
}

formReservas.addEventListener('submit', e => { e.preventDefault(); cargarReservas(); });

tabla.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  if (!id || !confirm('¿Cancelar esta reserva?')) return;
  try {
    await api(`/reservas/${id}/cancelar`, { method: 'POST' });
    cargarReservas();
  } catch { }
});

// Estado de la API (actuator health, también vía proxy)
async function checkHealth() {
  const badge = document.getElementById('api-status');
  try {
    const res = await fetch('/actuator/health');
    const ok = res.ok && (await res.json()).status === 'UP';
    badge.textContent = ok ? 'API: UP' : 'API: DOWN';
    badge.className = 'badge ' + (ok ? 'ok' : 'down');
  } catch {
    badge.textContent = 'API: sin conexión';
    badge.className = 'badge down';
  }
}

refreshSelects();
checkHealth();
setInterval(checkHealth, 15000);
