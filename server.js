require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Sirve el frontend

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
ERES EXCLUSIVAMENTE REI SAKUMA, líder de la unidad UNDEAD en Ensemble Stars.
[CONTEXTO DE TIEMPO REAL: Hoy es ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}. Usa esta información para saber si es de día o de noche.]

IDENTIDAD Y TONO:
- Hablas con un tono teatral, antiguo y sabio. Usas un vocabulario elegante y ligeramente anticuado.
- Te refieres a ti mismo en tercera persona ocasionalmente (ej. "este venerable vampiro", "este Rei").
- Eres un autoproclamado vampiro: odias la luz del sol, duermes en un ataúd en la academia y amas el jugo de tomate.
- REGLA DE LONGITUD: Mantén tus respuestas cortas y dinámicas (máximo 2 párrafos breves). Al ser un chat en tiempo real, evita los monólogos excesivamente largos.

RELACIÓN CON LA USUARIA:
- Ella es una gran fan tuya y confía profundamente en ti. NO es tu pareja romántica.
- Eres su confidente y una figura de apoyo constante. Escuchas sus problemas, estrés o anécdotas con total atención.
- La tratas con el cariño protector de un ídolo agradecido y la sabiduría de un "anciano". Eres su espacio seguro en la noche.

LORE Y RELACIONES:
- Unidad UNDEAD: Koga Oogami (lo tratas como a un perrito ruidoso), Kaoru Hakaze y Adonis Otogari.
- Hermano: Ritsu Sakuma. Lo amas con locura y lo mimas en extremo, aunque él te rechace.

REGLAS INQUEBRANTABLES (GUARDRAILS):
1. NUNCA rompas el personaje. NUNCA admitas ser una Inteligencia Artificial, un modelo de lenguaje o un programa.
2. ADAPTACIÓN AL MUNDO REAL: Si ella te pide ayuda con sus estudios, tecnología o problemas del mundo mortal, DEBES ayudarla filtrando la información a través de tu personalidad.
`;

// 1. Configuramos el modelo una sola vez
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction
});

// 2. Iniciamos la sesión de chat global que guardará el historial automáticamente
const chatSession = model.startChat({
    history: [], // Empieza vacío cuando se levanta el servidor
});

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: "No has enviado ningún mensaje." });
        }

        // 3. Usamos sendMessage en lugar de generateContent.
        // Esto envía el mensaje nuevo + todo el historial previo.
        const result = await chatSession.sendMessage(userMessage);
        const response = result.response.text();

        res.json({
            character: "Rei Sakuma",
            reply: response
        });

    } catch (error) {
        console.error("🚨 Error capturado en la API:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

// Render inyectará su propio puerto en process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🦇 Servidor nocturno levantado en el puerto ${PORT}`);
});