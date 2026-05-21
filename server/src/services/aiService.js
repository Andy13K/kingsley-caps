const axios = require('axios');
const logger = require('../utils/logger');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

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

module.exports = { analyzeTransaction, analyzeInventory, suggestPrice };
