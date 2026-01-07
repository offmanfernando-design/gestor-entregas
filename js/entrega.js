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
  window.location.href = "resultado.html";
}
