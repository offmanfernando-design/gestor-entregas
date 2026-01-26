import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let datos = [];
let avisando = false;
let pagando = false;

/* =========================
   MODAL PWA
   ========================= */

function mostrarModal(mensaje) {
  const modal = document.getElementById('appModal');
  const text = document.getElementById('appModalMessage');
  const btn = document.getElementById('appModalClose');

  if (!modal || !text || !btn) return;

  text.textContent = mensaje;
  modal.classList.remove('hidden');

  btn.onclick = cerrarModal;
}

function cerrarModal() {
  const modal = document.getElementById('appModal');
  if (!modal) return;
  modal.classList.add('hidden');
}

/* =========================
   INDICADOR DE CONEXIÓN
   ========================= */

function actualizarIndicador(ok = true) {
  const el = document.getElementById('syncStatus');
  if (!el) return;

  el.classList.toggle('offline', !ok);
  el.classList.remove('loading');

  el.querySelector('.text').textContent = ok ? 'Conectado' : 'Sin conexión';
}

function setConectando() {
  const el = document.getElementById('syncStatus');
  if (!el) return;

  el.classList.add('loading');
  el.classList.remove('offline');
  el.querySelector('.text').textContent = 'Conectando';
}

/* =========================
   UTIL: TIEMPO HUMANO
   ========================= */

function tiempoHumanoDesde(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  const diffMs = Date.now() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 60) {
    return `hoy ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffMin < 1440) return 'ayer';
  const dias = Math.floor(diffMin / 1440);
  return `hace ${dias} día${dias > 1 ? 's' : ''}`;
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
    const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
    datos = await res.json();
    render();
    actualizarIndicador(true);
  } catch {
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
    let infoExtra = '';

    if (tabActual === 'pendiente') {
      infoExtra = `<small>${c.descripcion_producto || ''}</small>`;
    }

    if (tabActual === 'avisado') {
      infoExtra = `
        <small>
          Aviso ${c.avisos_count || 1} · ${tiempoHumanoDesde(c.ultima_accion_fecha)}
        </small>
      `;
    }

    div.className = 'cobro-card';
    div.innerHTML = `
      <div class="cobro-top">
        <div>
          <strong>${c.cliente_nombre}</strong><br>
          <small>${c.cliente_id}</small><br>
          ${infoExtra}
        </div>
        <div><strong>${c.monto_total_bs} Bs</strong></div>
      </div>

      <div class="cobro-bottom">
        ${renderBotones(c)}
      </div>
    `;

    cont.appendChild(div);
  });
}

function renderBotones(c) {
  if (tabActual === 'pendiente') {
    return `
      <button class="cobro-action primary" ${avisando ? 'disabled' : ''}
        onclick="avisar('${c.cliente_id}','${c.cliente_telefono}')">
        Avisar
      </button>
    `;
  }

  if (tabActual === 'avisado') {
    return `
      <button class="cobro-action" ${avisando ? 'disabled' : ''}
        onclick="avisar('${c.cliente_id}','${c.cliente_telefono}')">
        Reavisar
      </button>
      <button class="cobro-action primary" ${pagando ? 'disabled' : ''}
        onclick="pagar('${c.cliente_id}')">
        Confirmar pago
      </button>
    `;
  }

  return `<span class="cobro-estado pagado">Pago confirmado</span>`;
}

/* =========================
   ACCIONES
   ========================= */

window.avisar = async function (clienteId, telefono) {
  if (avisando) return;
  avisando = true;
  render();

  try {
    const res = await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clienteId })
    });

    if (!res.ok) {
      const data = await res.json();
      mostrarModal(data.error || 'No se pudo avisar');
      avisando = false;
      render();
      return;
    }

    const msg = await generarMensaje(clienteId);
    if (telefono) {
      window.open(`https://wa.me/${telefono}?text=${msg}`, '_blank');
    }

    actualizarIndicador(true);
  } catch {
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
  } catch {
    actualizarIndicador(false);
  }

  pagando = false;
  cargarCobros();
};

/* =========================
   MENSAJE WHATSAPP
   ========================= */

async function generarMensaje(clienteId) {
  const res = await fetch(`${API_BASE_URL}/api/cobros/detalle/${clienteId}`);
  const productos = await res.json();
  if (!productos.length) return '';

  let msg = `Hola ${productos[0].cliente_nombre}\n\n`;
  let total = 0;

  productos.forEach((p, i) => {
    total += Number(p.monto_total_bs || 0);
    msg += `${i + 1}) ${p.descripcion_producto} - ${p.monto_total_bs} Bs\n`;
  });

  msg += `\nTotal a pagar: ${total} Bs\n\n— Bolivia Imports`;
  return encodeURIComponent(msg);
}
