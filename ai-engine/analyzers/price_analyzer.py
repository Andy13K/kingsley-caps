from statistics import mean, median


async def suggest(data: dict) -> dict:
    product_data = data.get("product_data", {})
    comparables = data.get("comparable_products", [])

    category = product_data.get("category", "")
    tags = [t.lower() for t in product_data.get("tags", [])]
    featured = product_data.get("featured", False)

    # No comparable products — cannot suggest a price
    if not comparables:
        return {
            "suggested_price": 0.0,
            "confidence": 0,
            "reasoning": "Sin productos comparables en esta categoria.",
            "similar_products": [],
        }

    prices = [float(p["price"]) for p in comparables]
    sorted_prices = sorted(prices)
    n = len(prices)

    avg_price = mean(prices)
    median_price = median(prices)

    # Percentile 75: index-based for determinism across Python versions
    p75_index = min(int(n * 0.75), n - 1)
    p75_price = sorted_prices[p75_index]

    # Determine suggested price based on product attributes
    has_limited_tag = any("limited" in t or "edicion" in t for t in tags)

    if featured:
        # Premium positioning: use upper quartile as baseline
        suggested_price = round(p75_price, 2)
    elif has_limited_tag:
        # Limited editions command a 10% premium over the market median
        suggested_price = round(median_price * 1.10, 2)
    else:
        # Standard pricing: follow the market median
        suggested_price = round(median_price, 2)

    # Confidence level based on number of comparable products
    if n >= 6:
        confidence = 80
    elif n >= 3:
        confidence = 60
    else:
        confidence = 30

    # Reasoning in Spanish for vendor readability
    reasoning = (
        f"Basado en {n} productos similares de la categoria {category}. "
        f"Precio promedio: Q{avg_price:.2f}. "
        f"Rango: Q{sorted_prices[0]:.2f} - Q{sorted_prices[-1]:.2f}."
    )

    # Select up to 5 products closest to the suggested price
    sorted_by_proximity = sorted(
        comparables,
        key=lambda p: abs(float(p["price"]) - suggested_price)
    )
    similar_products = [
        {"name": p["name"], "price": float(p["price"])}
        for p in sorted_by_proximity[:5]
    ]

    return {
        "suggested_price": suggested_price,
        "confidence": confidence,
        "reasoning": reasoning,
        "similar_products": similar_products,
    }
