# 🦇 Documentación Técnica: Rei Sakuma Bot

Este documento contiene los comandos operativos y la estructura base para la ejecución del servidor local y el entorno de desarrollo.

## 🚀 Ejecución del Servidor

Para inicializar el servidor en modo de desarrollo con recarga automática (hot-reloading) mediante `nodemon`, abre la terminal en la raíz del proyecto y ejecuta:

\`\`\`bash
npm run dev
\`\`\`

> **Nota:** Este comando invoca el script configurado en el `package.json` que ejecuta `nodemon server.js`. El servidor quedará en escucha en `http://localhost:3000`.

## 🛑 Detención del Servidor

Para interrumpir la ejecución del servidor y liberar el puerto de la terminal:

1. Haz foco en la pestaña de la terminal activa.
2. Presiona la combinación de teclas \`Ctrl + C\`.
3. Si la consola solicita confirmación ("¿Terminar el trabajo por lotes (S/N)?"), ingresa \`S\` y presiona Enter.

## 📦 Gestión de Control de Versiones (Git)

Secuencia de comandos estándar para registrar y subir nuevos cambios al repositorio remoto:

\`\`\`bash
# 1. Empaquetar todos los archivos modificados
git add .

# 2. Crear el registro del cambio (reemplazar el mensaje)
git commit -m "Actualización del frontend y conexión de la API"

# 3. Subir los cambios a la rama principal
git push origin main
\`\`\`

## 🔧 Resolución de Problemas Frecuentes

*   **Error "Port 3000 is already in use":** Ocurre si el servidor no se detuvo correctamente. Cierra la terminal actual de WebStorm, abre una nueva y vuelve a ejecutar \`npm run dev\`.
*   **Falta de dependencias:** Si el proyecto se clona en un nuevo entorno, se debe ejecutar \`npm install\` antes de iniciar el servidor para reconstruir la carpeta \`node_modules\`.