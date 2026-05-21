import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers.price_analyzer import suggest


def _make_request(comparables, featured=False, tags=None, category="Snapback"):
    """Build a suggest() input dict with sensible defaults."""
    return {
        "product_data": {
            "name": "Test Product",
            "category": category,
            "tags": tags or [],
            "featured": featured,
        },
        "comparable_products": comparables,
    }


@pytest.mark.asyncio
async def test_suggest_with_6_comparables():
    """Six or more comparables should yield confidence=80."""
    comparables = [{"name": f"P{i}", "price": float(100 + i * 10)} for i in range(6)]
    result = await suggest(_make_request(comparables))
    assert result["confidence"] == 80


@pytest.mark.asyncio
async def test_suggest_with_2_comparables():
    """One or two comparables should yield confidence=30."""
    comparables = [{"name": "A", "price": 200.0}, {"name": "B", "price": 300.0}]
    result = await suggest(_make_request(comparables))
    assert result["confidence"] == 30


@pytest.mark.asyncio
async def test_suggest_no_comparables():
    """No comparables should return confidence=0 and suggested_price=0.0."""
    result = await suggest(_make_request([]))
    assert result["confidence"] == 0
    assert result["suggested_price"] == 0.0


@pytest.mark.asyncio
async def test_featured_uses_p75():
    """featured=True should use p75 (400), not the median (250)."""
    # prices [100, 200, 300, 400]: median=250, p75_index=3 → p75=400
    comparables = [{"name": f"P{i}", "price": float(i * 100)} for i in range(1, 5)]
    result_featured = await suggest(_make_request(comparables, featured=True))
    result_base = await suggest(_make_request(comparables, featured=False))
    assert result_featured["suggested_price"] == 400.0
    assert result_base["suggested_price"] == 250.0


@pytest.mark.asyncio
async def test_limited_tag_adds_10_pct():
    """Tag 'limited' should apply a 10% premium over the market median."""
    # prices [100, 200, 300]: median=200, expected=220.0
    comparables = [{"name": f"P{i}", "price": float(i * 100)} for i in range(1, 4)]
    result = await suggest(_make_request(comparables, tags=["limited"]))
    assert result["suggested_price"] == round(200.0 * 1.10, 2)


@pytest.mark.asyncio
async def test_similar_products_max_5():
    """similar_products must never exceed 5 entries regardless of comparable count."""
    comparables = [{"name": f"P{i}", "price": float(100 + i * 10)} for i in range(20)]
    result = await suggest(_make_request(comparables))
    assert len(result["similar_products"]) <= 5


@pytest.mark.asyncio
async def test_reasoning_in_spanish():
    """Reasoning field must be written in Spanish."""
    comparables = [{"name": "A", "price": 250.0}, {"name": "B", "price": 300.0}]
    result = await suggest(_make_request(comparables))
    assert "Basado en" in result["reasoning"]
