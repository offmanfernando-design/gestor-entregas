let fechaFiltro = '';

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
  const fechaInput = document.getElementById('filtroFecha');

  textoBusqueda = (input.value || '').toLowerCase();
  fechaFiltro = fechaInput ? fechaInput.value : '';

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
      `${API_BASE}/cobros?estado_cobro=${tabActual}`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );

    datos = await res.json();

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
const filtrados = datos.filter(c => {

  /* ======================
     FILTRO POR TEXTO
     (nombre, teléfono, últimos 4 tracking)
  ====================== */
  if (textoBusqueda) {
    const ultimosTrackings = c.entregas
      .map(e => (e.tracking || '').slice(-4))
      .join(' ');

    const texto = `
      ${c.cliente_nombre}
      ${c.cliente_telefono}
      ${ultimosTrackings}
    `.toLowerCase();

    if (!texto.includes(textoBusqueda)) return false;
  }

  /* ======================
     FILTRO POR FECHA
     (YYYY-MM-DD o YYYY-MM)
  ====================== */
  if (fechaFiltro) {
    const fecha = (c.fecha_ultima_actualizacion || '').slice(0, 10);

    // permite filtrar por día exacto o por mes (YYYY-MM)
    if (!fecha.startsWith(fechaFiltro)) return false;
  }

  return true;
});

    // POR COBRAR → solo avisar
    if (tabActual === 'pendiente') {
      accionesHTML = `
        <div class="actions">
          <button class="primary" onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">
            Avisar
          </button>
        </div>
      `;
    }

    // AVISADOS → reavisar + confirmar pago
    if (tabActual === 'avisado') {
      accionesHTML = `
        <div class="actions">
          <button onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">
            Re-avisar
          </button>
          <button class="primary" onclick="pagar('${c.cliente_id}')">
            Confirmar pago
          </button>
        </div>
      `;
    }

    // PAGADOS → sin botones
    if (tabActual === 'pagado') {
      accionesHTML = `
        <small style="color:#2e7d32;font-weight:600">
          Pago confirmado
        </small>
      `;
    }

    div.innerHTML = `
      <strong>${c.cliente_nombre}</strong>
      <small>Total: ${c.monto_total_bs} Bs</small>
      ${accionesHTML}
    `;

    cont.appendChild(div);
  });
}

/* ===============================
   AVISAR / REAVISAR
================================ */
async function avisar(clienteId, telefono) {
  if (!confirm('¿Enviar aviso de cobro por WhatsApp?')) return;

  // 1️⃣ abrir WhatsApp
  if (telefono) {
    const mensaje = encodeURIComponent(
      'Hola, te escribimos de Bolivia Imports para recordarte que tienes un pago pendiente. Gracias.'
    );
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  // 2️⃣ marcar como avisado en backend
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
