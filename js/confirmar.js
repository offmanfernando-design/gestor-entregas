import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

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
  lista.innerHTML = '';
  setConectando();

  // 🟡 TERMINAL (placeholder por ahora)
  if (estadoActual === 'terminal') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/receptores`);
    const json = await res.json();

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

  } catch {
    setOffline();
    return;
  }
}

  // 🔵 ALMACÉN / HISTORIAL (flujo actual intacto)
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

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
    setOffline();
  }
}

searchInput.oninput = cargarEntregas;

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

function renderTerminal(r) {
  const card = document.createElement('div');
  card.className = 'entrega';

  card.innerHTML = `
    <div class="entrega-row">
      <div class="entrega-monto">
        Pedido ${r.pedido_id || '—'}
      </div>

      <div class="entrega-producto">
        Destino: <strong>${r.destino}</strong>
      </div>

      <div class="entrega-ubicacion">
        <span class="material-symbols-rounded">person</span>
        Receptor: ${r.nombre_receptor || r.cliente_nombre}
      </div>

      ${r.transportadora ? `
        <div class="entrega-ubicacion">
          <span class="material-symbols-rounded">local_shipping</span>
          ${r.transportadora}
        </div>
      ` : ''}

      ${r.observaciones ? `
        <div class="entrega-ubicacion">
          <span class="material-symbols-rounded">notes</span>
          ${r.observaciones}
        </div>
      ` : ''}
    </div>
  `;

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
