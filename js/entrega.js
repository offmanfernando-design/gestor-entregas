const entrega = JSON.parse(localStorage.getItem("entrega"));
const info = document.getElementById("info");

if (!entrega) {
  window.location.href = "confirmar.html";
}

info.innerHTML = `
  <p><strong>Cliente:</strong> ${entrega.cliente}</p>
  <p><strong>ID:</strong> ${entrega.id}</p>
  <p><strong>Descripción:</strong> ${entrega.descripcion}</p>
`;

function confirmar() {
  const estado = document.getElementById("estado");
  estado.textContent = "Confirmando...";

  fetch(API_BASE, {
    method: "POST",
    body: JSON.stringify({
      accion: "confirmarEntrega",
      id: entrega.id
    })
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        estado.textContent = "Error al confirmar";
        return;
      }

      window.location.href = "resultado.html";
    })
    .catch(() => {
      estado.textContent = "Error de red";
    });
}
