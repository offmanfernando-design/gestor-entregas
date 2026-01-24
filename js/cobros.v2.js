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
    .filter(c => {
      if (textoBusqueda && !c.cliente_nombre.toLowerCase().includes(textoBusqueda)) {
        return false;
      }
      return true;
    })
    .forEach(c => {
      const div = document.createElement('div');
      div.className = 'cobro-card';
      div.dataset.id = c.cliente_id;

      let bottom = '';

      // PENDIENTE
      if (tabActual === 'pendiente') {
        bottom = `
          <button class="cobro-action primary"
            onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}', this)">
            Avisar
          </button>`;
      }

      // AVISADO
      if (tabActual === 'avisado') {
        const veces = c.veces_avisado || 1;
        bottom = `
          <span class="cobro-estado">Avisado · ${veces}</span>
          <button class="cobro-action"
            onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}', this)">
            Reavisar
          </button>
          <button class="cobro-action primary"
            onclick="pagar('${c.cliente_id}', this)">
            Confirmar pago
          </button>`;
      }

      // PAGADO
      if (tabActual === 'pagado') {
        bottom = `<span class="cobro-estado pagado">Pago confirmado</span>`;
      }

      div.innerHTML = `
        <div class="cobro-top">
          <div class="cobro-cliente">
            <strong>${c.cliente_nombre}</strong>
            <span class="cobro-codigo">${c.cliente_id}</span>
          </div>
          <div class="cobro-monto">${c.monto_total_bs} Bs</div>
        </div>
        <div class="cobro-bottom">${bottom}</div>
      `;

      cont.appendChild(div);
    });
}

/* ====== ACCIONES ====== */

window.avisar = async function (clienteId, telefono, btn) {
  const card = btn.closest('.cobro-card');
  card.classList.add('leaving');

  // WhatsApp directo
  if (telefono) {
    const mensaje = encodeURIComponent(
      'Hola, te escribimos de Bolivia Imports para informarte que tienes un pago pendiente.'
    );
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  setTimeout(cargarCobros, 160);
};

window.pagar = async function (clienteId, btn) {
  const card = btn.closest('.cobro-card');
  card.classList.add('leaving');

  await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  setTimeout(cargarCobros, 160);
};
