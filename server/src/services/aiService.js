const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_VISION_MODEL = 'gemini-2.5-flash';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_IMAGE_ENDPOINT = 'https://router.huggingface.co/fal-ai/fal-ai/flux/schnell';
const POLLINATIONS_ENDPOINT = 'https://image.pollinations.ai/prompt';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, { maxRetries = 3, baseDelay = 3000, label = 'API call' } = {}) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = status === 429 || status === 503 || status === 500;
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`[RETRY] ${label} failed (${status}), retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(delay);
    }
  }
};

const analyzeTransaction = async ({ orderId, amount, customerId, txHash, metadata = {} }) => {
  try {
    const { data } = await axios.post(
      `${AI_ENGINE_URL}/api/ai/analyze-transaction`,
      {
        order_id: orderId,
        amount,
        customer_id: customerId,
        tx_hash: txHash || null,
        metadata,
      },
      { timeout: 5000 }
    );
    return {
      riskScore: data.risk_score,
      flagged: data.flagged,
      blocked: data.blocked,
      reasons: data.reasons,
      recommendations: data.recommendations,
    };
  } catch (err) {
    logger.error('AI service unavailable for transaction analysis', { message: err.message });
    return { riskScore: 0, flagged: false, blocked: false, reasons: [], recommendations: [] };
  }
};

const analyzeInventory = async ({ storeId, variantId, currentStock, lowStockThreshold, salesData = {} }) => {
  try {
    const { data } = await axios.post(
      `${AI_ENGINE_URL}/api/ai/inventory-alert`,
      {
        store_id: storeId,
        variant_id: variantId,
        current_stock: currentStock,
        low_stock_threshold: lowStockThreshold,
        sales_last_7_days: salesData.salesLast7Days || 0,
        sales_last_30_days: salesData.salesLast30Days || 0,
      },
      { timeout: 5000 }
    );
    return {
      alertLevel: data.alert_level,
      predictedDaysUntilStockout: data.predicted_days_until_stockout,
      recommendedReorderQuantity: data.recommended_reorder_quantity,
      message: data.message,
    };
  } catch (err) {
    logger.error('AI service unavailable for inventory analysis', { message: err.message });
    return null;
  }
};

const detectMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') { return 'image/png'; }
  if (ext === '.webp') { return 'image/webp'; }
  if (ext === '.gif') { return 'image/gif'; }
  return 'image/jpeg';
};

const buildTryOnPrompt = async ({ userPhotoBase64, capImageBase64, userPhotoMime, capImageMime, capName }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: userPhotoMime, data: userPhotoBase64 } },
          { inline_data: { mime_type: capImageMime, data: capImageBase64 } },
          {
            text: `You are writing a prompt for an AI image generator (FLUX).
First image: a person. Second image: a baseball cap named "${capName}".

Write a single detailed English prompt (max 90 words) for a photorealistic photo of the SAME person from the first image now wearing the cap from the second image. Include specifically:
- Person: gender, approximate age, hair color/length, facial features, expression, clothing visible
- Cap: exact color, type (snapback, dad cap, trucker, etc.), logo/design/text, materials
- Setting/background from the first image
- Style: photorealistic, natural lighting, sharp focus, high quality, DSLR photo

Respond ONLY with the prompt text. No quotes, no markdown, no labels, no explanation.`,
          },
        ],
      },
    ],
  };

  const { data } = await retryWithBackoff(
    () => axios.post(url, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    }),
    { label: 'Gemini Vision prompt' }
  );

  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
};

const generateImageWithFlux = async (prompt) => {
  // Try HuggingFace router first (paid - fal.ai)
  try {
    const { data } = await axios.post(
      HF_IMAGE_ENDPOINT,
      { prompt, image_size: 'landscape_4_3', num_inference_steps: 4 },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      }
    );
    const url = data?.images?.[0]?.url;
    if (url) { return url; }
  } catch (err) {
    logger.warn('HF FLUX failed, falling back to Pollinations', { status: err.response?.status });
  }

  // Fallback: Pollinations.ai (free, no auth, FLUX-based)
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  return `${POLLINATIONS_ENDPOINT}/${encoded}?width=1024&height=768&model=flux&nologo=true&seed=${seed}`;
};

const downloadImageToBuffer = async (imageUrl) => {
  const { data } = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 90000,
  });
  return Buffer.from(data);
};

const generateTryOnWithGeminiImage = async ({
  userPhotoBase64,
  capImageBase64,
  userPhotoMime,
  capImageMime,
  capName,
}) => {
  // Try multiple models in order of rate-limit generosity
  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash-preview-04-17',
    'gemini-2.5-flash-image',
  ];

  const payload = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: userPhotoMime, data: userPhotoBase64 } },
          { inline_data: { mime_type: capImageMime, data: capImageBase64 } },
          {
            text: `Edit the FIRST image: place the baseball cap shown in the SECOND image onto the person's head.

CRITICAL REQUIREMENTS:
- Keep the person's face, skin tone, facial features, hair, beard, expression, body, clothing, and background IDENTICAL to the first image. Do not change them in any way.
- The result must look like the same person, photographed in the same place, just now wearing the cap.
- Use the EXACT cap from the second image: preserve its color palette, pattern, fabric, logo/badge, brim shape, and overall style.
- Position the cap naturally on top of the head, with realistic lighting, shadows and perspective matching the first photo.
- Output a single photorealistic image. Do not add text, watermarks, frames or extra elements.

Cap name (for context only): "${capName}".`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    logger.info(`[TRY-ON] Trying Gemini model: ${model}`);
    try {
      const { data } = await retryWithBackoff(
        () => axios.post(url, payload, {
          timeout: 120000,
          headers: { 'Content-Type': 'application/json' },
        }),
        { maxRetries: 2, baseDelay: 5000, label: `Gemini Image (${model})` }
      );

      const parts = data?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        const inline = part.inline_data || part.inlineData;
        if (inline?.data && (inline.mime_type || inline.mimeType || '').startsWith('image/')) {
          logger.info(`[TRY-ON] Image generated successfully with model: ${model}`);
          return {
            imageBase64: inline.data,
            mimeType: inline.mime_type || inline.mimeType,
          };
        }
      }
      logger.warn(`[TRY-ON] Model ${model} returned no image in response`);
    } catch (err) {
      logger.warn(`[TRY-ON] Model ${model} failed`, {
        message: err.message,
        status: err.response?.status,
      });
    }
  }
  return null;
};

const analyzeVirtualTryOn = async ({ userPhotoPath, capImagePath, capName }) => {
  try {
    if (!GEMINI_API_KEY) {
      return {
        success: false,
        message: 'Falta configurar GOOGLE_GEMINI_API_KEY en el servidor.',
      };
    }

    const userPhotoBuffer = fs.readFileSync(userPhotoPath);
    const capImageBuffer = fs.readFileSync(capImagePath);
    const userPhotoBase64 = userPhotoBuffer.toString('base64');
    const capImageBase64 = capImageBuffer.toString('base64');
    const userPhotoMime = detectMimeType(userPhotoPath);
    const capImageMime = detectMimeType(capImagePath);

    const uploadsBase = process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'uploads');
    const tryOnDir = path.join(uploadsBase, 'products', 'try-on');
    fs.mkdirSync(tryOnDir, { recursive: true });

    // Strategy 1: Gemini native image generation (free, no external service needed)
    logger.info('[TRY-ON] Step 1 – Trying Gemini native image generation', { capName });
    try {
      const geminiResult = await generateTryOnWithGeminiImage({
        userPhotoBase64,
        capImageBase64,
        userPhotoMime,
        capImageMime,
        capName,
      });

      if (geminiResult && geminiResult.imageBase64) {
        const ext = (geminiResult.mimeType || 'image/png').includes('png') ? 'png' : 'jpg';
        const filename = `try-on-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.${ext}`;
        const imageBuffer = Buffer.from(geminiResult.imageBase64, 'base64');
        fs.writeFileSync(path.join(tryOnDir, filename), imageBuffer);

        logger.info('[TRY-ON] Gemini image saved', { filename, bytes: imageBuffer.length });

        return {
          success: true,
          generatedImageUrl: `/uploads/products/try-on/${filename}`,
          description: `Visualización de cómo luciría la ${capName}. Generado con IA gratuita.`,
          message: '¡Imagen generada!',
        };
      }
      logger.warn('[TRY-ON] Gemini image generation returned no image, falling back to Pollinations');
    } catch (geminiErr) {
      logger.warn('[TRY-ON] Gemini image generation failed, falling back to Pollinations', {
        message: geminiErr.message,
        status: geminiErr.response?.status,
      });
    }

    // Strategy 2 (fallback): Gemini text prompt + Pollinations/FLUX image generation
    logger.info('[TRY-ON] Step 2 – Building prompt with Gemini Vision (fallback)', { capName });
    const prompt = await buildTryOnPrompt({
      userPhotoBase64,
      capImageBase64,
      userPhotoMime,
      capImageMime,
      capName,
    });
    logger.info('[TRY-ON] Prompt generated', { prompt: prompt.substring(0, 150) });

    logger.info('[TRY-ON] Step 3 – Generating image with Pollinations (fallback)');
    const imageUrl = await generateImageWithFlux(prompt);
    logger.info('[TRY-ON] Image URL from Pollinations', { imageUrl: imageUrl.substring(0, 120) });

    // Try to download server-side first; if blocked by IP rate limit, return URL directly to client
    try {
      const imageBuffer = await downloadImageToBuffer(imageUrl);
      const filename = `try-on-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.jpg`;
      fs.writeFileSync(path.join(tryOnDir, filename), imageBuffer);
      logger.info('[TRY-ON] Image saved locally', { filename, bytes: imageBuffer.length });

      return {
        success: true,
        generatedImageUrl: `/uploads/products/try-on/${filename}`,
        description: `Visualización de cómo luciría la ${capName}. Generado con IA gratuita.`,
        message: '¡Imagen generada!',
      };
    } catch (downloadErr) {
      logger.warn('[TRY-ON] Server-side download failed, returning external URL to client', {
        message: downloadErr.message,
        status: downloadErr.response?.status,
      });

      // Return the Pollinations URL directly — the user's browser will fetch it
      return {
        success: true,
        generatedImageUrl: imageUrl,
        description: `Visualización de cómo luciría la ${capName}. Generado con IA gratuita.`,
        message: '¡Imagen generada!',
      };
    }
  } catch (err) {
    logger.error('Virtual try-on analysis failed', {
      message: err.message,
      status: err.response?.status,
      apiError: err.response?.data ? JSON.stringify(err.response.data).substring(0, 800) : undefined,
    });
    return {
      success: false,
      message: 'No pudimos generar la imagen. Intenta de nuevo.',
      error: err.message,
    };
  }
};

const suggestPrice = async (productData, comparableProducts) => {
  try {
    const { data } = await axios.post(
      `${AI_ENGINE_URL}/api/ai/suggest-price`,
      {
        product_data: {
          name: productData.name || '',
          category: productData.category,
          tags: productData.tags || [],
          featured: productData.featured || false,
        },
        comparable_products: comparableProducts,
      },
      { timeout: 5000 }
    );
    return {
      suggestedPrice: data.suggested_price,
      confidence: data.confidence,
      reasoning: data.reasoning,
      similarProducts: data.similar_products,
    };
  } catch (err) {
    logger.error('AI service unavailable for price suggestion', { message: err.message });
    return {
      suggestedPrice: 0,
      confidence: 0,
      reasoning: 'Error al consultar la IA.',
      similarProducts: [],
    };
  }
};

const predictDemand = async (storeId, productsData) => {
  try {
    const { data } = await axios.post(
      `${AI_ENGINE_URL}/api/ai/predict-demand`,
      {
        store_id: storeId,
        products: productsData,
        forecast_days: 7,
      },
      { timeout: 8000 }
    );
    return {
      storeId: data.store_id,
      forecastDays: data.forecast_days,
      generatedAt: data.generated_at,
      predictions: data.predictions.map((p) => ({
        productId: p.product_id,
        productName: p.product_name,
        category: p.category,
        predictedUnits: p.predicted_units,
        trend: p.trend,
        confidence: p.confidence,
        avgDailySales: p.avg_daily_sales,
      })),
    };
  } catch (err) {
    logger.error('AI service unavailable for demand prediction', { message: err.message });
    return { storeId, forecastDays: 7, predictions: [], generatedAt: new Date().toISOString() };
  }
};

module.exports = { analyzeTransaction, analyzeInventory, analyzeVirtualTryOn, suggestPrice, predictDemand };
