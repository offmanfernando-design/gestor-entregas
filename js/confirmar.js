import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');
const tabAlmacen = document.getElementById('tab-almacen');
const tabHistorial = document.getElementById('tab-historial');

/* =========================
   TABS
   ========================= */
tabAlmacen.onclick = () => cambiarEstado('en_almacen');
tabHistorial.onclick = () => cambiarEstado('entregado');

function cambiarEstado(estado) {
  estadoActual = estado;
  tabAlmacen.classList.toggle('active', estado === 'en_almacen');
  tabHistorial.classList.toggle('active', estado === 'entregado');
  cargarEntregas();
}

/* =========================
   AGRUPAR POR CLIENTE
   ========================= */
function agruparPorCliente(entregas) {
  return entregas.reduce((acc, e) => {
    if (!acc[e.cliente_nombre]) acc[e.cliente_nombre] = [];
    acc[e.cliente_nombre].push(e);
    return acc;
  }, {});
}

/* =========================
   CARGAR ENTREGAS
   ========================= */
async function cargarEntregas() {
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const res = await fetch(url);
  const json = await res.json();

  lista.innerHTML = '';

  if (!json.data || json.data.length === 0) {
    lista.innerHTML = `<p class="empty">No hay entregas</p>`;
    return;
  }

  const grupos = agruparPorCliente(json.data);

  Object.entries(grupos).forEach(([cliente, entregas]) => {
    const header = document.createElement('div');
    header.className = 'cliente-header';
    header.textContent = cliente;
    lista.appendChild(header);

    entregas.forEach(e => {
      lista.appendChild(renderEntrega(e));
    });
  });
}

searchInput.oninput = cargarEntregas;

/* =========================
   RENDER ENTREGA (SWIPE)
   ========================= */
function renderEntrega(entrega) {
  const card = document.createElement('div');
  card.className = 'entrega swipe-card';

  card.innerHTML = `
    <div class="swipe-bg">Entregado</div>
    <div class="swipe-content">
      <div class="entrega-row">
        <div class="entrega-monto">Bs ${entrega.monto_total_bs}</div>
        <div class="entrega-producto">
          ${entrega.descripcion_producto || 'Producto sin descripción'}
        </div>
        <div class="entrega-ubicacion">
          <span class="material-symbols-rounded">location_on</span>
          ${entrega.ubicacion_fisica || 'Sin ubicación'}
        </div>
      </div>
    </div>
  `;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let dragging = false;

  const content = card.querySelector('.swipe-content');

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    content.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    if (!dragging) return;

    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // Si el gesto es más vertical, cancelamos swipe
    if (Math.abs(dy) > Math.abs(dx)) {
      dragging = false;
      content.style.transform = 'translateX(0)';
      return;
    }

    // Swipe derecha → izquierda (dx negativo)
    if (dx < 0) {
      currentX = dx;
      content.style.transform = `translateX(${dx}px)`;
    }
  });

  card.addEventListener('touchend', async () => {
    dragging = false;
    content.style.transition = 'transform .25s ease';

    if (currentX < -120) {
      await confirmarEntrega(entrega.entrega_id);
    }

    content.style.transform = 'translateX(0)';
    currentX = 0;
  });

  return card;
}

/* =========================
   CONFIRMAR ENTREGA
   ========================= */
async function confirmarEntrega(id) {
  await fetch(`${API_BASE_URL}/gestor-entregas/${id}/entregar`, {
    method: 'PATCH'
  });
  cargarEntregas();
}

/* INIT */
cargarEntregas();
