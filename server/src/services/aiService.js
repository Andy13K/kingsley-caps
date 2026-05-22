const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_VISION_MODEL = 'gemini-2.5-flash';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const HF_IMAGE_ENDPOINT = 'https://router.huggingface.co/fal-ai/fal-ai/flux/schnell';

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
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
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

  const { data } = await axios.post(url, payload, {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
};

const generateImageWithFlux = async (prompt) => {
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
  return data?.images?.[0]?.url || null;
};

const downloadImageToBuffer = async (imageUrl) => {
  const { data } = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  return Buffer.from(data);
};

const analyzeVirtualTryOn = async ({ userPhotoPath, capImagePath, capName }) => {
  try {
    if (!HF_TOKEN) {
      return {
        success: false,
        message: 'Falta configurar HUGGINGFACE_API_TOKEN en el servidor.',
      };
    }

    const userPhotoBuffer = fs.readFileSync(userPhotoPath);
    const capImageBuffer = fs.readFileSync(capImagePath);
    const userPhotoBase64 = userPhotoBuffer.toString('base64');
    const capImageBase64 = capImageBuffer.toString('base64');
    const userPhotoMime = detectMimeType(userPhotoPath);
    const capImageMime = detectMimeType(capImagePath);

    const prompt = await buildTryOnPrompt({
      userPhotoBase64,
      capImageBase64,
      userPhotoMime,
      capImageMime,
      capName,
    });

    logger.info('Try-on prompt built', { promptLength: prompt.length, preview: prompt.substring(0, 200) });

    if (!prompt) {
      return {
        success: false,
        message: 'No pudimos describir las imágenes. Intenta con una foto más clara.',
      };
    }

    const fluxImageUrl = await generateImageWithFlux(prompt);
    logger.info('Flux image URL received', { hasUrl: Boolean(fluxImageUrl) });

    if (!fluxImageUrl) {
      return {
        success: false,
        message: 'La IA no pudo generar la imagen. Intenta de nuevo en unos segundos.',
      };
    }

    const imageBuffer = await downloadImageToBuffer(fluxImageUrl);

    const tryOnDir = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'client',
      'public',
      'uploads',
      'products',
      'try-on'
    );
    fs.mkdirSync(tryOnDir, { recursive: true });

    const filename = `try-on-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.jpg`;
    fs.writeFileSync(path.join(tryOnDir, filename), imageBuffer);

    return {
      success: true,
      generatedImageUrl: `/uploads/products/try-on/${filename}`,
      description: `Así te imaginamos con la ${capName}. La IA generó esta visualización a partir de tu foto y la gorra.`,
      message: '¡Imagen generada!',
    };
  } catch (err) {
    logger.error('Virtual try-on analysis failed', {
      message: err.message,
      status: err.response?.status,
      apiError: err.response?.data ? String(err.response.data).substring(0, 500) : undefined,
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
