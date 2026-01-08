alert("cobros.js cargado");


const lista = document.getElementById("lista-cobros");
const estado = document.getElementById("estado");

fetch(`${API_BASE}?accion=listarCobros`)
  .then(res => res.json())
  .then(data => {
    if (!data.ok) {
      estado.textContent = "Error al cargar cobros";
      return;
    }

    if (data.cobros.length === 0) {
      lista.innerHTML = "<p>No hay cobros pendientes</p>";
      return;
    }

    lista.innerHTML = "";

    data.cobros.forEach(c => {
      const div = document.createElement("div");
      div.className = "home-card";

      div.innerHTML = `
        <strong>${c.nombre}</strong>
        <p>ID: ${c.entrega_id}</p>
        <p>Monto: Bs ${c.monto}</p>
        <p>Avisos: ${c.avisos}</p>

        <button class="btn-avisar">Avisar</button>
        <button class="btn-pagar">Marcar pagado</button>
      `;

      // 🔑 CONEXIÓN REAL DE EVENTOS
      div.querySelector(".btn-avisar")
        .addEventListener("click", () => avisar(c.entrega_id));

      div.querySelector(".btn-pagar")
        .addEventListener("click", () => pagar(c.entrega_id));

      lista.appendChild(div);
    });
  })
  .catch(() => {
    estado.textContent = "Error de conexión";
  });

function avisar(id) {
  estado.textContent = "Registrando aviso...";

  fetch(`${API_BASE}?accion=avisarCobro&id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        estado.textContent = "Aviso registrado";
        location.reload();
      } else {
        estado.textContent = data.mensaje || "Error al registrar aviso";
      }
    })
    .catch(() => {
      estado.textContent = "Error de conexión";
    });
}


function pagar(id) {
  alert("Pagar presionado: " + id);
}
