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
    if (!selectNombre) return; // Guard clause in case element isn't found
    
    // Clear existing options
    selectNombre.innerHTML = '<option value="">Seleccione un participante</option>';
    
    // Add predefined participants from CONFIG
    if (CONFIG.participantesPreDefinidos && CONFIG.participantesPreDefinidos.length) {
        CONFIG.participantesPreDefinidos.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            selectNombre.appendChild(option);
        });
    }
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
    const data = [['Nombre', 'Fecha Registro', ...fechas.map(fecha => 
        fecha.toLocaleDateString('es-ES', CONFIG.formatoFecha))]];
    
    // Agregar datos de cada participante
    participantes.forEach(participante => {
        const row = [
            participante.nombre,
            new Date(participante.fechaRegistro).toLocaleDateString('es-ES', CONFIG.formatoFecha)
        ];
        
        fechas.forEach(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            const asistencia = participante.asistencia[fechaStr] ? 'Sí' : 'No';
            row.push(asistencia);
        });
        
        data.push(row);
    });
    
    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Ajustar el ancho de las columnas
    const wscols = [
        {wch: 20}, // Nombre
        {wch: 15}, // Fecha Registro
        ...fechas.map(() => ({wch: 12})) // Fechas de asistencia
    ];
    ws['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
    
    // Guardar el archivo
    XLSX.writeFile(wb, "lista_asistencia.xlsx");
}

document.addEventListener('DOMContentLoaded', async () => {
    // Wait a small amount of time to ensure CONFIG is loaded
    setTimeout(() => {
        inicializarSelectParticipantes();
        actualizarTabla();
    }, 100);
});