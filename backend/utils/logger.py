import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def log_activity(user_id: str, action: str, entity_type: str, entity_id: str, changes: dict = None):
    """Log user activity"""
    log_msg = f"User {user_id} performed {action} on {entity_type} {entity_id}"
    if changes:
        log_msg += f": {changes}"
    logger.info(log_msg)

def get_logger(name: str):
    """Get logger instance"""
    return logging.getLogger(name)
