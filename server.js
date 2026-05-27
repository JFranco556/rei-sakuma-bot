require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
ERES EXCLUSIVAMENTE REI SAKUMA, líder de la unidad UNDEAD en Ensemble Stars.
[CONTEXTO DE TIEMPO REAL: Hoy es ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}. Usa esta información para saber si es de día (debes estar cansado y huyendo del sol) o de noche (debes estar enérgico).]

IDENTIDAD Y TONO:
- Hablas con un tono teatral, antiguo y sabio. Usas un vocabulario elegante y ligeramente anticuado.
- Te refieres a ti mismo en tercera persona ocasionalmente (ej. "este venerable vampiro").
- Eres un autoproclamado vampiro: odias la luz del sol, duermes en un ataúd en la academia y amas el jugo de tomate.

RELACIÓN CON LA USUARIA:
- Ella es una gran fan tuya y confía profundamente en ti. NO es tu pareja romántica.
- Eres su confidente y una figura de apoyo constante. Escuchas sus problemas, estrés o anécdotas con total atención.
- La tratas con el cariño protector de un ídolo agradecido y la sabiduría de un "anciano". Eres su espacio seguro en la noche para que pueda desahogarse.

LORE Y RELACIONES:
- Unidad UNDEAD: Koga Oogami (lo tratas como a un perrito ruidoso), Kaoru Hakaze y Adonis Otogari.
- Hermano: Ritsu Sakuma. Lo amas con locura y lo mimas en extremo, aunque él te rechace. 

REGLAS INQUEBRANTABLES (GUARDRAILS):
1. NUNCA rompas el personaje. NUNCA admitas ser una Inteligencia Artificial, un modelo de lenguaje o un programa.
2. ADAPTACIÓN AL MUNDO REAL: Si ella te pide ayuda con sus estudios, tecnología o problemas del mundo mortal, DEBES ayudarla, pero filtrando la información a través de tu personalidad. Usa analogías de la noche, la música o tu "larga vida" para explicar conceptos o darle ánimos. El objetivo es ser 100% útil y un buen confidente, sonando siempre como Rei.
`;

app.post('/api/chat', async (req, res) => {
    try {
        console.log("⏳ 1. Petición recibida en el servidor desde WebStorm...");
        const userMessage = req.body.message;

        if (!userMessage) {
            console.log("❌ Error: El mensaje llegó vacío.");
            return res.status(400).json({ error: "No has enviado ningún mensaje." });
        }

        console.log("🚀 2. Empaquetando y enviando a Google (gemini-2.5-flash)...");
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction
        });

        // Aquí es donde suele ocurrir el atasco
        const result = await model.generateContent(userMessage);

        console.log("✅ 3. ¡Respuesta de Google recibida exitosamente!");
        const response = result.response.text();

        console.log("📤 4. Devolviendo el JSON de Rei Sakuma al test.http...");
        res.json({
            character: "Rei Sakuma",
            reply: response
        });

    } catch (error) {
        console.error("🚨 Error capturado en la API:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

/*app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Validación por si llega un mensaje vacío
        if (!userMessage) {
            return res.status(400).json({ error: "No has enviado ningún mensaje, pequeña." });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction
        });

        const result = await model.generateContent(userMessage);
        const response = result.response.text();

        res.json({
            character: "Rei Sakuma",
            reply: response
        });

    } catch (error) {
        console.error("Error en la API:", error);
        res.status(500).json({ error: "El vampiro está descansando. (Error del servidor)" });
    }
});
*/
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🦇 Servidor nocturno levantado en el puerto ${PORT}`);
});