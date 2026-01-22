import API_BASE_URL from './config.js';

/* ===============================
   STATE
================================ */
let tabActual = 'pendiente';
let textoBusqueda = '';
let fechaFiltro = '';
let datos = [];

/* ===============================
   INIT
================================ */
document.addEventListener('DOMContentLoaded', () => {
  cargarCobros();
});

/* ===============================
   TABS
================================ */
window.cambiarTab = function (tab, btn) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  cargarCobros();
};

/* ===============================
   BUSCADOR
================================ */
window.aplicarBusqueda = function () {
  const input = document.getElementById('buscadorCobros');
  const fechaInput = document.getElementById('filtroFecha');

  textoBusqueda = (input?.value || '').toLowerCase();
  fechaFiltro = fechaInput?.value || '';

  render();
};

/* ===============================
   CARGAR COBROS
================================ */
async function cargarCobros() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = 'Cargando...';

  try {
    const res = await fetch(
      `${API_BASE_URL}/cobros?estado_cobro=${tabActual}`
    );

    if (!res.ok) throw new Error('Error backend');

    datos = await res.json();
    render();
  } catch (e) {
    cont.innerHTML = 'Error al cargar cobros';
    console.error(e);
  }
}

/* ===============================
   RENDER
================================ */
function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  const filtrados = datos.filter(c => {
    if (textoBusqueda) {
      const ultimosTrackings = (c.entregas || [])
        .map(e => (e.tracking || '').slice(-4))
        .join(' ');

      const texto = `
        ${c.cliente_nombre}
        ${c.cliente_telefono}
        ${ultimosTrackings}
      `.toLowerCase();

      if (!texto.includes(textoBusqueda)) return false;
    }

    if (fechaFiltro) {
      const fecha = (c.fecha_ultima_actualizacion || '').slice(0, 10);
      if (!fecha.startsWith(fechaFiltro)) return false;
    }

    return true;
  });

  if (!filtrados.length) {
    cont.innerHTML = '<p>No hay registros</p>';
    return;
  }

  filtrados.forEach(c => {
    const div = document.createElement('div');
    div.className = 'card';

    let accionesHTML = '';

    if (tabActual === 'pendiente') {
      accionesHTML = `
        <button class="primary"
          onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">
          Avisar
        </button>`;
    }

    if (tabActual === 'avisado') {
      accionesHTML = `
        <button onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">
          Re-avisar
        </button>
        <button class="primary" onclick="pagar('${c.cliente_id}')">
          Confirmar pago
        </button>`;
    }

    if (tabActual === 'pagado') {
      accionesHTML = `<small style="color:green">Pago confirmado</small>`;
    }

    div.innerHTML = `
      <strong>${c.cliente_nombre}</strong><br>
      <small>Total: ${c.monto_total_bs} Bs</small><br>
      ${accionesHTML}
    `;

    cont.appendChild(div);
  });
}

/* ===============================
   AVISAR
================================ */
window.avisar = async function (clienteId, telefono) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  if (telefono) {
    const msg = encodeURIComponent(
      'Hola, te escribimos de Bolivia Imports por un pago pendiente.'
    );
    window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
  }

  await fetch(`${API_BASE_URL}/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};

/* ===============================
   PAGAR
================================ */
window.pagar = async function (clienteId) {
  if (!confirm('¿Confirmar pago?')) return;

  await fetch(`${API_BASE_URL}/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};
