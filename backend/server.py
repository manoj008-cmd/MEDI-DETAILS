from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from bson import ObjectId
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = "healthhub_secret_key_2024"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="HealthHub API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    blood_type: Optional[str] = None
    allergies: Optional[List[str]] = []
    emergency_contacts: Optional[List[Dict[str, str]]] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    blood_type: Optional[str] = None
    allergies: Optional[List[str]] = []
    emergency_contacts: Optional[List[Dict[str, str]]] = []
    family_members: Optional[List[str]] = []  # User IDs
    role: str = "user"  # user, admin, family_member
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Medicine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    dosage: str
    frequency: str  # daily, twice_daily, weekly, etc.
    instructions: Optional[str] = None
    stock_quantity: int = 0
    expiry_date: Optional[datetime] = None
    category: Optional[str] = "general"  # pain_relief, antibiotics, vitamins, etc.
    prescription_image: Optional[str] = None  # base64 encoded
    reminders: Optional[List[Dict[str, Any]]] = []  # reminder times
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MedicineCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    stock_quantity: int = 0
    expiry_date: Optional[datetime] = None
    category: Optional[str] = "general"
    prescription_image: Optional[str] = None
    reminders: Optional[List[Dict[str, Any]]] = []

class HealthRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    medicine_id: str
    taken_at: datetime
    status: str  # taken, missed, delayed
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HealthRecordCreate(BaseModel):
    medicine_id: str
    status: str
    notes: Optional[str] = None
    taken_at: Optional[datetime] = None

class FamilyInvite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inviter_id: str
    invitee_email: EmailStr
    role: str = "family_member"
    status: str = "pending"  # pending, accepted, declined
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FamilyInviteCreate(BaseModel):
    invitee_email: EmailStr
    role: str = "family_member"

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    user = await db.users.find_one({"email": payload["email"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return User(**user)

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hashed_password
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    
    # Create access token
    token = create_access_token(user.id, user.email)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create access token
    token = create_access_token(user["id"], user["email"])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "blood_type": user.get("blood_type"),
            "allergies": user.get("allergies", []),
            "emergency_contacts": user.get("emergency_contacts", [])
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Medicine Routes
@api_router.get("/medicines", response_model=List[Medicine])
async def get_medicines(current_user: User = Depends(get_current_user)):
    medicines = await db.medicines.find({"user_id": current_user.id}).to_list(1000)
    return [Medicine(**medicine) for medicine in medicines]

@api_router.post("/medicines", response_model=Medicine)
async def create_medicine(medicine_data: MedicineCreate, current_user: User = Depends(get_current_user)):
    medicine_dict = medicine_data.dict()
    medicine_dict["user_id"] = current_user.id
    
    medicine = Medicine(**medicine_dict)
    await db.medicines.insert_one(medicine.dict())
    return medicine

@api_router.get("/medicines/{medicine_id}", response_model=Medicine)
async def get_medicine(medicine_id: str, current_user: User = Depends(get_current_user)):
    medicine = await db.medicines.find_one({"id": medicine_id, "user_id": current_user.id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return Medicine(**medicine)

@api_router.put("/medicines/{medicine_id}", response_model=Medicine)
async def update_medicine(medicine_id: str, medicine_data: MedicineCreate, current_user: User = Depends(get_current_user)):
    medicine = await db.medicines.find_one({"id": medicine_id, "user_id": current_user.id})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    update_data = medicine_data.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.medicines.update_one(
        {"id": medicine_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    updated_medicine = await db.medicines.find_one({"id": medicine_id, "user_id": current_user.id})
    return Medicine(**updated_medicine)

@api_router.delete("/medicines/{medicine_id}")
async def delete_medicine(medicine_id: str, current_user: User = Depends(get_current_user)):
    result = await db.medicines.delete_one({"id": medicine_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return {"message": "Medicine deleted successfully"}

# Health Records Routes
@api_router.get("/health-records", response_model=List[HealthRecord])
async def get_health_records(current_user: User = Depends(get_current_user)):
    records = await db.health_records.find({"user_id": current_user.id}).sort("taken_at", -1).to_list(1000)
    return [HealthRecord(**record) for record in records]

@api_router.post("/health-records", response_model=HealthRecord)
async def create_health_record(record_data: HealthRecordCreate, current_user: User = Depends(get_current_user)):
    record_dict = record_data.dict()
    record_dict["user_id"] = current_user.id
    if not record_dict.get("taken_at"):
        record_dict["taken_at"] = datetime.utcnow()
    
    record = HealthRecord(**record_dict)
    await db.health_records.insert_one(record.dict())
    return record

# Family Management Routes
@api_router.post("/family/invite")
async def invite_family_member(invite_data: FamilyInviteCreate, current_user: User = Depends(get_current_user)):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": invite_data.invitee_email})
    
    invite_dict = invite_data.dict()
    invite_dict["inviter_id"] = current_user.id
    
    invite = FamilyInvite(**invite_dict)
    await db.family_invites.insert_one(invite.dict())
    
    if existing_user:
        # Add to family immediately if user exists
        await db.users.update_one(
            {"id": current_user.id},
            {"$addToSet": {"family_members": existing_user["id"]}}
        )
        await db.users.update_one(
            {"id": existing_user["id"]},
            {"$addToSet": {"family_members": current_user.id}}
        )
        
        return {"message": f"Added {invite_data.invitee_email} to family"}
    
    return {"message": f"Invitation sent to {invite_data.invitee_email}"}

@api_router.get("/family/members")
async def get_family_members(current_user: User = Depends(get_current_user)):
    if not current_user.family_members:
        return []
    
    members = await db.users.find(
        {"id": {"$in": current_user.family_members}}
    ).to_list(1000)
    
    return [
        {
            "id": member["id"],
            "full_name": member["full_name"],
            "email": member["email"],
            "blood_type": member.get("blood_type"),
            "allergies": member.get("allergies", [])
        }
        for member in members
    ]

# Health Analytics Routes
@api_router.get("/analytics/adherence")
async def get_adherence_stats(current_user: User = Depends(get_current_user)):
    # Get records from last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    records = await db.health_records.find({
        "user_id": current_user.id,
        "taken_at": {"$gte": thirty_days_ago}
    }).to_list(1000)
    
    total_records = len(records)
    taken_records = len([r for r in records if r["status"] == "taken"])
    
    adherence_rate = (taken_records / total_records * 100) if total_records > 0 else 0
    
    return {
        "adherence_rate": round(adherence_rate, 1),
        "total_doses": total_records,
        "taken_doses": taken_records,
        "missed_doses": total_records - taken_records,
        "period_days": 30
    }

@api_router.get("/analytics/upcoming-expiries")
async def get_upcoming_expiries(current_user: User = Depends(get_current_user)):
    thirty_days_later = datetime.utcnow() + timedelta(days=30)
    
    medicines = await db.medicines.find({
        "user_id": current_user.id,
        "expiry_date": {"$lte": thirty_days_later, "$gte": datetime.utcnow()}
    }).sort("expiry_date", 1).to_list(100)
    
    return [Medicine(**medicine) for medicine in medicines]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
