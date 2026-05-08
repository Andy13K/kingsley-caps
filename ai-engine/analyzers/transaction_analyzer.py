from config import settings


async def analyze_transaction(data: dict) -> dict:
    amount = data.get("amount", 0)
    metadata = data.get("metadata", {})

    risk_score = 0.0
    reasons = []
    recommendations = []

    # Rule 1 — Large first purchase
    if metadata.get("is_first_purchase") and amount > settings.LARGE_FIRST_PURCHASE_AMOUNT:
        risk_score += settings.LARGE_FIRST_PURCHASE_WEIGHT
        reasons.append("LARGE_FIRST_PURCHASE")
        recommendations.append("Verify customer identity before processing")

    # Rule 2 — High order frequency
    orders_last_hour = metadata.get("orders_last_hour")
    if orders_last_hour is not None and orders_last_hour > settings.MAX_ORDERS_PER_HOUR:
        risk_score += settings.HIGH_FREQUENCY_WEIGHT
        reasons.append("HIGH_ORDER_FREQUENCY")
        recommendations.append("Review account for automated activity")

    # Rule 3 — Amount discrepancy (crypto payment mismatch)
    if metadata.get("amount_discrepancy"):
        risk_score += settings.AMOUNT_DISCREPANCY_WEIGHT
        reasons.append("AMOUNT_DISCREPANCY")
        recommendations.append("Block transaction and notify admin immediately")

    # Rule 4 — New account
    account_age_days = metadata.get("account_age_days")
    if account_age_days is not None and account_age_days < 1:
        risk_score += settings.NEW_ACCOUNT_WEIGHT
        reasons.append("NEW_ACCOUNT")
        recommendations.append("Apply additional verification for new accounts")

    # Rule 5 — Unusual amount compared to history
    average_order_amount = metadata.get("average_order_amount")
    if average_order_amount is not None and average_order_amount > 0 and amount > average_order_amount * 3:
        risk_score += settings.UNUSUAL_AMOUNT_WEIGHT
        reasons.append("UNUSUAL_AMOUNT")
        recommendations.append("Confirm order details with customer")

    # Rule 6 — Frequent shipping address changes
    address_changes = metadata.get("shipping_address_changes")
    if address_changes is not None and address_changes > 2:
        risk_score += 0.15
        reasons.append("FREQUENT_ADDRESS_CHANGES")
        recommendations.append("Verify shipping address with customer")

    risk_score = min(max(risk_score, 0.0), 1.0)

    return {
        "risk_score": round(risk_score, 4),
        "flagged": risk_score >= settings.RISK_THRESHOLD_FLAG,
        "blocked": risk_score >= settings.RISK_THRESHOLD_BLOCK,
        "reasons": reasons,
        "recommendations": recommendations,
    }
