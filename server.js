require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose'); // 1. Importamos Mongoose

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 2. Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📁 Base de datos conectada: undead_chat'))
    .catch(err => console.error('🚨 Error conectando a MongoDB:', err));


// 3. Definición de los Esquemas (Validación de los documentos)
const messageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'model'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// NUEVO: Esquema para la personalidad
const personaSchema = new mongoose.Schema({
    personaje: { type: String, required: true },
    instrucciones: { type: String, required: true }
});
const Persona = mongoose.model('Persona', personaSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ruta para obtener todo el historial guardado en la base de datos
app.get('/api/chat/history', async (req, res) => {
    try {
        // Buscamos todos los mensajes ordenados del más antiguo al más reciente
        const historyDocs = await Message.find().sort({ timestamp: 1 });
        res.json(historyDocs);
    } catch (error) {
        console.error("🚨 Error al recuperar el historial visual:", error);
        res.status(500).json({ error: "No se pudo cargar el historial." });
    }
});

// Herramienta para actualizar la personalidad dinámicamente
const tools = [{
    functionDeclarations: [{
        name: "agregar_regla_comportamiento",
        description: "Usa esta herramienta SOLO cuando el usuario te pida explícitamente que cambies tu comportamiento, que aprendas una nueva regla, o que dejes de hacer algo. NO la uses para conversar normalmente.",
        parameters: {
            type: "OBJECT",
            properties: {
                nueva_regla: {
                    type: "STRING",
                    description: "La nueva regla de comportamiento a agregar."
                }
            },
            required: ["nueva_regla"]
        }
    }]
}];

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const mode = req.body.mode || 'rei';
        
        if (!userMessage) {
            return res.status(400).json({ error: "No has enviado ningún mensaje." });
        }

        // A. Recuperar el historial previo
        const historyDocs = await Message.find().sort({ timestamp: 1 });
        let formattedHistory = historyDocs.map(doc => ({
            role: doc.role,
            parts: [{ text: doc.content }]
        }));

        // --- BLINDAJE ANTI-ERRORES ---
        // Buscar dónde está el primer mensaje de usuario
        const primerUsuarioIndex = formattedHistory.findIndex(msg => msg.role === 'user');
        
        if (primerUsuarioIndex === -1) {
            // Si no hay mensajes de usuario en la BD, mandamos el historial vacío
            formattedHistory = []; 
        } else if (primerUsuarioIndex > 0) {
            // Si el historial empieza con un bot, cortamos esa parte y empezamos desde el usuario
            formattedHistory = formattedHistory.slice(primerUsuarioIndex);
        }
        // -----------------------------

        // B. NUEVO: Buscar la personalidad en la base de datos dependiendo del modo
        const nombrePersonaje = mode === 'narrador' ? 'Narrador' : 'Rei Sakuma';
        const personaDoc = await Persona.findOne({ personaje: nombrePersonaje });

        // Creamos un "seguro" por si aún no has escrito la personalidad en Compass
        let instruccionesDinamicas = personaDoc
            ? personaDoc.instrucciones
            : `Eres ${nombrePersonaje}.`;
            
        let activeTools = tools;

        // Si el usuario activó el modo narrador, apagamos las herramientas de Rei
        if (mode === 'narrador') {
            activeTools = undefined; 
        }

        // C. NUEVO: Inicializar a Gemini inyectándole las instrucciones frescas y las herramientas
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: instruccionesDinamicas,
            tools: activeTools
        });

        // D. Iniciar chat y enviar el mensaje
        const chatSession = model.startChat({ history: formattedHistory });
        let result = await chatSession.sendMessage(userMessage);

        // --- MANEJO DE FUNCTION CALLING ---
        const functionCalls = result.response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === "agregar_regla_comportamiento") {
                const nuevaRegla = call.args.nueva_regla;
                
                // Actualizar en la base de datos concatenando la nueva regla
                const instruccionesActualizadas = instruccionesDinamicas + "\n- Nueva regla dinámica: " + nuevaRegla;
                await Persona.updateOne(
                    { personaje: 'Rei Sakuma' }, 
                    { instrucciones: instruccionesActualizadas },
                    { upsert: true } // Por si no existe, lo crea
                );

                console.log(`✨ Rei aprendió una nueva regla: ${nuevaRegla}`);

                // Enviar confirmación al modelo para que genere su respuesta final
                result = await chatSession.sendMessage([{
                    functionResponse: {
                        name: "agregar_regla_comportamiento",
                        response: { success: true, guardado: true }
                    }
                }]);
            }
        }
        // -----------------------------------

        const responseText = result.response.text();

        // E. Guardar en la base de datos
        await Message.create([
            { role: 'user', content: userMessage },
            { role: 'model', content: responseText }
        ]);

        res.json({
            character: "Rei Sakuma",
            reply: responseText
        });

    } catch (error) {
        console.error("🚨 Error capturado en la API:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🦇 Servidor nocturno levantado en el puerto ${PORT}`);
});