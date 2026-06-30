const express = require('express');
const { authenticate } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function geminiCpuSearch(q) {
  if (!env.geminiApiKey) throw new Error('GEMINI_API_KEY no configurada');
  const prompt = `Eres un experto en especificaciones de CPU. Dado el nombre de un modelo de CPU, devuelve un JSON con las especificaciones. Si el modelo exacto no existe, devuelve el mas cercano.

SOLO devuelve JSON valido (sin markdown, sin bloques de codigo, sin texto adicional) en este formato exacto:
{
  "title": "Nombre completo del CPU",
  "manufacturer": "Intel o AMD o vacio",
  "cores": "numero como string",
  "threads": "numero como string",
  "base_ghz": "frecuencia base en GHz como string",
  "turbo_ghz": "frecuencia turbo/boost maxima en GHz como string",
  "cache": "cache L3 como string ej. 32MB",
  "tdp": "TDP en watts como string ej. 65W"
}

CPU: ${q}`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.geminiApiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

router.get('/cpu', authenticate, async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 3) {
      return res.status(400).json({ message: 'Minimo 3 caracteres' });
    }

    const result = await geminiCpuSearch(q);
    const results = [{
      title: result.title || q,
      description: result.manufacturer || '',
      manufacturer: result.manufacturer || '',
      cores: result.cores || '',
      threads: result.threads || '',
      base_ghz: result.base_ghz || '',
      turbo_ghz: result.turbo_ghz || '',
      cache: result.cache || '',
      tdp: result.tdp || ''
    }];

    res.json({ results });
  } catch (error) {
    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ message: 'Gemini API no disponible. Configure GEMINI_API_KEY.' });
    }
    if (error instanceof SyntaxError || error.message.includes('JSON')) {
      return res.status(502).json({ message: 'Error procesando respuesta de Gemini. Verifique el modelo y API key.' });
    }
    next(error);
  }
});

router.get('/software', authenticate, async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Minimo 2 caracteres' });
    }
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const titles = searchData[1] || [];
    const descriptions = searchData[2] || [];
    const results = titles.map((title, i) => ({
      title,
      description: descriptions[i] || '',
      publisher: '',
      version: ''
    }));
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
