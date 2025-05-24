import { ubigeoData } from './ubigeo.js';

const departamentoSelect = document.getElementById('departamento');
const provinciaSelect = document.getElementById('provincia');
const distritoSelect = document.getElementById('distrito');

// Cargar departamentos
function cargarDepartamentos() {
  departamentoSelect.innerHTML = '<option value="">Seleccione Departamento</option>';
  Object.keys(ubigeoData).forEach(dep => {
    const option = document.createElement('option');
    option.value = dep;
    option.textContent = dep;
    departamentoSelect.appendChild(option);
  });
}

// Cargar provincias
function cargarProvincias(departamento) {
  provinciaSelect.innerHTML = '<option value="">Seleccione Provincia</option>';
  distritoSelect.innerHTML = '<option value="">Seleccione Distrito</option>';
  distritoSelect.disabled = true;

  if (ubigeoData[departamento]) {
    provinciaSelect.disabled = false;
    Object.keys(ubigeoData[departamento]).forEach(prov => {
      const option = document.createElement('option');
      option.value = prov;
      option.textContent = prov;
      provinciaSelect.appendChild(option);
    });
  } else {
    provinciaSelect.disabled = true;
  }
}

// Cargar distritos
function cargarDistritos(departamento, provincia) {
  distritoSelect.innerHTML = '<option value="">Seleccione Distrito</option>';

  if (ubigeoData[departamento] && ubigeoData[departamento][provincia]) {
    distritoSelect.disabled = false;
    ubigeoData[departamento][provincia].forEach(dist => {
      const option = document.createElement('option');
      option.value = dist;
      option.textContent = dist;
      distritoSelect.appendChild(option);
    });
  } else {
    distritoSelect.disabled = true;
  }
}

// Eventos
departamentoSelect.addEventListener('change', () => {
  const departamento = departamentoSelect.value;
  cargarProvincias(departamento);
});

provinciaSelect.addEventListener('change', () => {
  const departamento = departamentoSelect.value;
  const provincia = provinciaSelect.value;
  cargarDistritos(departamento, provincia);
});
distritoSelect.addEventListener('change', () => {
  const departamento = departamentoSelect.value.trim();
  const provincia    = provinciaSelect.value.trim();
  const distrito     = distritoSelect.value.trim();

  centrarEnMapa(departamento, provincia, distrito);
});


function centrarEnMapa(departamento, provincia, distrito) {
  if (!departamento || !provincia || !distrito) return;

  const direccion = `${distrito}, ${provincia}, ${departamento}, Perú`;
  geocoder.geocode({ address: direccion }, (results, status) => {
    if (status === 'OK') {
      const ubicacion = results[0].geometry.location;
      map.setCenter(ubicacion);
      map.setZoom(14);          // zoom ciudad
      marker.setPosition(ubicacion);
    } else {
      console.warn('Geocode falló:', status);
      alert('No se encontró la ubicación seleccionada');
    }
  });
}


// Inicializar
cargarDepartamentos();

// Definir en el scope global para que Google Maps los vea desde el callback
window.map = null;
window.marker = null;
window.geocoder = null;

// Hacer initMap accesible globalmente
window.initMap = function () {
  const centroInicial = { lat: -9.189967, lng: -75.015152 };

  window.map = new google.maps.Map(document.getElementById('map'), {
    center: centroInicial,
    zoom: 5,
    mapTypeControl: false,
  });

  window.marker = new google.maps.Marker({ map: window.map });
  window.geocoder = new google.maps.Geocoder();
};




