import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let textoBusqueda = '';
let fechaFiltro = '';
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
  const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
  datos = await res.json();
  render();
}

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  datos
    .filter(c => {
      if (textoBusqueda && !c.cliente_nombre.toLowerCase().includes(textoBusqueda)) {
        return false;
      }
      return true;
    })
    .forEach(c => {
      const div = document.createElement('div');
      div.className = `cobro-card ${tabActual}`;

      let bottom = '';

      if (tabActual === 'pendiente') {
        bottom = `
          <span class="cobro-estado pendiente">Por cobrar</span>
          <button class="cobro-action" onclick="avisar('${c.cliente_id}')">
            Avisar
          </button>`;
      }

      if (tabActual === 'avisado') {
        bottom = `
          <span class="cobro-estado avisado">Avisado</span>
          <div>
            <button class="cobro-action" onclick="avisar('${c.cliente_id}')">
              Reavisar
            </button>
            <button class="cobro-action" onclick="pagar('${c.cliente_id}')">
              Confirmar
            </button>
          </div>`;
      }

      if (tabActual === 'pagado') {
        bottom = `
          <span class="cobro-estado pagado">Pagado</span>
        `;
      }

      div.innerHTML = `
        <div class="cobro-top">
          <div class="cobro-cliente">
            <strong>${c.cliente_nombre}</strong>
            <span class="cobro-codigo">${c.cliente_id}</span>
          </div>

          <div class="cobro-monto">
            ${c.monto_total_bs} Bs
          </div>
        </div>

        <div class="cobro-bottom">
          ${bottom}
        </div>
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
