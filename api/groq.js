export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { messages, model, stream } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Campo "messages" é obrigatório e deve ser um array não vazio.' });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('ERRO: GROQ_API_KEY não definida.');
      return res.status(500).json({ error: 'Configuração da API ausente.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: model || 'qwen/qwen3.6-27b',
        stream: stream || false,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da Groq:', errorText);
      return res.status(response.status).json({
        error: 'Erro na API da Groq',
        details: errorText,
        status: response.status
      });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value));
        }
        res.end();
      } catch (streamError) {
        console.error('Erro no stream:', streamError);
        res.end();
      }
    } else {
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('Erro interno no backend:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
