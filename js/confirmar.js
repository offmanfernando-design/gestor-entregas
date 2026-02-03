import API_BASE_URL from './config.js';

/* =========================
   ESTADO GLOBAL
   ========================= */
let estadoActual = 'en_almacen';

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');
const tabAlmacen = document.getElementById('tab-almacen');
const tabHistorial = document.getElementById('tab-historial');

/* =========================
   MODAL PWA
   ========================= */
const appModal = document.getElementById('appModal');
const appModalMessage = document.getElementById('appModalMessage');
const appModalClose = document.getElementById('appModalClose');

function showModal(message) {
  appModalMessage.textContent = message;
  appModal.classList.remove('hidden');
}

appModalClose.addEventListener('click', () => {
  appModal.classList.add('hidden');
});

/* =========================
   TABS
   ========================= */
tabAlmacen.addEventListener('click', () => cambiarEstado('en_almacen'));
tabHistorial.addEventListener('click', () => cambiarEstado('entregado'));

function cambiarEstado(estado) {
  estadoActual = estado;

  tabAlmacen.classList.toggle('active', estado === 'en_almacen');
  tabHistorial.classList.toggle('active', estado === 'entregado');

  cargarEntregas();
}

/* =========================
   CARGAR ENTREGAS
   ========================= */
async function cargarEntregas() {
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${encodeURIComponent(estadoActual)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    lista.innerHTML = '';

    if (!json.data || json.data.length === 0) {
      lista.innerHTML = `
        <p style="text-align:center;color:#777;">
          No hay entregas para mostrar
        </p>
      `;
      return;
    }

    json.data.forEach(renderFila);
  } catch (err) {
    console.error(err);
    showModal('Error al cargar las entregas. Verifica la conexión.');
  }
}

searchInput.addEventListener('input', cargarEntregas);

/* =========================
   RENDER FILA
   ========================= */
function renderFila(entrega) {
  const div = document.createElement('div');
  div.className = 'cobro-card swipe-card';

  div.innerHTML = `
    <div class="swipe-bg">✔ Confirmar</div>

    <div class="swipe-content">
      <div class="cobro-header">
        <div class="cobro-cliente">
          ${entrega.cliente_nombre}
        </div>
        <div class="cobro-monto">
          Bs ${entrega.monto_total_bs}
        </div>
      </div>

      <div class="cobro-detalle">
        <span class="material-symbols-rounded">location_on</span>
        ${entrega.ubicacion_fisica || 'Sin ubicación'}
      </div>
    </div>
  `;

  let startX = 0;
  let currentX = 0;
  let dragging = false;

  const content = div.querySelector('.swipe-content');

  div.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    dragging = true;
    content.style.transition = 'none';
  });

  div.addEventListener('touchmove', e => {
    if (!dragging) return;
    currentX = e.touches[0].clientX - startX;
    if (currentX > 0) {
      content.style.transform = `translateX(${currentX}px)`;
    }
  });

  div.addEventListener('touchend', () => {
    dragging = false;
    content.style.transition = 'transform 0.25s ease';

    if (currentX > 80) {
      confirmarEntrega(entrega.entrega_id, entrega);
    }

    content.style.transform = 'translateX(0)';
    currentX = 0;
  });

  lista.appendChild(div);
}

/* =========================
   DETALLE / CONFIRMAR
   ========================= */
async function abrirDetalle(entrega_id) {
  try {
    const res = await fetch(`${API_BASE_URL}/gestor-entregas/${entrega_id}`);
    const json = await res.json();
    const e = json.data;

    if (e.estado_operativo !== 'en_almacen') {
      showModal('Esta entrega ya fue registrada como entregada.');
      return;
    }

    confirmarEntrega(entrega_id, e);
  } catch (err) {
    console.error(err);
    showModal('No se pudo cargar el detalle de la entrega.');
  }
}

async function confirmarEntrega(entrega_id, entrega) {
  showModal(
    `¿Confirmar entrega para:\n\n${entrega.cliente_nombre}\nUbicación: ${entrega.ubicacion_fisica}`
  );

  // Reasignamos acción del botón
  appModalClose.onclick = async () => {
    appModal.classList.add('hidden');

    try {
      await fetch(
        `${API_BASE_URL}/gestor-entregas/${entrega_id}/entregar`,
        { method: 'PATCH' }
      );

      showModal('Entrega confirmada correctamente.');
      cargarEntregas();
    } catch (err) {
      console.error(err);
      showModal('Error al confirmar la entrega.');
    }
  };
}

/* =========================
   INIT
   ========================= */
cargarEntregas();
