/* =========================================================
   COBROS UI – FRONTEND
   Archivo: js/cobros.js
   Bolivia Imports – Sistema Logístico
   ========================================================= */

/* ===== URL OFICIAL DE APPS SCRIPT ===== */
const API_URL = 'https://script.google.com/macros/s/AKfycbzbxPWwcJI6XoNlrAA5QlfxNaAg1l78SMB90v2syYOaEIyLpI8j4_ttsyFH3lqF4SfO/exec';

/* ===== ESTADO ===== */
let tabActual = 'pendiente';
let datos = [];
let textoBusqueda = '';

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  cargarCobros();
});

/* ===== TABS ===== */
function cambiarTab(tab) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  event.target.classList.add('active');
  render();
}

/* ===== FETCH LISTA ===== */
function cargarCobros() {
  fetch(`${API_URL}?accion=listarCobros`)
    .then(res => res.json())
    .then(json => {
      if (!json.ok) {
        alert(json.mensaje || 'Error al listar cobros');
        return;
      }
      datos = json.cobros || [];
      render();
    })
    .catch(() => {
      alert('No se pudo conectar con el servidor');
    });
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

    /* --- FILTRO POR TAB --- */
    const coincideEstado =
      (tabActual === 'pendiente' && d.estado === 'Pendiente - No avisado') ||
      (tabActual === 'avisado' && d.estado === 'Avisado - Sin pago') ||
      (tabActual === 'pagado' && d.estado === 'Pagado');

    if (!coincideEstado) return false;

    /* --- FILTRO POR TEXTO --- */
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
        <strong>${d.nombre}</strong>
        <small>Monto: ${Number(d.monto || 0).toFixed(2)} Bs</small>
        ${renderAcciones(d)}
      </div>
    `;
  });
}

/* ===== ACCIONES POR ESTADO ===== */
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
function avisar(entregaId) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  fetch(`${API_URL}?accion=avisarCobro&id=${encodeURIComponent(entregaId)}`)
    .then(res => res.json())
    .then(json => {
      if (!json.ok) {
        alert(json.mensaje || 'Error al avisar');
        return;
      }
      cargarCobros();
    })
    .catch(() => {
      alert('Error de conexión al avisar');
    });
}

/* ===== PAGAR ===== */
function pagar(entregaId) {
  if (!confirm('¿Confirmar pago recibido?')) return;

  fetch(`${API_URL}?accion=pagarCobro&id=${encodeURIComponent(entregaId)}&metodo=EFECTIVO`)
    .then(res => res.json())
    .then(json => {
      if (!json.ok) {
        alert(json.mensaje || 'Error al registrar pago');
        return;
      }
      cargarCobros();
    })
    .catch(() => {
      alert('Error de conexión al pagar');
    });
}
