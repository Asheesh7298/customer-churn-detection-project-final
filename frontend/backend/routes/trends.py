from fastapi import APIRouter
from schemas.request_response import TrendResponse
from utils.data_loader import TrendDataGenerator

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("", response_model=TrendResponse)
async def get_trends():
    """Get trend data for the past 12 months"""
    return TrendDataGenerator.format_trend_response()
