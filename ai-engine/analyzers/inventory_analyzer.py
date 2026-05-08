async def analyze_inventory(data: dict) -> dict:
    current_stock = data.get("current_stock", 0)
    low_stock_threshold = data.get("low_stock_threshold", 0)
    sales_last_7_days = data.get("sales_last_7_days", 0)
    sales_last_30_days = data.get("sales_last_30_days", 0)

    # Calculate daily sales rate, preferring the 7-day window for accuracy
    if sales_last_7_days > 0:
        daily_rate = sales_last_7_days / 7
    elif sales_last_30_days > 0:
        daily_rate = sales_last_30_days / 30
    else:
        daily_rate = 0.0

    # Predict days until stockout
    if daily_rate > 0:
        predicted_days = int(current_stock / daily_rate)
    else:
        predicted_days = None

    # Determine alert level
    if current_stock == 0:
        alert_level = "out_of_stock"
    elif low_stock_threshold > 0 and current_stock <= low_stock_threshold // 2:
        alert_level = "critical"
    elif current_stock <= low_stock_threshold:
        alert_level = "low"
    else:
        alert_level = "low"

    # Recommend reorder quantity for 2 weeks of sales
    recommended_reorder = max(int(daily_rate * 14), low_stock_threshold * 2)

    # Build descriptive message
    if alert_level == "out_of_stock":
        message = "Product is out of stock. Immediate restock required."
    elif alert_level == "critical":
        if predicted_days is not None:
            message = f"Critical stock level. Estimated {predicted_days} days until stockout. Reorder {recommended_reorder} units."
        else:
            message = f"Critical stock level. No recent sales data. Reorder {recommended_reorder} units."
    else:
        if predicted_days is not None:
            message = f"Low stock warning. Estimated {predicted_days} days until stockout. Consider reordering {recommended_reorder} units."
        else:
            message = f"Low stock warning. No recent sales data. Consider reordering {recommended_reorder} units."

    return {
        "alert_level": alert_level,
        "predicted_days_until_stockout": predicted_days,
        "recommended_reorder_quantity": recommended_reorder,
        "message": message,
    }
