const entrega = JSON.parse(localStorage.getItem("entrega"));
const info = document.getElementById("info");

if (!entrega) {
  window.location.href = "confirmar.html";
}

info.innerHTML = `
  <p><strong>Cliente:</strong> <span id="cliente"></span></p>
  <p><strong>ID:</strong> <span id="id"></span></p>
  <p><strong>Descripción:</strong> <span id="descripcion"></span></p>
`;

document.getElementById("cliente").textContent = entrega.cliente;
document.getElementById("id").textContent = entrega.id;
document.getElementById("descripcion").textContent = entrega.descripcion;

function confirmar() {
  const entrega = JSON.parse(localStorage.getItem("entrega"));
  const estado = document.getElementById("estado");

  if (!entrega || !entrega.id) {
    alert("Entrega inválida");
    return;
  }

  estado.textContent = "Confirmando entrega...";

  fetch(`${API_BASE}?accion=confirmarEntrega`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      accion: "confirmarEntrega",
      id: entrega.id
    })
  })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) {
        estado.textContent = data.mensaje || "Error al confirmar";
        return;
      }

      // Limpieza y paso a resultado
      localStorage.removeItem("entrega");
      window.location.href = "resultado.html";
    })
    .catch(err => {
      console.error(err);
      estado.textContent = "Error de conexión";
    });
}

