import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let datos = [];
let lastSync = null;
let avisando = false;
let pagando = false;

/* =========================
   INDICADOR DE CONEXIÓN
   ========================= */

function actualizarIndicador(ok = true) {
  const el = document.getElementById('syncStatus');
  if (!el) return;

  const text = el.querySelector('.text');
  const time = el.querySelector('.time');

  if (!ok) {
    el.classList.add('offline');
    el.classList.remove('loading');
    text.textContent = 'Sin conexión';
    time.textContent = '';
    return;
  }

  el.classList.remove('offline');
  el.classList.remove('loading');
  text.textContent = 'Conectado';

  lastSync = new Date();
  time.textContent = `· Última sync: hace ${tiempoHumano(lastSync)}`;
}

function setConectando() {
  const el = document.getElementById('syncStatus');
  if (!el) return;

  el.classList.add('loading');
  el.classList.remove('offline');
  el.querySelector('.text').textContent = 'Conectando';
  el.querySelector('.time').textContent = '';
}

function tiempoHumano(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)} h`;
}

/* =========================
   INIT
   ========================= */

document.addEventListener('DOMContentLoaded', cargarCobros);

/* =========================
   DATA LOAD
   ========================= */

async function cargarCobros() {
  setConectando();

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`
    );
    datos = await res.json();
    render();
    actualizarIndicador(true);
  } catch (e) {
    actualizarIndicador(false);
  }
}

/* =========================
   TABS
   ========================= */

window.cambiarTab = function (tab, btn) {
  tabActual = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cargarCobros();
};

/* =========================
   RENDER
   ========================= */

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  datos.forEach(c => {
    const div = document.createElement('div');
    let bottom = '';

    let accionClass = '';
    if (c.ultima_accion === 'AVISO') accionClass = 'aviso';
    if (c.ultima_accion === 'REAVISO') accionClass = 'reaviso';
    if (c.ultima_accion === 'PAGO') accionClass = 'pago';

    const accionInfo = c.ultima_accion
      ? `<div class="cobro-accion ${accionClass}">
           <small>${c.ultima_accion} · ${c.ultima_accion_fecha || ''}</small>
         </div>`
      : '';

    if (tabActual === 'pendiente') {
      bottom = `
        ${accionInfo}
        <button class="cobro-action primary" ${avisando ? 'disabled' : ''}
          onclick="avisar('${c.cliente_id}','${c.cliente_telefono}')">
          Avisar
        </button>`;
    }

    if (tabActual === 'avisado') {
      bottom = `
        ${accionInfo}
        <span class="cobro-estado">Avisado · ${c.avisos_count}</span>

        <button class="cobro-action" ${avisando ? 'disabled' : ''}
          onclick="avisar('${c.cliente_id}','${c.cliente_telefono}')">
          Reavisar
        </button>

        <button class="cobro-action primary" ${pagando ? 'disabled' : ''}
          onclick="pagar('${c.cliente_id}')">
          Confirmar pago
        </button>`;
    }

    if (tabActual === 'pagado') {
      bottom = `
        ${accionInfo}
        <span class="cobro-estado pagado">Pago confirmado</span>`;
    }

    div.className = 'cobro-card';
    div.innerHTML = `
      <div class="cobro-top">
        <div>
          <strong>${c.cliente_nombre}</strong><br>
          <small>${c.cliente_id}</small>
        </div>
        <div><strong>${c.monto_total_bs} Bs</strong></div>
      </div>
      <div class="cobro-bottom">${bottom}</div>
    `;

    cont.appendChild(div);
  });
}

/* =========================
   MENSAJE FINAL (AGRUPADO)
   ========================= */

async function generarMensaje(clienteId) {
  const res = await fetch(
    `${API_BASE_URL}/api/cobros/detalle/${clienteId}`
  );
  const productos = await res.json();

  if (!productos.length) return '';

  const c0 = productos[0];
  const esSantaCruz =
    (c0.departamento_destino || '').toLowerCase().includes('santa cruz');

  let msg = `Hola ${c0.cliente_nombre}\n\n`;

  msg += esSantaCruz
    ? 'Tu pedido llegó a nuestra oficina.\n\n'
    : 'Tu pedido ya se encuentra disponible para envío.\n\n';

  let total = 0;

  productos.forEach((p, i) => {
    total += Number(p.monto_total_bs || 0);
    msg += `${i + 1}) Producto: ${p.descripcion_producto}\n`;
    msg += `Costo: ${p.peso_cobrado} kg × ${p.tipo_de_cobro} × ${p.dolar_cliente} = ${p.monto_total_bs} Bs\n\n`;
  });

  if (productos.length > 1) {
    msg += `Total a pagar: ${total} Bs\n\n`;
  }

  msg += 'Pago: QR o efectivo (solo Bs)\n\n';

  msg += esSantaCruz
    ? 'Horario: 09:30–12:00 / 14:30–18:00\nUbicación: https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n'
    : 'Para envío confirma:\nNombre completo:\nDepartamento:\nCelular:\n\n';

  msg += '— Bolivia Imports';

  return encodeURIComponent(msg);
}

/* =========================
   ACCIONES
   ========================= */

window.avisar = async function (clienteId, telefono) {
  if (avisando) return;
  avisando = true;
  render();

  try {
    const mensaje = await generarMensaje(clienteId);
    if (telefono) {
      window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
    }

    const res = await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clienteId })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'No se pudo avisar');
    } else {
      actualizarIndicador(true);
    }
  } catch (e) {
    actualizarIndicador(false);
  }

  avisando = false;
  cargarCobros();
};

window.pagar = async function (clienteId) {
  if (pagando) return;
  pagando = true;
  render();

  try {
    await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clienteId })
    });

    actualizarIndicador(true);
  } catch (e) {
    actualizarIndicador(false);
  }

  pagando = false;
  cargarCobros();
};
