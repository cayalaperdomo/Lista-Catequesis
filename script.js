import { CONFIG } from './config.js';

let participantes = JSON.parse(localStorage.getItem('participantes')) || [];

function generarFechas() {
    const fechas = [];
    let currentDate = new Date(CONFIG.fechaInicio);
    
    while (currentDate <= CONFIG.fechaFin) {
        fechas.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return fechas;
}

function actualizarTabla() {
    const fechas = generarFechas();
    const tabla = document.getElementById('tablaAsistencia');
    const thead = tabla.querySelector('thead tr');
    const tbody = document.getElementById('tablaBody');
    
    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }
    
    fechas.forEach(fecha => {
        const th = document.createElement('th');
        th.className = 'fecha-header';
        th.textContent = fecha.toLocaleDateString('es-ES', CONFIG.formatoFecha);
        thead.appendChild(th);
    });
    
    tbody.innerHTML = '';
    
    participantes.forEach((participante, index) => {
        const tr = document.createElement('tr');
        
        const tdNombre = document.createElement('td');
        tdNombre.innerHTML = `
            <div class="participante-info">
                <span class="nombre-participante">${participante.nombre}</span>
                <small>Registrado: ${new Date(participante.fechaRegistro).toLocaleDateString('es-ES', CONFIG.formatoFecha)}</small>
                <div class="acciones">
                    <button onclick="editarParticipante(${index})" class="btn-accion">✏️</button>
                    <button onclick="eliminarParticipante(${index})" class="btn-accion">🗑️</button>
                </div>
            </div>
        `;
        tr.appendChild(tdNombre);
        
        fechas.forEach(fecha => {
            const td = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'asistencia-checkbox';
            
            const fechaStr = fecha.toISOString().split('T')[0];
            checkbox.checked = participante.asistencia[fechaStr] || false;
            
            checkbox.addEventListener('change', () => {
                participante.asistencia[fechaStr] = checkbox.checked;
                guardarDatos();
            });
            
            td.appendChild(checkbox);
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

function inicializarSelectParticipantes() {
    const selectNombre = document.getElementById('nombre');
    selectNombre.innerHTML = '<option value="">Seleccione un participante</option>';
    
    CONFIG.participantesPreDefinidos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        selectNombre.appendChild(option);
    });
}

window.registrarParticipante = function() {
    const nombreSelect = document.getElementById('nombre');
    const fechaInput = document.getElementById('fechaRegistro');
    const nombre = nombreSelect.value.trim();
    const fecha = fechaInput.value;
    
    if (nombre) {
        participantes.push({
            nombre: nombre,
            fechaRegistro: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
            asistencia: {}
        });
        
        nombreSelect.value = '';
        fechaInput.value = '';
        guardarDatos();
        actualizarTabla();
    }
}

window.editarParticipante = function(index) {
    const participante = participantes[index];
    const nombreSelect = document.getElementById('nombre');
    const fechaInput = document.getElementById('fechaRegistro');
    const btnRegistrar = document.getElementById('btnRegistrar');
    
    nombreSelect.value = participante.nombre;
    fechaInput.value = new Date(participante.fechaRegistro).toISOString().split('T')[0];
    btnRegistrar.textContent = 'Actualizar';
    btnRegistrar.onclick = () => {
        participante.nombre = nombreSelect.value;
        participante.fechaRegistro = new Date(fechaInput.value).toISOString();
        
        nombreSelect.value = '';
        fechaInput.value = '';
        btnRegistrar.textContent = 'Registro de Asistencia';
        btnRegistrar.onclick = registrarParticipante;
        
        guardarDatos();
        actualizarTabla();
    };
}

window.eliminarParticipante = function(index) {
    if (confirm('¿Está seguro de eliminar este participante?')) {
        participantes.splice(index, 1);
        guardarDatos();
        actualizarTabla();
    }
}

function guardarDatos() {
    localStorage.setItem('participantes', JSON.stringify(participantes));
}

window.descargarAsistencia = function() {
    const fechas = generarFechas();
    let csvContent = 'Nombre,Fecha Registro';
    
    // Agregar fechas al encabezado
    fechas.forEach(fecha => {
        csvContent += ',' + fecha.toLocaleDateString('es-ES', CONFIG.formatoFecha);
    });
    csvContent += '\n';
    
    // Agregar datos de cada participante
    participantes.forEach(participante => {
        csvContent += `"${participante.nombre}",${new Date(participante.fechaRegistro).toLocaleDateString('es-ES', CONFIG.formatoFecha)}`;
        
        fechas.forEach(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            const asistencia = participante.asistencia[fechaStr] ? 'Sí' : 'No';
            csvContent += ',' + asistencia;
        });
        csvContent += '\n';
    });
    
    // Crear y descargar el archivo CSV
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'lista_asistencia.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarSelectParticipantes();
    actualizarTabla();
});