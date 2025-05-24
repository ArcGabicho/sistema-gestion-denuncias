function toggleAboutModal() {
  const modal = document.getElementById('aboutModal');
  modal.classList.toggle('hidden');
}

function toggleContactModal() {
  const modal = document.getElementById('contactModal');
  modal.classList.toggle('hidden');
}

function enviarContacto(event) {
  event.preventDefault();
  alert('Mensaje enviado. Gracias por contactarnos.');
  toggleContactModal();

  // Limpieza del formulario (opcional)
  event.target.reset();
}
