require('dotenv').config();

async function checkModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        const data = await response.json();

        if (data.error) {
            console.error("Error con la llave:", data.error.message);
            return;
        }

        console.log("🦇 Modelos disponibles para tu llave:");
        // Filtramos solo los que sirven para generar contenido (texto)
        const textModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        textModels.forEach(model => {
            console.log(`- ${model.name.replace('models/', '')}`);
        });

    } catch (error) {
        console.error("Error de conexión:", error);
    }
}

checkModels();