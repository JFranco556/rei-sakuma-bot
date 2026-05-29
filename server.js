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


// 3. Definición del Esquema (Validación de los documentos)
const messageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'model'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

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

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "No has enviado ningún mensaje." });
        }

        // A. Recuperar el historial previo
        const historyDocs = await Message.find().sort({ timestamp: 1 });
        const formattedHistory = historyDocs.map(doc => ({
            role: doc.role,
            parts: [{ text: doc.content }]
        }));

        // B. NUEVO: Buscar la personalidad en la base de datos
        const personaDoc = await Persona.findOne({ personaje: 'Rei Sakuma' });

        // Creamos un "seguro" por si aún no has escrito la personalidad en Compass
        const instruccionesDinamicas = personaDoc
            ? personaDoc.instrucciones
            : "Eres Rei Sakuma. Responde brevemente.";

        // C. NUEVO: Inicializar a Gemini inyectándole las instrucciones frescas
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: instruccionesDinamicas
        });

        // D. Iniciar chat y enviar el mensaje
        const chatSession = model.startChat({ history: formattedHistory });
        const result = await chatSession.sendMessage(userMessage);
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