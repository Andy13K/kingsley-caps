const axios = require('axios');
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

const analyzeVirtualTryOn = async ({ userPhotoPath, capImagePath, capName, capDescription }) => {
  try {
    const userPhotoBuffer = fs.readFileSync(userPhotoPath);
    const capImageBuffer = fs.readFileSync(capImagePath);

    const userPhotoBase64 = userPhotoBuffer.toString('base64');
    const capImageBase64 = capImageBuffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: userPhotoBase64,
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: capImageBase64,
              },
            },
            {
              type: 'text',
              text: `Analiza estas dos imágenes:
1. Primera imagen: La foto del usuario
2. Segunda imagen: Una gorra llamada "${capName}" - ${capDescription}

Por favor:
1. Describe el rostro del usuario (color de cabello, forma de cara, etc.)
2. Visualiza cómo se vería la gorra "${capName}" en el usuario
3. Proporciona una descripción detallada de cómo lucirían con la gorra
4. Estima el estilo general (casual, deportivo, formal, etc.)
5. Proporciona recomendaciones de accesorios que combinarían bien

Responde en JSON con la estructura: {
  "userDescription": "descripción del usuario",
  "styleWithCap": "cómo se vería con la gorra",
  "compatibility": "qué tan bien combina (excelente/bueno/moderado)",
  "recommendations": ["recomendación 1", "recomendación 2"],
  "viralChance": "probabilidad de que sea trending en redes (alto/medio/bajo)"
}`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent) {
      throw new Error('No text response from Claude');
    }

    let analysisResult;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : textContent.text);
    } catch {
      analysisResult = {
        userDescription: 'Análisis completado',
        styleWithCap: textContent.text,
        compatibility: 'excelente',
        recommendations: ['Prueba con diferentes looks'],
        viralChance: 'alto',
      };
    }

    return {
      success: true,
      analysis: analysisResult,
      message: '¡Análisis completado! Mira cómo se vería la gorra contigo.',
    };
  } catch (err) {
    logger.error('Virtual try-on analysis failed', { message: err.message });
    return {
      success: false,
      message: 'No pudimos analizar la imagen. Intenta con una foto más clara.',
      error: err.message,
    };
  }
};

module.exports = { analyzeTransaction, analyzeInventory, analyzeVirtualTryOn };
