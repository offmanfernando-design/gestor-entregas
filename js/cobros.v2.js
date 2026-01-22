import API_BASE_URL from './config.js';

let fechaFiltro = '';
let tabActual = 'pendiente';
let textoBusqueda = '';
let datos = [];

document.addEventListener('DOMContentLoaded', cargarCobros);

window.cambiarTab = function (tab, btn) {
  tabActual = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cargarCobros();
};

window.aplicarBusqueda = function () {
  textoBusqueda = document.getElementById('buscadorCobros').value.toLowerCase();
  fechaFiltro = document.getElementById('filtroFecha').value;
  render();
};

async function cargarCobros() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = 'Cargando...';

  const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
  datos = await res.json();
  render();
}

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  datos
    .filter(c => {
      if (textoBusqueda) {
        const txt = `${c.cliente_nombre} ${c.cliente_telefono}`.toLowerCase();
        if (!txt.includes(textoBusqueda)) return false;
      }
      if (fechaFiltro && !c.fecha_ultima_actualizacion?.startsWith(fechaFiltro)) return false;
      return true;
    })
    .forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';

      let acciones = '';

      if (tabActual === 'pendiente') {
        acciones = `<button class="primary" onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">Avisar</button>`;
      }

      if (tabActual === 'avisado') {
        acciones = `
          <button onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}')">Reavisar</button>
          <button class="primary" onclick="pagar('${c.cliente_id}')">Confirmar pago</button>
        `;
      }

      if (tabActual === 'pagado') {
        acciones = `<span class="paid">Pago confirmado</span>`;
      }

      div.innerHTML = `
        <div class="card-header">
          <strong>${c.cliente_nombre}</strong>
          <small>Total: ${c.monto_total_bs} Bs</small>
        </div>
        <div class="actions right">
          ${acciones}
        </div>
      `;

      cont.appendChild(div);
    });
}

window.avisar = async function (clienteId, telefono) {
  if (telefono) {
    const msg = encodeURIComponent(
      'Hola, te escribimos de Bolivia Imports para recordarte un pago pendiente. Gracias.'
    );
    window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
  }

  await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};

window.pagar = async function (clienteId) {
  await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};
