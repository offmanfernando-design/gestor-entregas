/* =========================================================
   COBROS UI – FRONTEND
   Bolivia Imports – Sistema Logístico
   ========================================================= */

const API_URL = 'https://script.google.com/macros/s/AKfycbzbxPWwcJI6XoNlrAA5QlfxNaAg1l78SMB90v2syYOaEIyLpI8j4_ttsyFH3lqF4SfO/exec';

let tabActual = 'pendiente';
let datos = [];
let textoBusqueda = '';

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  cargarCobros();
});

/* ===== NORMALIZAR ESTADO (CLAVE) ===== */
function normalizarEstado(d) {
  const raw = (d.estado || d.estado_cobro || '').toString().toLowerCase();

  if (raw.includes('pag')) return 'pagado';
  if (raw.includes('avi')) return 'avisado';

  return 'pendiente';
}

/* ===== CAMBIO DE TAB ===== */
function cambiarTab(tab, btn) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  render();
}

/* ===== FETCH ===== */
function cargarCobros() {
  fetch(`${API_URL}?accion=listarCobros`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) {
        alert(res.mensaje || 'Error al cargar cobros');
        return;
      }
      datos = res.cobros || [];
      render();
    })
    .catch(() => alert('Error de conexión con servidor'));
}

/* ===== BUSCADOR ===== */
function aplicarBusqueda() {
  const input = document.getElementById('buscadorCobros');
  textoBusqueda = (input.value || '').toLowerCase();
  render();
}

/* ===== RENDER ===== */
function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  const filtrados = datos.filter(d => {
    // 1. estado
    if (normalizarEstado(d) !== tabActual) return false;

    // 2. búsqueda
    if (!textoBusqueda) return true;

    const texto = `
      ${d.nombre || ''}
      ${d.numero || ''}
      ${d.entrega_id || ''}
      ${d.tracking || ''}
    `.toLowerCase();

    return texto.includes(textoBusqueda);
  });

  if (filtrados.length === 0) {
    cont.innerHTML = `<p style="color:#6b6b6b">Sin resultados</p>`;
    return;
  }

  filtrados.forEach(d => {
    cont.innerHTML += `
      <div class="card">
        <strong>${d.nombre || 'Sin nombre'}</strong>
        <small>Monto: ${Number(d.monto || 0).toFixed(2)} Bs</small>
        ${renderAcciones(d)}
      </div>
    `;
  });
}

/* ===== ACCIONES ===== */
function renderAcciones(d) {

  if (tabActual === 'pendiente') {
    return `
      <div class="actions">
        <button class="primary" onclick="avisar('${d.entrega_id}')">
          Avisar
        </button>
      </div>
    `;
  }

  if (tabActual === 'avisado') {
    return `
      <div class="actions">
        <button onclick="avisar('${d.entrega_id}')">
          Reavisar
        </button>
        <button class="primary" onclick="pagar('${d.entrega_id}')">
          Registrar pago
        </button>
      </div>
    `;
  }

  return '';
}

/* ===== AVISAR ===== */
function avisar(id) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  fetch(`${API_URL}?accion=avisarCobro&id=${encodeURIComponent(id)}`)
    .then(() => cargarCobros())
    .catch(() => alert('Error al avisar'));
}

/* ===== PAGAR ===== */
function pagar(id) {
  if (!confirm('¿Confirmar pago recibido?')) return;

  fetch(`${API_URL}?accion=pagarCobro&id=${encodeURIComponent(id)}&metodo=EFECTIVO`)
    .then(() => cargarCobros())
    .catch(() => alert('Error al pagar'));
}
