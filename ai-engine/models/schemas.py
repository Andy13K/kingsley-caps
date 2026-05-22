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


class ProductSalesData(BaseModel):
    product_id: str
    product_name: str
    category: str
    daily_sales: list[int]  # 30 integers, index 0 = 30 days ago, index 29 = yesterday


class DemandPredictionRequest(BaseModel):
    store_id: str
    products: list[ProductSalesData]
    forecast_days: int = 7


class ProductDemandForecast(BaseModel):
    product_id: str
    product_name: str
    category: str
    predicted_units: int
    trend: str            # "up" | "flat" | "down"
    confidence: str       # "high" | "medium" | "low"
    avg_daily_sales: float


class DemandPredictionResponse(BaseModel):
    store_id: str
    forecast_days: int
    predictions: list[ProductDemandForecast]
    generated_at: str     # ISO 8601 timestamp
