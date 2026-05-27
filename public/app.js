// 1. Capturar elementos del DOM
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// 2. Funciones de interfaz
function obtenerHoraActual() {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function autoScroll() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function mostrarTyping(mostrar) {
    if (mostrar) {
        typingIndicator.style.display = 'flex';
        autoScroll();
    } else {
        typingIndicator.style.display = 'none';
    }
}

function agregarBurbuja(texto, tipo) {
    const fila = document.createElement('div');
    fila.classList.add('msg-row', tipo);

    const burbuja = document.createElement('div');
    burbuja.classList.add('bubble');
    burbuja.textContent = texto;

    const hora = document.createElement('span');
    hora.classList.add('msg-time');
    hora.textContent = obtenerHoraActual();

    fila.appendChild(burbuja);
    fila.appendChild(hora);

    // Insertar la burbuja justo antes del indicador de "escribiendo..."
    chatMessages.insertBefore(fila, typingIndicator);
    autoScroll();
}

// 3. Comportamiento del input
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

chatInput.addEventListener('keydown', function (e) {
    // Enviar con Enter (Shift+Enter hace un salto de línea normal)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
    }
});

sendBtn.addEventListener('click', function () {
    enviarMensaje();
});

// 4. Conexión principal con Node.js
async function enviarMensaje() {
    const texto = chatInput.value.trim();
    if (!texto) return; // No enviar mensajes vacíos

    // Mostrar el mensaje del usuario
    agregarBurbuja(texto, 'user');

    // Limpiar el input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.focus();

    // Mostrar indicador de carga
    mostrarTyping(true);

    try {
        // Enviar la petición al servidor local
        const respuesta = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: texto })
        });

        const datos = await respuesta.json();

        // Ocultar indicador de carga
        mostrarTyping(false);

        // Procesar la respuesta
        if (datos.error) {
            agregarBurbuja("Error de conexión.", 'bot');
        } else {
            agregarBurbuja(datos.reply, 'bot');
        }

    } catch (error) {
        console.error("Error en Fetch:", error);
        mostrarTyping(false);
        agregarBurbuja("Fallo de comunicación con el ataúd.", 'bot');
    }
}