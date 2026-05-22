from statistics import mean
from datetime import datetime, timezone


async def predict(data: dict) -> dict:
    store_id = data.get("store_id", "")
    products = data.get("products", [])
    forecast_days = data.get("forecast_days", 7)

    predictions = []
    for product in products:
        product_id = product.get("product_id", "")
        product_name = product.get("product_name", "")
        category = product.get("category", "")
        daily_sales = product.get("daily_sales", [0] * 30)

        # Normalize to exactly 30 data points (pad with zeros if shorter)
        if len(daily_sales) < 30:
            daily_sales = [0] * (30 - len(daily_sales)) + daily_sales
        daily_sales = daily_sales[:30]

        # Weighted moving average: compare last 7 days vs prior 7 days
        avg_last_7 = mean(daily_sales[-7:])
        avg_prev_7 = mean(daily_sales[-14:-7])

        # Trend factor: positive = growing demand, negative = declining
        trend_factor = (avg_last_7 - avg_prev_7) / max(avg_prev_7, 0.001)
        # Clamp to [-1, 1] to prevent absurd projections when avg_prev_7 ≈ 0
        trend_factor = max(min(trend_factor, 1.0), -1.0)

        # Dampen trend by 0.5 to avoid over-projecting short spikes
        predicted_units = round(avg_last_7 * forecast_days * (1 + trend_factor * 0.5))
        predicted_units = max(predicted_units, 0)

        if trend_factor > 0.1:
            trend = "up"
        elif trend_factor < -0.1:
            trend = "down"
        else:
            trend = "flat"

        # Confidence based on total units sold in the 30-day window
        total_sales = sum(daily_sales)
        if total_sales >= 30:
            confidence = "high"
        elif total_sales >= 7:
            confidence = "medium"
        else:
            confidence = "low"

        predictions.append({
            "product_id": product_id,
            "product_name": product_name,
            "category": category,
            "predicted_units": predicted_units,
            "trend": trend,
            "confidence": confidence,
            "avg_daily_sales": round(avg_last_7, 2),
        })

    # Sort descending so vendor sees highest-demand products first
    predictions.sort(key=lambda p: p["predicted_units"], reverse=True)

    return {
        "store_id": store_id,
        "forecast_days": forecast_days,
        "predictions": predictions,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
