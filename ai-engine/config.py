import os


class Settings:
    RISK_THRESHOLD_FLAG: float = float(os.getenv("RISK_THRESHOLD_FLAG", "0.7"))
    RISK_THRESHOLD_BLOCK: float = float(os.getenv("RISK_THRESHOLD_BLOCK", "0.9"))
    MAX_ORDERS_PER_HOUR: int = int(os.getenv("MAX_ORDERS_PER_HOUR", "5"))
    LARGE_FIRST_PURCHASE_AMOUNT: float = float(os.getenv("LARGE_FIRST_PURCHASE_AMOUNT", "2000.0"))
    AMOUNT_DISCREPANCY_WEIGHT: float = float(os.getenv("AMOUNT_DISCREPANCY_WEIGHT", "0.8"))
    HIGH_FREQUENCY_WEIGHT: float = float(os.getenv("HIGH_FREQUENCY_WEIGHT", "0.3"))
    LARGE_FIRST_PURCHASE_WEIGHT: float = float(os.getenv("LARGE_FIRST_PURCHASE_WEIGHT", "0.4"))
    NEW_ACCOUNT_WEIGHT: float = float(os.getenv("NEW_ACCOUNT_WEIGHT", "0.2"))
    UNUSUAL_AMOUNT_WEIGHT: float = float(os.getenv("UNUSUAL_AMOUNT_WEIGHT", "0.25"))


settings = Settings()
