import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzers.transaction_analyzer import analyze_transaction


@pytest.mark.asyncio
async def test_clean_transaction():
    """Normal transaction with no risk signals should have low score and not be flagged."""
    result = await analyze_transaction({
        "order_id": "order-001",
        "amount": 150.0,
        "customer_id": "cust-001",
        "metadata": {
            "is_first_purchase": False,
            "orders_last_hour": 1,
            "account_age_days": 365,
            "amount_discrepancy": False,
            "average_order_amount": 140.0,
        },
    })

    assert result["risk_score"] == 0.0
    assert result["flagged"] is False
    assert result["blocked"] is False
    assert result["reasons"] == []


@pytest.mark.asyncio
async def test_large_first_purchase():
    """First purchase above GTQ 2000 threshold should add LARGE_FIRST_PURCHASE reason (score 0.4)."""
    result = await analyze_transaction({
        "order_id": "order-002",
        "amount": 5000.0,
        "customer_id": "cust-002",
        "metadata": {
            "is_first_purchase": True,
            "orders_last_hour": 1,
            "account_age_days": 30,
        },
    })

    # Score 0.4 alone is below the 0.7 flag threshold — rule fires but does not flag alone
    assert "LARGE_FIRST_PURCHASE" in result["reasons"]
    assert result["risk_score"] >= 0.4
    assert result["flagged"] is False
    assert any("identity" in r.lower() for r in result["recommendations"])


@pytest.mark.asyncio
async def test_high_frequency():
    """More than 5 orders in the last hour should add HIGH_ORDER_FREQUENCY reason (score 0.3)."""
    result = await analyze_transaction({
        "order_id": "order-003",
        "amount": 200.0,
        "customer_id": "cust-003",
        "metadata": {
            "orders_last_hour": 6,
            "is_first_purchase": False,
        },
    })

    # Score 0.3 alone is below the 0.7 flag threshold — rule fires but does not flag alone
    assert "HIGH_ORDER_FREQUENCY" in result["reasons"]
    assert result["risk_score"] >= 0.3
    assert result["flagged"] is False


@pytest.mark.asyncio
async def test_amount_discrepancy():
    """Crypto amount discrepancy should produce a high risk score."""
    result = await analyze_transaction({
        "order_id": "order-004",
        "amount": 700.0,
        "customer_id": "cust-004",
        "metadata": {
            "amount_discrepancy": True,
            "is_first_purchase": False,
        },
    })

    assert "AMOUNT_DISCREPANCY" in result["reasons"]
    assert result["flagged"] is True
    assert result["risk_score"] >= 0.8
    assert any("block" in r.lower() for r in result["recommendations"])


@pytest.mark.asyncio
async def test_combined_risks():
    """Multiple risk signals should accumulate the score."""
    result = await analyze_transaction({
        "order_id": "order-005",
        "amount": 3000.0,
        "customer_id": "cust-005",
        "metadata": {
            "is_first_purchase": True,
            "orders_last_hour": 7,
            "account_age_days": 0,
            "amount_discrepancy": False,
        },
    })

    # LARGE_FIRST_PURCHASE (0.4) + HIGH_FREQUENCY (0.3) + NEW_ACCOUNT (0.2) = 0.9
    assert result["risk_score"] >= 0.7
    assert len(result["reasons"]) >= 2
    assert result["flagged"] is True


@pytest.mark.asyncio
async def test_risk_score_capped_at_one():
    """Risk score must never exceed 1.0 regardless of how many signals trigger."""
    result = await analyze_transaction({
        "order_id": "order-006",
        "amount": 9999.0,
        "customer_id": "cust-006",
        "metadata": {
            "is_first_purchase": True,
            "orders_last_hour": 20,
            "account_age_days": 0,
            "amount_discrepancy": True,
            "average_order_amount": 100.0,
            "shipping_address_changes": 5,
        },
    })

    assert result["risk_score"] <= 1.0
    assert result["blocked"] is True


@pytest.mark.asyncio
async def test_new_account_risk():
    """Account with 0 days old should trigger NEW_ACCOUNT reason."""
    result = await analyze_transaction({
        "order_id": "order-007",
        "amount": 100.0,
        "customer_id": "cust-007",
        "metadata": {
            "account_age_days": 0,
            "is_first_purchase": True,
        },
    })

    assert "NEW_ACCOUNT" in result["reasons"]
    assert result["risk_score"] >= 0.2


@pytest.mark.asyncio
async def test_unusual_amount():
    """Amount more than 3x the average should trigger UNUSUAL_AMOUNT."""
    result = await analyze_transaction({
        "order_id": "order-008",
        "amount": 1500.0,
        "customer_id": "cust-008",
        "metadata": {
            "average_order_amount": 200.0,
            "is_first_purchase": False,
        },
    })

    assert "UNUSUAL_AMOUNT" in result["reasons"]
    assert result["risk_score"] >= 0.25
