console.log('CONFIRMAR.JS CARGADO', new Date().toISOString());

import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

/* 🔹 FIX DUPLICACIÓN: token de render */
let renderToken = 0;

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');

const tabAlmacen = document.getElementById('tab-almacen');
const tabTerminal = document.getElementById('tab-terminal');
const tabHistorial = document.getElementById('tab-historial');

const syncStatus = document.getElementById('syncStatus');

/* =========================
   CONEXIÓN
   ========================= */
function setConectando() {
  syncStatus.classList.add('loading');
  syncStatus.querySelector('.text').textContent = 'Conectando';
}

function setConectado() {
  syncStatus.classList.remove('loading');
  syncStatus.querySelector('.text').textContent = 'Conectado';
}

function setOffline() {
  syncStatus.classList.remove('loading');
  syncStatus.querySelector('.text').textContent = 'Sin conexión';
}

/* =========================
   TABS
   ========================= */
tabAlmacen.onclick = () => cambiarEstado('en_almacen');
tabTerminal.onclick = () => cambiarEstado('terminal');
tabHistorial.onclick = () => cambiarEstado('entregado');

function cambiarEstado(estado) {
  estadoActual = estado;

  tabAlmacen.classList.toggle('active', estado === 'en_almacen');
  tabTerminal.classList.toggle('active', estado === 'terminal');
  tabHistorial.classList.toggle('active', estado === 'entregado');

  cargarEntregas();
}

/* =========================
   CARGAR
   ========================= */
async function cargarEntregas() {
   console.log('🔁 cargarEntregas', estadoActual);

  const currentToken = ++renderToken;

  lista.innerHTML = '';
  

  // 🟡 TERMINAL
  if (estadoActual === 'terminal') {
  console.log('🚀 ENTRÉ A TERMINAL');
  setConectando();

  try {
    console.log('🚀 EJECUTANDO FETCH TERMINAL');

    const res = await fetch(
      `${API_BASE_URL}/api/receptores`,
      { cache: 'no-store' }
    );

    console.log('📡 FETCH TERMINAL RESPUESTA', res.status);

    const json = await res.json();
    console.log('📦 DATA TERMINAL', json);

    const data = json.data || [];

    if (!data.length) {
      lista.innerHTML = `
        <div style="
          padding: 24px;
          text-align: center;
          color: var(--muted);
          font-size: 14px;
        ">
          No hay entregas a terminal registradas.
        </div>
      `;
      setConectado();
      return;
    }

    data.forEach(r => {
      lista.appendChild(renderTerminal(r));
    });

    setConectado();
    return;

  } catch (err) {
    console.error('❌ ERROR FETCH TERMINAL', err);
    if (currentToken === renderToken) {
      setOffline();
    }
    return;
  }
} // ← cierre correcto del IF TERMINAL


  // 🔵 ALMACÉN / HISTORIAL
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
   setConectando();

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (currentToken !== renderToken) return;

    const grupos = agruparPorCliente(json.data || []);

    Object.entries(grupos).forEach(([cliente, entregas]) => {
      const h = document.createElement('div');
      h.className = 'cliente-header';
      h.textContent = cliente;
      lista.appendChild(h);

      entregas.forEach(e => lista.appendChild(renderEntrega(e)));
    });

    setConectado();
  } catch {
    if (currentToken === renderToken) {
      setOffline();
    }
    return;
  }
} // ← cierre correcto de cargarEntregas()

/* 🔹 BONUS: debounce search */
let searchTimer;
searchInput.oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(cargarEntregas, 300);
};

/* =========================
   AGRUPAR
   ========================= */
function agruparPorCliente(entregas) {
  return entregas.reduce((acc, e) => {
    acc[e.cliente_nombre] ??= [];
    acc[e.cliente_nombre].push(e);
    return acc;
  }, {});
}

/* =========================
   RENDER ENTREGA (ALMACÉN)
   ========================= */
function renderEntrega(entrega) {
  const card = document.createElement('div');
  card.className = 'entrega swipe-card';

  card.innerHTML = `
    <div class="swipe-bg">Entregado</div>
    <div class="swipe-content">
      <div class="entrega-row">
        <div class="entrega-monto">Bs ${entrega.monto_total_bs}</div>
        <div class="entrega-producto">${entrega.descripcion_producto || ''}</div>
        <div class="entrega-ubicacion">
          <span class="material-symbols-rounded">location_on</span>
          ${entrega.ubicacion_fisica || 'Sin ubicación'}
        </div>
      </div>
    </div>
  `;

  if (estadoActual !== 'en_almacen') return card;

  let startX = 0;
  let startY = 0;
  let currentX = 0;

  const content = card.querySelector('.swipe-content');

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    card.classList.add('swiping');
    content.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) {
      currentX = dx;
      content.style.transform = `translateX(${dx}px)`;
    }
  });

  card.addEventListener('touchend', async () => {
    content.style.transition = 'transform .25s ease';

    if (currentX < -120) {
      card.classList.add('confirmed');
      await confirmarEntrega(entrega.entrega_id);
    }

    card.classList.remove('swiping');
    content.style.transform = 'translateX(0)';
    currentX = 0;
  });

  return card;
}

/* =========================
   TERMINAL (SIN TOCAR)
   ========================= */
function renderTerminal(r) {
  const card = document.createElement('div');
  card.className = 'entrega swipe-card';

  card.innerHTML = `
    <div class="swipe-bg">Entregado</div>
    <div class="swipe-content">
      <div class="entrega-row entrega-terminal">
        <div class="entrega-header">
          <strong>Entrega ${r.entrega_id}</strong><br>
          <span class="cliente-linea">
            Cliente: ${r.cliente_nombre || '—'}
          </span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">location_on</span>
          <span>${r.destino || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">person</span>
          <span>${r.nombre_receptor || r.cliente_nombre || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">call</span>
          <span>${r.telefono_receptor || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">local_shipping</span>
          <span>${r.transportadora || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">inventory_2</span>
          <span id="ubicacion-${r.entrega_id}">—</span>
        </div>

        <div class="entrega-info total">
          <span class="material-symbols-rounded">payments</span>
          <span id="total-${r.entrega_id}">— Bs</span>
        </div>
      </div>

      <div class="detalle hidden" id="detalle-${r.entrega_id}"></div>
    </div>
  `;

  cargarResumenEntrega(r.entrega_id);
  habilitarSwipe(card, r.entrega_id);
  card.onclick = () => toggleDetalleTerminal(r.entrega_id);

  return card;
}

/* =========================
   CONFIRMAR ENTREGA
   ========================= */
async function confirmarEntrega(id) {
  await fetch(`${API_BASE_URL}/gestor-entregas/${id}/entregar`, {
    method: 'PATCH'
  });
  setTimeout(cargarEntregas, 200);
}

/* INIT */
cargarEntregas();

/* =========================
   SWIPE TERMINAL (SIN TOCAR)
   ========================= */
function habilitarSwipe(card, entregaId) {
  let startX = 0;
  let currentX = 0;

  const content = card.querySelector('.swipe-content');

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    currentX = 0;
    card.classList.add('swiping');
    content.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    if (dx < 0) {
      currentX = dx;
      content.style.transform = `translateX(${dx}px)`;
    }
  });

  card.addEventListener('touchend', async () => {
    content.style.transition = 'transform .25s ease';

    if (currentX < -120) {
      card.classList.add('confirmed');
      await confirmarEntrega(entregaId);
    }

    content.style.transform = 'translateX(0)';
    card.classList.remove('swiping');
    currentX = 0;
  });
}
