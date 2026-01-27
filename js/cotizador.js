import API_BASE_URL from '../../config.js';

async function calcular() {
  const body = {
    cliente: cliente.value,
    codigo: codigo.value,
    fob: Number(fob.value || 0),
    flete: Number(flete.value || 0),
    seguro: Number(seguro.value || 0),
    categoria: categoria.value,
    peso: Number(peso.value || 0),
    alto: Number(alto.value || 0),
    ancho: Number(ancho.value || 0),
    profundo: Number(profundo.value || 0)
  };

  const res = await fetch(`${API_BASE_URL}/api/cotizador/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  total.innerText = `${data.total} Bs`;
  pago1.innerText = `${data.pago1} Bs`;
  pago2.innerText = `${data.pago2} Bs`;
}

function verCliente() {
  window.open('cotizacion-cliente.html', '_blank');
}
