const lista = document.getElementById("lista-cobros");
const estado = document.getElementById("estado");

/**
 * =========================
 * Cargar cobros pendientes
 * =========================
 */
function cargarCobros() {
  fetch(`${API_BASE}?accion=listarCobros`)
    .then(res => res.json())
    .then(data => {
      lista.innerHTML = "";
      estado.textContent = "";

      if (!data.ok || data.cobros.length === 0) {
        lista.innerHTML = "<p>No hay cobros pendientes</p>";
        return;
      }

      data.cobros.forEach(c => {

        // ✅ FORMATEO CORRECTO DEL MONTO
        const montoFormateado = Number(c.monto).toLocaleString("es-BO", {
          minimumFractionDigits: c.monto % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2
        });

        const div = document.createElement("div");
        div.className = "home-card";

        div.innerHTML = `
          <strong>${c.nombre}</strong>
          <p>ID: ${c.entrega_id}</p>
          <p>Monto: Bs ${montoFormateado}</p>
          <p>Avisos: ${c.avisos}</p>

          <button class="btn-avisar">Avisar</button>
          <button class="btn-pagar">Marcar pagado</button>
        `;

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
}

/**
 * =========================
 * Avisar cobro
 * =========================
 */

function avisar(entregaId) {
  abrirWhatsApp(entregaId);
}

/**
 * =========================
 * Marcar cobro pagado
 * =========================
 */
function pagar(id) {
  if (!confirm("¿Confirmar que el cobro fue PAGADO?")) return;

  fetch(`${API_BASE}?accion=pagarCobro&id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        estado.textContent = "Error al marcar como pagado";
        return;
      }

      estado.textContent = "Cobro marcado como PAGADO";
      cargarCobros();
    })
    .catch(() => {
      estado.textContent = "Error de conexión";
    });
}

function abrirWhatsApp(entregaId) {

  fetch(`${API_BASE}?accion=generarMensajeWhatsApp&id=${entregaId}`)
    .then(res => res.json())
    .then(data => {

      if (!data.ok) {
        alert("No se pudo generar el mensaje de WhatsApp");
        return;
      }

      const telefono = data.telefono;     // viene del backend
      const mensaje = data.mensaje;       // ya armado

      const texto = encodeURIComponent(mensaje);

      const esMovil = /Android|iPhone|iPad/i.test(navigator.userAgent);

      const url = esMovil
        ? `whatsapp://send?phone=591${telefono}&text=${texto}`
        : `https://wa.me/591${telefono}?text=${texto}`;

      // 🔥 abre WhatsApp directo (app en móvil)
      window.location.href = url;

      // 📝 registra aviso
      fetch(`${API_BASE}?accion=avisarCobro&id=${entregaId}&canal=WHATSAPP`)
        .then(() => cargarCobros());
    })
    .catch(() => alert("Error de conexión"));
}


// 🚀 Inicial
cargarCobros();
