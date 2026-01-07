function buscar() {
  const entregaMock = {
    id: "TEST-001",
    cliente: "Cliente prueba",
    descripcion: "Bulto de prueba"
  };

  localStorage.setItem("entrega", JSON.stringify(entregaMock));
  window.location.href = "entrega.html";
}

