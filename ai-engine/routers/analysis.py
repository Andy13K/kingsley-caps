from fastapi import APIRouter, HTTPException
from models.schemas import (
    TransactionRequest,
    TransactionResponse,
    InventoryAlertRequest,
    InventoryAlertResponse,
    PriceSuggestionRequest,
    PriceSuggestionResponse,
)
from analyzers.transaction_analyzer import analyze_transaction
from analyzers.inventory_analyzer import analyze_inventory
from analyzers.price_analyzer import suggest as suggest_price

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


@router.post("/analyze-transaction", response_model=TransactionResponse)
async def analyze_transaction_endpoint(request: TransactionRequest):
    try:
        result = await analyze_transaction(request.model_dump())
        return TransactionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inventory-alert", response_model=InventoryAlertResponse)
async def inventory_alert_endpoint(request: InventoryAlertRequest):
    try:
        result = await analyze_inventory(request.model_dump())
        return InventoryAlertResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-price", response_model=PriceSuggestionResponse)
async def suggest_price_endpoint(request: PriceSuggestionRequest):
    try:
        result = await suggest_price(request.model_dump())
        return PriceSuggestionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
