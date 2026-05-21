from pydantic import BaseModel


class TransactionRequest(BaseModel):
    order_id: str
    amount: float
    customer_id: str
    tx_hash: str | None = None
    metadata: dict = {}


class TransactionResponse(BaseModel):
    risk_score: float
    flagged: bool
    blocked: bool
    reasons: list[str]
    recommendations: list[str]


class InventoryAlertRequest(BaseModel):
    store_id: str
    variant_id: str
    current_stock: int
    low_stock_threshold: int
    sales_last_7_days: int = 0
    sales_last_30_days: int = 0


class InventoryAlertResponse(BaseModel):
    alert_level: str
    predicted_days_until_stockout: int | None
    recommended_reorder_quantity: int
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str


class ProductDataForPricing(BaseModel):
    name: str
    category: str
    tags: list[str] = []
    featured: bool = False


class ComparableProduct(BaseModel):
    name: str
    price: float


class PriceSuggestionRequest(BaseModel):
    product_data: ProductDataForPricing
    comparable_products: list[ComparableProduct]


class PriceSuggestionResponse(BaseModel):
    suggested_price: float
    confidence: int
    reasoning: str
    similar_products: list[ComparableProduct]
