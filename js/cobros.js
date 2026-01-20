/* ===============================
   CONFIG
================================ */
const API_BASE = 'https://uranitic-unpennied-dominique.ngrok-free.dev/api';

let tabActual = 'pendiente';
let textoBusqueda = '';
let datos = [];

/* ===============================
   INIT
================================ */
document.addEventListener('DOMContentLoaded', () => {
  cargarCobros();
});

/* ===============================
   TABS (HTML YA LOS LLAMA)
================================ */
function cambiarTab(tab, btn) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  cargarCobros();
}

/* ===============================
   BUSCADOR
================================ */
function aplicarBusqueda() {
  const input = document.getElementById('buscadorCobros');
  textoBusqueda = (input.value || '').toLowerCase();
  render();
}

/* ===============================
   CARGAR COBROS
================================ */
async function cargarCobros() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = 'Cargando...';

  try {
    const res = await fetch(
      `${API_BASE}/cobros?estado_cobro=${tabActual}`
    );
    datos = await res.json();

    // ordenar por fecha_ultima_actualizacion (más antiguo primero)
    datos.sort((a, b) =>
      (a.fecha_ultima_actualizacion || '').localeCompare(
        b.fecha_ultima_actualizacion || ''
      )
    );

    render();
  } catch (e) {
    cont.innerHTML = 'Error al cargar cobros';
  }
}

/* ===============================
   RENDER
================================ */
function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  const filtrados = datos.filter(c => {
    if (!textoBusqueda) return true;

    const texto = `
      ${c.cliente_nombre}
      ${c.cliente_telefono}
      ${c.entregas.map(e => e.tracking).join(' ')}
    `.toLowerCase();

    return texto.includes(textoBusqueda);
  });

  if (!filtrados.length) {
    cont.innerHTML = '<p style="color:#777">Sin resultados</p>';
    return;
  }

  filtrados.forEach(c => {
    const div = document.createElement('div');
    div.className = 'card';

    div.innerHTML = `
      <strong>${c.cliente_nombre}</strong>
      <small>Total: ${c.monto_total_bs} Bs</small>

      <div class="actions">
        <button
          ${tabActual === 'pagado' ? 'disabled' : ''}
          onclick="avisar('${c.cliente_id}')"
        >
          ${tabActual === 'avisado' ? 'Re-avisar' : 'Avisar'}
        </button>

        <button
          class="primary"
          ${tabActual !== 'avisado' ? 'disabled' : ''}
          onclick="pagar('${c.cliente_id}')"
        >
          Confirmar pago
        </button>
      </div>
    `;

    cont.appendChild(div);
  });
}

/* ===============================
   AVISAR / REAVISAR
================================ */
async function avisar(clienteId) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  await fetch(`${API_BASE}/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
}

/* ===============================
   PAGAR
================================ */
async function pagar(clienteId) {
  if (!confirm('¿Confirmar pago recibido?')) return;

  await fetch(`${API_BASE}/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
}
