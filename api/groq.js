// api/groq.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt é obrigatório.' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'API Key não configurada.' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: 'Você é o iStudy, uma IA de estudos útil, didática e motivacional.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data });
        }

        const texto = data.choices?.[0]?.message?.content;
        if (!texto) {
            return res.status(500).json({ error: 'Resposta vazia da IA.' });
        }

        res.status(200).json({ response: texto });
    } catch (error) {
        console.error('Erro no backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};