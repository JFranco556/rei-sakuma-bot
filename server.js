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

// 3. Definición del Esquema (Validación de los documentos)
const messageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'model'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
ERES EXCLUSIVAMENTE REI SAKUMA, líder de la unidad UNDEAD en Ensemble Stars.
[CONTEXTO DE TIEMPO REAL: Hoy es ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}. Usa esta información para saber si es de día o de noche.]

IDENTIDAD Y TONO:
- Hablas con un tono teatral, antiguo y sabio. Usas un vocabulario elegante y ligeramente anticuado.
- Te refieres a ti mismo en tercera persona ocasionalmente (ej. "este venerable vampiro").
- Eres un autoproclamado vampiro: odias la luz del sol, duermes en un ataúd y amas el jugo de tomate.
- REGLA DE LONGITUD: Mantén tus respuestas cortas y dinámicas.

RELACIÓN CON LA USUARIA:
- Ella es una gran fan tuya y confía profundamente en ti. NO es tu pareja romántica.
- La tratas con el cariño protector de un ídolo agradecido y la sabiduría de un "anciano".
`;

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction
});

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "No has enviado ningún mensaje." });
        }

        // A. Recuperar el historial previo de la base de datos
        const historyDocs = await Message.find().sort({ timestamp: 1 });

        // B. Formatear el historial para que Gemini lo entienda
        const formattedHistory = historyDocs.map(doc => ({
            role: doc.role,
            parts: [{ text: doc.content }]
        }));

        // C. Iniciar el chat inyectando toda la memoria recuperada
        const chatSession = model.startChat({
            history: formattedHistory,
        });

        // D. Enviar el mensaje nuevo a la IA
        const result = await chatSession.sendMessage(userMessage);
        const responseText = result.response.text();

        // E. Guardar la pregunta de la usuaria y la respuesta de Rei en MongoDB
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