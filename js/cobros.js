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

  fetch(`${API_BASE}?accion=datosWhatsappCobro&id=${entregaId}`)
    .then(res => res.json())
    .then(data => {

      if (!data.ok) {
        alert("No se pudieron obtener los datos del cobro");
        return;
      }

      const cliente = data.cliente;
      const productos = data.productos;
      const total = data.total;
      const mostrarHorario = data.mostrarHorario;

      let mensaje = `Hola ${cliente}\n\n`;
      mensaje += `Tu pedido llegó a nuestra oficina.\n\n`;

      // 📦 Productos
      productos.forEach((p, i) => {
        mensaje += `${i + 1}) Producto: ${p.producto}\n`;
        mensaje += `Costo: ${p.peso} kg × ${p.tipoCobro} × ${p.dolar} = ${p.subtotal} Bs\n\n`;
      });

      // 💰 Total (solo si hay más de un producto)
      if (productos.length > 1) {
        mensaje += `- Total a pagar: ${total} Bs\n\n`;
      }

      // 💳 Datos de pago
      mensaje += `Pago: QR o efectivo (solo Bs)\n`;
      mensaje += `QR: https://drive.google.com/file/d/1oDrw0G25xlUbMQX7ZaSS3Z_c2Bdt4gz6/view\n\n`;

      // 📍 Horario y ubicación (solo Santa Cruz)
      if (mostrarHorario) {
        mensaje += `Horario: 09:30 a 12:00 y 14:30 a 18:15\n`;
        mensaje += `Ubicación: https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n`;
      }

      mensaje += `— Bolivia Imports`;

      // 📱 Abrir WhatsApp
      const telefono = "59175607003"; // ← reemplaza por ahora
      const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");

      // 📝 Registrar aviso
      fetch(`${API_BASE}?accion=avisarCobro&id=${entregaId}&canal=WHATSAPP`)
        .then(() => cargarCobros());

    })
    .catch(() => alert("Error de conexión"));
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

// 🚀 Inicial
cargarCobros();
