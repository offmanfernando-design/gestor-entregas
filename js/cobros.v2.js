import API_BASE_URL from './config.js';

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
  render();
};

async function cargarCobros() {
  const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
  datos = await res.json();
  render();
}

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  datos
    .filter(c =>
      !textoBusqueda ||
      c.cliente_nombre.toLowerCase().includes(textoBusqueda)
    )
    .forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';

      let acciones = '';

      if (tabActual === 'pendiente') {
        acciones = `
          <div class="actions">
            <button class="primary" onclick="avisar('${c.cliente_id}')">Avisar</button>
          </div>`;
      }

      if (tabActual === 'avisado') {
        acciones = `
          <div class="actions">
            <button onclick="avisar('${c.cliente_id}')">Reavisar</button>
            <button class="primary" onclick="pagar('${c.cliente_id}')">Confirmar pago</button>
          </div>`;
      }

      if (tabActual === 'pagado') {
        acciones = `<div class="status-ok">Pago confirmado</div>`;
      }

      div.innerHTML = `
        <div class="card-header">
          <strong>${c.cliente_nombre}</strong>
          <small>${c.monto_total_bs} Bs</small>
        </div>
        ${acciones}
      `;

      cont.appendChild(div);
    });
}

window.avisar = async function (clienteId) {
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
