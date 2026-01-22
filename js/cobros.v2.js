import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let textoBusqueda = '';
let fechaFiltro = '';
let datos = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarCobros();
});

/* ===============================
   TABS
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
  textoBusqueda =
    (document.getElementById('buscadorCobros').value || '').toLowerCase();

  fechaFiltro =
    document.getElementById('filtroFecha')?.value || '';

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
      `${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`
    );

    datos = await res.json();
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
    if (textoBusqueda) {
      const ultimos = (c.entregas || [])
        .map(e => (e.tracking || '').slice(-4))
        .join(' ');

      const texto = `
        ${c.cliente_nombre}
        ${c.cliente_telefono}
        ${ultimos}
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
    cont.innerHTML = '<small>No hay registros</small>';
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
        </button>
      `;
    }

    if (tabActual === 'avisado') {
      accionesHTML = `
        <button onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">
          Re-avisar
        </button>
        <button class="primary" onclick="pagar('${c.cliente_id}')">
          Confirmar pago
        </button>
      `;
    }

    if (tabActual === 'pagado') {
      accionesHTML = `<small style="color:green">Pago confirmado</small>`;
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
   AVISAR
================================ */
async function avisar(clienteId, telefono) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  if (telefono) {
    const msg = encodeURIComponent(
      'Hola, te escribimos de Bolivia Imports por tu pago pendiente.'
    );
    window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
  }

  await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
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

  await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
}
