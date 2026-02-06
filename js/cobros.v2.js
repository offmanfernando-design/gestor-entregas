import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let datos = [];
let datosFiltrados = [];
let avisando = false;
let pagando = false;
let tarjetasAbiertas = {};


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
    datosFiltrados = [...datos];
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
   BUSCADOR
   ========================= */

window.aplicarBusqueda = function () {
  const texto = document.getElementById('buscadorCobros').value
    .trim()
    .toLowerCase();

  const fecha = document.getElementById('filtroFecha').value;

  datosFiltrados = datos.filter(c => {
    let okTexto = true;
    let okFecha = true;

    if (texto) {
      const nombre = (c.cliente_nombre || '').toLowerCase();
      const telefono = (c.cliente_telefono || '').toLowerCase();
      const clienteId = (c.cliente_id || '').toString();
      const ultimos4 = clienteId.slice(-4);

      okTexto =
        nombre.includes(texto) ||
        telefono.includes(texto) ||
        ultimos4.includes(texto);
    }

    if (fecha) {
      okFecha = (c.fecha || '').startsWith(fecha);
    }

    return okTexto && okFecha;
  });

  render();
};

/* =========================
   RENDER
   ========================= */

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  datosFiltrados.forEach(c => {
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
    div.onclick = () => toggleDetalle(c.cliente_id);

    div.innerHTML = `
      <div class="cobro-top">
        <div>
          <strong>${c.cliente_nombre}</strong><br>
          <small>${c.cliente_id}</small><br>
          ${infoExtra}
        </div>
        <div>
          <strong id="total-${c.cliente_id}">
            ${c.monto_total_bs} Bs
          </strong>
        </div>
      </div>

      <div class="cobro-bottom">
        ${renderBotones(c)}
      </div>

      <div class="cobro-detalle hidden" id="detalle-${c.cliente_id}">
        <small>Cargando detalle...</small>
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
   DESGLOSE EXPANDIBLE (FIX TOTAL)
   ========================= */

async function toggleDetalle(clienteId) {
  const cont = document.getElementById(`detalle-${clienteId}`);
  if (!cont) return;

  const abierto = tarjetasAbiertas[clienteId];

  if (abierto) {
    cont.classList.add('hidden');
    tarjetasAbiertas[clienteId] = false;
    return;
  }

  tarjetasAbiertas[clienteId] = true;
  cont.classList.remove('hidden');

  let productos = [];

  try {
    // 🔹 Solo evitamos el fetch duplicado
    if (!cont.dataset.loaded) {
      const res = await fetch(`${API_BASE_URL}/api/cobros/detalle/${clienteId}`);
      productos = await res.json();
      cont.dataset.productos = JSON.stringify(productos);
      cont.dataset.loaded = '1';
    } else {
      productos = JSON.parse(cont.dataset.productos || '[]');
    }

    let html = '<div class="detalle-lista">';
    let total = 0;

    productos.forEach((p, i) => {
      const monto = Number(p.monto_total_bs || 0);
      total += monto;

      html += `
        <div class="detalle-item">
          <strong>${i + 1}) ${p.descripcion_producto}</strong><br>
          <small>Monto: ${monto} Bs</small>
        </div>
      `;
    });

    html += `
      <div class="detalle-total">
        <strong>Total: ${total} Bs</strong>
      </div>
    </div>`;

    cont.innerHTML = html;

    // 🔥 SIEMPRE actualizar el total de arriba
    const totalEl = document.getElementById(`total-${clienteId}`);
    if (totalEl) {
      totalEl.textContent = `${total} Bs`;
    }

  } catch (err) {
    console.error(err);
    cont.innerHTML = '<small>Error al cargar detalle</small>';
  }
}



/* =========================
   ACCIONES
   ========================= */

window.avisar = async function (clienteId, telefono) {
  if (avisando) return;
  avisando = true;
  render();

  try {
    // 1️⃣ Generar mensaje (rápido, aún permitido por iOS)
    const msg = await generarMensaje(clienteId);

    // 2️⃣ Abrir WhatsApp INMEDIATAMENTE
    if (telefono && msg) {
      window.open(
        `https://wa.me/${telefono}?text=${msg}`,
        '_blank'
      );
    }

    // 3️⃣ AHORA sí marcar como avisado
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

    actualizarIndicador(true);

  } catch (err) {
    console.error(err);
    actualizarIndicador(false);
  }

  avisando = false;
  cargarCobros();
};


/* =========================
   MENSAJE WHATSAPP (4 CASOS)
   ========================= */

async function generarMensaje(clienteId) {
  const res = await fetch(`${API_BASE_URL}/api/cobros/detalle/${clienteId}`);
  const productos = await res.json();
  if (!productos.length) return '';

  const c0 = productos[0];
  const nombre = c0.cliente_nombre || '';

  // 👉 SOLO PARA TEXTO / ENCABEZADO
  const esSantaCruz = (c0.departamento_destino || '')
    .toLowerCase()
    .includes('santa cruz');

  const esMultiple = productos.length > 1;

  let msg = `Hola ${nombre} 👋\n\n`;

  /* =========================
     ENCABEZADO
     ========================= */

  if (esSantaCruz) {
    msg += esMultiple
      ? 'Tus pedidos llegaron a nuestra oficina en Santa Cruz.\n\n'
      : 'Tu pedido llegó a nuestra oficina en Santa Cruz.\n\n';
  } else {
    msg += esMultiple
      ? 'Tus pedidos ya se encuentran disponibles para envío.\n\n'
      : 'Tu pedido ya se encuentra disponible para envío.\n\n';
  }

  /* =========================
     DETALLE DE PRODUCTOS
     ========================= */

  let total = 0;

  msg += esMultiple ? '📦 Detalle:\n\n' : '📦 Producto:\n\n';

  productos.forEach((p, i) => {
    const montoBs = Number(p.monto_total_bs || 0);
    total += montoBs;

    msg += `${i + 1}) Producto: ${p.descripcion_producto}\n`;
    msg += `Costo: ${p.peso_cobrado} × ${p.tipo_de_cobro} × ${p.dolar_cliente} = ${montoBs} Bs\n\n`;
  });

  /* =========================
     TOTAL (solo si es múltiple)
     ========================= */

  if (esMultiple) {
    msg += `💰 Total a pagar: ${total} Bs\n\n`;
  }

  /* =========================
     BLOQUE FINAL (DECIDE BACKEND)
     ========================= */

  try {
    const resLink = await fetch(
      `${API_BASE_URL}/api/receptores/link/${clienteId}`
    );

    if (resLink.ok) {
      const dataLink = await resLink.json();

      if (dataLink.link) {
        msg +=
          '📦 Para coordinar el envío, completa este formulario:\n' +
          `${dataLink.link}\n\n`;
      } else {
        // fallback oficina
        msg +=
          '💳 Pago: QR o efectivo (solo Bs)\n\n' +
          '🕒 Horario:\n' +
          '09:30–12:00 / 14:30–18:00\n\n' +
          '📍 Ubicación:\n' +
          'https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n';
      }
    }
  } catch (err) {
    console.error('Error obteniendo link de receptor', err);
  }

  msg += '— Bolivia Imports';

  return encodeURIComponent(msg);
}
