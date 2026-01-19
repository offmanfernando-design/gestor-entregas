/* =========================================================
   COBROS UI – FRONTEND (OPTIMIZADO V2)
   Bolivia Imports – Sistema Logístico
   ========================================================= */

const API_URL = 'https://script.google.com/macros/s/AKfycbzbxPWwcJI6XoNlrAA5QlfxNaAg1l78SMB90v2syYOaEIyLpI8j4_ttsyFH3lqF4SfO/exec';

let tabActual = 'pendiente';
let datos = [];            // estado en memoria
let textoBusqueda = '';

document.addEventListener('DOMContentLoaded', cargarCobros);

/* ===============================
   CARGA INICIAL (UNA SOLA VEZ)
================================ */
function cargarCobros() {
  fetch(`${API_URL}?accion=listarCobros`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) {
        alert(res.mensaje || 'Error backend');
        return;
      }
      datos = res.cobros || [];
      render();
    })
    .catch(() => alert('No conecta con Apps Script'));
}

/* ===============================
   CAMBIO DE TAB (SIN BACKEND)
================================ */
function cambiarTab(tab, btn) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  render(); // solo frontend
}

/* ===============================
   BUSCADOR (FRONTEND PURO)
================================ */
function aplicarBusqueda() {
  const input = document.getElementById('buscadorCobros');
  textoBusqueda = (input.value || '').toLowerCase();
  render();
}

/* ===============================
   ESTADO REAL DE COBRO
================================ */
function estadoCobro(entrega) {
  const cobrado = Number(entrega.monto_cobrado_bs || 0);
  const total = Number(entrega.cobro_total_bs || 0);
  const avisos = Number(entrega.cantidad_avisos || 0);

  if (total > 0 && cobrado >= total) return 'pagado';
  if (avisos > 0) return 'avisado';
  return 'pendiente';
}

/* ===============================
   RENDER PRINCIPAL
================================ */
function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  const filtrados = datos.filter(d => {

    // filtro por estado
    if (estadoCobro(d) !== tabActual) return false;

    // filtro por búsqueda
    if (!textoBusqueda) return true;

    const tracking = (d.tracking || '').toString();
    const ultimos4 = tracking.slice(-4);

    const texto = `
      ${d.nombre || ''}
      ${d.numero || ''}
      ${tracking}
      ${ultimos4}
      ${d.entrega_id || ''}
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
        <small>Monto: ${Number(d.cobro_total_bs || 0).toFixed(2)} Bs</small>
        ${acciones(d)}
      </div>
    `;
  });
}

/* ===============================
   ACCIONES POR ESTADO
================================ */
function acciones(d) {

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
        <button onclick="avisar('${d.entrega_id}')">Reavisar</button>
        <button class="primary" onclick="pagar('${d.entrega_id}')">
          Confirmar pago
        </button>
      </div>
    `;
  }

  return '';
}

/* ===============================
   AVISAR (BACKEND + UPDATE LOCAL)
================================ */
function avisar(id) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  fetch(`${API_URL}?accion=avisarCobro&id=${encodeURIComponent(id)}`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) {
        alert(res.mensaje || 'Error al avisar');
        return;
      }

      // actualizar SOLO en memoria
      const item = datos.find(d => d.entrega_id === id);
      if (item) {
        item.cantidad_avisos = Number(item.cantidad_avisos || 0) + 1;
      }

      render();
    })
    .catch(() => alert('Error al avisar'));
}

/* ===============================
   PAGAR (BACKEND + UPDATE LOCAL)
================================ */
function pagar(id) {
  if (!confirm('¿Confirmar pago recibido?')) return;

  fetch(`${API_URL}?accion=pagarCobro&id=${encodeURIComponent(id)}&metodo=EFECTIVO`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) {
        alert(res.mensaje || 'Error al pagar');
        return;
      }

      // actualizar SOLO en memoria
      const item = datos.find(d => d.entrega_id === id);
      if (item) {
        item.monto_cobrado_bs = Number(item.cobro_total_bs || 0);
      }

      render();
    })
    .catch(() => alert('Error al pagar'));
}
