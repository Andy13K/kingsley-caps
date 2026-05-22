import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers.demand_analyzer import predict


def _make_product(product_id, daily_sales, name="Test Product", category="Snapback"):
    """Helper to build a product dict without repeating boilerplate in every test."""
    return {
        "product_id": product_id,
        "product_name": name,
        "category": category,
        "daily_sales": daily_sales,
    }


@pytest.mark.asyncio
async def test_high_confidence_when_total_sales_exceed_threshold():
    """Total units sold >= 30 in the window should produce confidence='high'."""
    result = await predict({
        "store_id": "store-001",
        "products": [_make_product("p1", [2] * 30)],  # total = 60
        "forecast_days": 7,
    })

    assert result["predictions"][0]["confidence"] == "high"


@pytest.mark.asyncio
async def test_medium_confidence_with_partial_sales():
    """Total units between 7 and 29 should produce confidence='medium'."""
    result = await predict({
        "store_id": "store-001",
        "products": [_make_product("p1", [0] * 20 + [1] * 10)],  # total = 10
        "forecast_days": 7,
    })

    assert result["predictions"][0]["confidence"] == "medium"


@pytest.mark.asyncio
async def test_zero_prediction_and_low_confidence_with_no_history():
    """No sales history should produce predicted_units=0 and confidence='low'."""
    result = await predict({
        "store_id": "store-001",
        "products": [_make_product("p1", [0] * 30)],  # total = 0
        "forecast_days": 7,
    })

    pred = result["predictions"][0]
    assert pred["predicted_units"] == 0
    assert pred["confidence"] == "low"


@pytest.mark.asyncio
async def test_trend_up_when_recent_demand_grows():
    """Sales that double in the last 7 days vs prior 7 should produce trend='up'."""
    # avg_last_7=3, avg_prev_7=1 → trend_factor=(3-1)/1=2 → clamped 1.0 → "up"
    daily_sales = [1] * 16 + [1] * 7 + [3] * 7
    result = await predict({
        "store_id": "store-001",
        "products": [_make_product("p1", daily_sales)],
        "forecast_days": 7,
    })

    assert result["predictions"][0]["trend"] == "up"


@pytest.mark.asyncio
async def test_trend_down_when_recent_demand_declines():
    """Sales that fall in the last 7 days vs prior 7 should produce trend='down'."""
    # avg_last_7=1, avg_prev_7=3 → trend_factor=(1-3)/3≈-0.67 → "down"
    daily_sales = [3] * 16 + [3] * 7 + [1] * 7
    result = await predict({
        "store_id": "store-001",
        "products": [_make_product("p1", daily_sales)],
        "forecast_days": 7,
    })

    assert result["predictions"][0]["trend"] == "down"


@pytest.mark.asyncio
async def test_trend_flat_when_demand_is_stable():
    """Constant daily sales should produce trend='flat'."""
    # avg_last_7=2, avg_prev_7=2 → trend_factor=0 → "flat"
    result = await predict({
        "store_id": "store-001",
        "products": [_make_product("p1", [2] * 30)],
        "forecast_days": 7,
    })

    assert result["predictions"][0]["trend"] == "flat"


@pytest.mark.asyncio
async def test_empty_products_returns_empty_predictions():
    """An empty products list should return an empty predictions list."""
    result = await predict({
        "store_id": "store-001",
        "products": [],
        "forecast_days": 7,
    })

    assert result["predictions"] == []


@pytest.mark.asyncio
async def test_predictions_sorted_descending_by_predicted_units():
    """Results should be ordered from highest to lowest predicted_units."""
    # Flat demand: predicted = avg_last_7 * 7 → A=7, B=35, C=21 → order: B, C, A
    products = [
        _make_product("A", [1] * 30),
        _make_product("B", [5] * 30),
        _make_product("C", [3] * 30),
    ]
    result = await predict({
        "store_id": "store-001",
        "products": products,
        "forecast_days": 7,
    })

    ids = [p["product_id"] for p in result["predictions"]]
    assert ids == ["B", "C", "A"]
