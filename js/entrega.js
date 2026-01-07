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
  window.location.href = "resultado.html";
}

