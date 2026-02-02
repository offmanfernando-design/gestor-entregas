import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');

document.getElementById('tab-almacen').onclick = () => cambiarEstado('en_almacen');
document.getElementById('tab-historial').onclick = () => cambiarEstado('entregado');

searchInput.addEventListener('input', cargarEntregas);

async function cambiarEstado(estado) {
  estadoActual = estado;
  cargarEntregas();
}

async function cargarEntregas() {
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const res = await fetch(url);
  const json = await res.json();

  lista.innerHTML = '';
  json.data.forEach(renderFila);
}

function renderFila(entrega) {
  const div = document.createElement('div');
  div.className = 'fila';
  div.innerHTML = `
    <strong>${entrega.cliente_nombre}</strong><br>
    📍 <b>${entrega.ubicacion_fisica}</b><br>
    💰 Bs ${entrega.monto_total_bs}
  `;
  div.onclick = () => abrirDetalle(entrega.entrega_id);
  lista.appendChild(div);
}

async function abrirDetalle(entrega_id) {
  const res = await fetch(`${API_BASE_URL}/gestor-entregas/${entrega_id}`);
  const json = await res.json();
  const e = json.data;

  document.getElementById('modal-content').innerHTML = `
    <h3>📍 UBICACIÓN: ${e.ubicacion_fisica}</h3>
    <p><b>Cliente:</b> ${e.cliente_nombre}</p>
    <p><b>Descripción:</b> ${e.descripcion_producto}</p>
    <p><b>Ítems:</b> ${e.cantidad_items}</p>
    <p><b>Monto:</b> Bs ${e.monto_total_bs}</p>
    ${
      e.estado_operativo === 'en_almacen'
        ? `<button onclick="confirmarEntrega('${e.entrega_id}')">✅ Confirmar entrega</button>`
        : `<p><i>Entrega ya realizada</i></p>`
    }
  `;

  document.getElementById('modal').classList.remove('hidden');
}

async function confirmarEntrega(entrega_id) {
  if (!confirm('¿Confirmar entrega?')) return;

  await fetch(`${API_BASE_URL}/gestor-entregas/${entrega_id}/entregar`, {
    method: 'PATCH',
  });

  cerrarModal();
  cargarEntregas();
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
}

cargarEntregas();
