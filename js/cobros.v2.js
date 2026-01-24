import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let textoBusqueda = '';
let fechaFiltro = '';
let datos = [];

document.addEventListener('DOMContentLoaded', cargarCobros);

/* ========================= */
/* TABS                      */
/* ========================= */

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

/* ========================= */
/* DATA LOAD                 */
/* ========================= */

async function cargarCobros() {
  const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
  datos = await res.json();
  render();
}

/* ========================= */
/* RENDER                    */
/* ========================= */

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

      /* PENDIENTE */
      if (tabActual === 'pendiente') {
        bottom = `
          <button class="cobro-action primary"
            onclick="avisar('${c.cliente_id}', '${c.cliente_telefono}', this)">
            Avisar
          </button>`;
      }

      /* AVISADO */
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

      /* PAGADO */
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

        <div class="cobro-bottom">
          ${bottom}
        </div>
      `;

      cont.appendChild(div);
    });
}

/* ========================= */
/* MENSAJE WHATSAPP          */
/* (NO TOCADO)               */
/* ========================= */

function generarMensajeWhatsApp(c) {
  const productosValidos = (c.productos || []).filter(p =>
    p.cobrar_bs && Number(p.cobrar_bs) > 0
  );

  const departamento = (c.departamento_destino || '').toLowerCase().trim();
  const esSantaCruz = departamento.includes('santa cruz');

  let mensaje = `Hola ${c.cliente_nombre}\n\n`;

  mensaje += esSantaCruz
    ? 'Tu pedido llegó a nuestra oficina.\n\n'
    : 'Tu pedido ya se encuentra disponible para envío.\n\n';

  let total = 0;

  productosValidos.forEach((p, i) => {
    total += Number(p.cobrar_bs);
    mensaje += `${i + 1}) Producto: ${p.nombre}\n`;
    mensaje += `Costo: ${p.peso_a_cobrar} kg × ${p.tipo_cobro} × ${p.dolar_cliente} = ${p.cobrar_bs} Bs\n\n`;
  });

  if (productosValidos.length > 1) {
    mensaje += `Total a pagar: ${total} Bs\n\n`;
  }

  mensaje += 'Pago: QR o efectivo (solo Bs)\n\n';

  if (esSantaCruz) {
    mensaje +=
      'Horario: 09:30 a 12:00 y 14:30 a 18:00\n' +
      'Ubicación: https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n';
  } else {
    mensaje +=
      'Para realizar el envío, por favor confirma los siguientes datos:\n\n' +
      'Nombre completo:\n' +
      'Departamento / destino:\n' +
      'Número de celular:\n\n';
  }

  mensaje += '— Bolivia Imports';

  return encodeURIComponent(mensaje);
}

/* ========================= */
/* ACCIONES                  */
/* ========================= */

window.avisar = async function (clienteId, telefono, btn) {
  const card = btn.closest('.cobro-card');
  card.classList.add('leaving');

  const c = datos.find(d => d.cliente_id === clienteId);
  const mensaje = generarMensajeWhatsApp(c);

  if (telefono) {
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
