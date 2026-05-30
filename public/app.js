// 1. Capturar elementos del DOM
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const modeSwitch = document.getElementById('modeSwitch');
const modeLabel = document.getElementById('modeLabel');
const modeLabelAlt = document.getElementById('modeLabelAlt');

// Evento para cambiar visualmente las etiquetas del toggle
modeSwitch.addEventListener('change', function() {
    if (this.checked) {
        modeLabel.classList.add('alt');
        modeLabelAlt.classList.remove('alt');
    } else {
        modeLabel.classList.remove('alt');
        modeLabelAlt.classList.add('alt');
    }
});

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

    const currentMode = modeSwitch.checked ? 'narrador' : 'rei';

    try {
        // Enviar la petición al servidor local con el modo seleccionado
        const respuesta = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: texto, mode: currentMode })
        });

        const datos = await respuesta.json();

        // Ocultar indicador de carga
        mostrarTyping(false);

        // Procesar la respuesta
        if (datos.error) {
            agregarBurbuja("Error de conexión.", 'bot');
        } else {
            const tipoBurbuja = currentMode === 'narrador' ? 'narrador' : 'bot';
            agregarBurbuja(datos.reply, tipoBurbuja);
        }

    } catch (error) {
        console.error("Error en Fetch:", error);
        mostrarTyping(false);
        agregarBurbuja("Fallo de comunicación con el ataúd.", 'bot');
    }
}

// 5. Cargar historial al abrir la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await fetch('/api/chat/history');
        const historial = await respuesta.json();

        // Recorremos los mensajes guardados y los dibujamos
        historial.forEach(msg => {
            if (msg.role === 'user') {
                agregarBurbuja(msg.content, 'user');
            } else if (msg.role === 'model') {
                agregarBurbuja(msg.content, 'bot'); // Tu clase para Rei es 'bot', aunque en la BD sea 'model'
            }
        });

    } catch (error) {
        console.error("No se pudo despertar la memoria del ataúd:", error);
    }
});

// 6. Registro del Service Worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('PWA: Service Worker registrado exitosamente', registration.scope);
            })
            .catch(err => {
                console.log('PWA: Fallo al registrar el Service Worker', err);
            });
    });
}