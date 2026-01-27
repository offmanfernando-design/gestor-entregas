import API_BASE_URL from './config.js';

async function calcular() {
  try {
    const payload = {
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

    // feedback visual mínimo
    total.textContent = 'Calculando…';
    pago1.textContent = '—';
    pago2.textContent = '—';

    const res = await fetch(`${API_BASE_URL}/api/cotizador/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Error al calcular');

    const data = await res.json();

    total.textContent = `${data.total} Bs`;
    pago1.textContent = `${data.pago1} Bs`;
    pago2.textContent = `${data.pago2} Bs`;

  } catch (err) {
    console.error(err);
    alert('Error al calcular cotización');
  }
}

function verCliente() {
  window.open('cotizacion-cliente.html', '_blank');
}

// 🔹 Exponer funciones al HTML
window.calcular = calcular;
window.verCliente = verCliente;
