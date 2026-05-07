import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers.inventory_analyzer import analyze_inventory


@pytest.mark.asyncio
async def test_out_of_stock():
    """Zero stock should result in out_of_stock alert level."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 0,
        "low_stock_threshold": 5,
        "sales_last_7_days": 10,
        "sales_last_30_days": 40,
    })

    assert result["alert_level"] == "out_of_stock"
    assert "out of stock" in result["message"].lower()
    assert result["recommended_reorder_quantity"] > 0


@pytest.mark.asyncio
async def test_critical_stock():
    """Stock at or below half the threshold should be critical."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 2,
        "low_stock_threshold": 10,
        "sales_last_7_days": 7,
        "sales_last_30_days": 30,
    })

    assert result["alert_level"] == "critical"


@pytest.mark.asyncio
async def test_low_stock():
    """Stock at or below threshold (but above half) should be low."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 4,
        "low_stock_threshold": 5,
        "sales_last_7_days": 7,
        "sales_last_30_days": 30,
    })

    assert result["alert_level"] == "low"


@pytest.mark.asyncio
async def test_predicted_stockout_uses_7day_rate():
    """Predicted days should use 7-day rate when available."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 7,
        "low_stock_threshold": 5,
        "sales_last_7_days": 7,   # 1 unit/day
        "sales_last_30_days": 60,  # 2 units/day (should be ignored)
    })

    # 7 stock / (7/7=1 unit per day) = 7 days
    assert result["predicted_days_until_stockout"] == 7


@pytest.mark.asyncio
async def test_predicted_stockout_falls_back_to_30day():
    """When no 7-day sales, should fall back to 30-day rate."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 15,
        "low_stock_threshold": 5,
        "sales_last_7_days": 0,
        "sales_last_30_days": 30,  # 1 unit/day
    })

    # 15 stock / 1 per day = 15 days
    assert result["predicted_days_until_stockout"] == 15


@pytest.mark.asyncio
async def test_no_sales_data_returns_none_prediction():
    """With no sales history, predicted days should be None."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 3,
        "low_stock_threshold": 5,
        "sales_last_7_days": 0,
        "sales_last_30_days": 0,
    })

    assert result["predicted_days_until_stockout"] is None


@pytest.mark.asyncio
async def test_reorder_quantity():
    """Recommended reorder should cover at least 2 weeks of sales."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 2,
        "low_stock_threshold": 5,
        "sales_last_7_days": 14,   # 2 units/day
        "sales_last_30_days": 60,
    })

    # 2 units/day * 14 days = 28; min(28, 5*2=10) → 28
    assert result["recommended_reorder_quantity"] >= 28


@pytest.mark.asyncio
async def test_reorder_quantity_minimum():
    """Reorder quantity should be at least threshold * 2 when sales rate is very low."""
    result = await analyze_inventory({
        "store_id": "store-001",
        "variant_id": "variant-001",
        "current_stock": 1,
        "low_stock_threshold": 10,
        "sales_last_7_days": 1,   # ~0.14 units/day → 14-day qty ≈ 2
        "sales_last_30_days": 4,
    })

    # max(int(0.14*14)=1, 10*2=20) → 20
    assert result["recommended_reorder_quantity"] >= 20
