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
      predictions: data.predictions.map(p => ({
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

module.exports = { analyzeTransaction, analyzeInventory, predictDemand };
