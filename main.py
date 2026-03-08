from fastapi import FastAPI, Form, UploadFile, File, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
import pandas as pd
import time
import random
import os
import shutil

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="WhatsApp Bulk Sender API")

# --- SECURITY SETUP ---
SECRET_API_KEY = os.getenv("SECRET_API_KEY", "default-key-change-this")
api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != SECRET_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Denied: Invalid API Key"
        )
    return api_key

# Allow React to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you'd put your React app's URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Your exact Sri Lankan number formatter!
def format_sl_number(number):
    clean_num = str(number).strip().replace(" ", "").replace("-", "")
    if clean_num.startswith("0"):
        return "+94" + clean_num[1:]
    elif clean_num.startswith("94"):
        return "+" + clean_num
    elif clean_num.startswith("+"):
        return clean_num
    else:
        return "+94" + clean_num

# 2. The Engine (Now accepts dynamic parameters)
def run_whatsapp_engine(csv_path, message_text, image_path=None):
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        return f"Error reading CSV: {e}"

    with sync_playwright() as p:
        # Re-using your saved session so you don't have to scan the QR code again
        browser = p.chromium.launch_persistent_context(
            user_data_dir="./wa_session", 
            headless=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720}
        )
        page = browser.pages[0]
        
        for index, row in df.iterrows():
            name = row.get('Name', 'Unknown') # Failsafe if 'Name' column is missing
            phone = format_sl_number(row['Phone']) 
            
            # ---------------------------------------------------------
            # NEW: DYNAMIC PERSONALIZATION LOGIC
            # ---------------------------------------------------------
            personalized_message = message_text
            row_dict = row.to_dict()
            
            # Loop through every column in the CSV for this row
            for column_name, cell_value in row_dict.items():
                # Handle empty cells gracefully (Pandas treats them as NaN)
                val_str = str(cell_value) if pd.notna(cell_value) else ""
                
                # Replace {ColumnName} with the actual data
                # Note: This is case-sensitive, so {Name} must match the CSV header 'Name'
                placeholder = f"{{{column_name}}}"
                personalized_message = personalized_message.replace(placeholder, val_str)
            # ---------------------------------------------------------

            print(f"Opening chat for {name} ({phone})...")
            url_phone = phone.replace("+", "")
            page.goto(f"https://web.whatsapp.com/send?phone={url_phone}")
            
            try:
                page.screenshot(path="debug_screen.png")
                page.wait_for_selector('div[aria-placeholder="Type a message"][contenteditable="true"]', timeout=90000)
                
                # IMAGE ATTACHMENT MODE
                if image_path:
                    print(f"Attaching image for {name}...")
                    time.sleep(2) 
                    
                    attach_btn = page.locator('button[aria-label="Attach"], button[aria-label="Add file"]').first
                    attach_btn.evaluate("node => node.click()")
                    
                    photo_video_btn = page.locator('text="Photos & videos"')
                    photo_video_btn.wait_for(state="visible", timeout=10000)
                    
                    with page.expect_file_chooser() as fc_info:
                        photo_video_btn.evaluate("node => node.click()")
                    
                    file_chooser = fc_info.value
                    file_chooser.set_files(image_path)
                    
                    caption_box = page.locator('div[contenteditable="true"]').last
                    caption_box.wait_for(state="visible", timeout=15000)
                    
                    caption_box.click(force=True)
                    time.sleep(0.5)
                    
                    page.keyboard.press("Control+A")
                    page.keyboard.press("Backspace")
                    time.sleep(0.5)
                    
                    # USE THE NEW PERSONALIZED MESSAGE HERE
                    page.keyboard.insert_text(personalized_message)
                    time.sleep(1)
                    
                    send_button = page.locator('div[aria-label="Send"][role="button"]')
                    send_button.evaluate("node => node.click()")
                    
                    print(f"🖼️ Image and personalized caption sent to {name}!")

                # TEXT ONLY MODE
                else:
                    page.screenshot(path="debug_screen.png")
                    chat_box = page.locator('div[aria-placeholder="Type a message"][contenteditable="true"]', timeout=90000)
                    chat_box.click()
                    time.sleep(0.5)
                    
                    page.keyboard.press("Control+A")
                    page.keyboard.press("Backspace")
                    time.sleep(0.5)
                    
                    # USE THE NEW PERSONALIZED MESSAGE HERE
                    page.keyboard.insert_text(personalized_message) 
                    time.sleep(1)
                    
                    page.keyboard.press("Enter")
                    print(f"✉️ Personalized text message sent to {name}!")
                
                sleep_time = random.uniform(15, 35)
                print(f"Resting for {int(sleep_time)} seconds...\n")
                time.sleep(sleep_time)

            except Exception as e:
                print(f"❌ Failed to send to {name}. Error: {e}")
                time.sleep(5)
                
        print("All messages processed!")
        browser.close()
        return "Campaign completed successfully!"

@app.get("/api/verify")
async def verify_login(api_key: str = Security(verify_api_key)):
    # If the API key is wrong, the bouncer (verify_api_key) will block it automatically.
    # If it gets here, the password is correct!
    return {"status": "Logged in"}


# 3. The API Endpoint
@app.post("/api/send-campaign")
def send_campaign(
    message: str = Form(...), 
    contacts_file: UploadFile = File(...),
    image_file: UploadFile = File(None), # Optional
    api_key: str = Security(verify_api_key)  # <--- THIS IS THE BOUNCER
):
    print("📥 Received new campaign request!")
    
    # Save the uploaded CSV to disk temporarily so Pandas can read it
    csv_path = f"temp_{contacts_file.filename}"
    with open(csv_path, "wb") as buffer:
        shutil.copyfileobj(contacts_file.file, buffer)
        
    # Save the uploaded Image temporarily (if the user attached one)
    img_path = None
    if image_file and image_file.filename:
        img_path = f"temp_{image_file.filename}"
        with open(img_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
            
    # Trigger your Playwright engine using the uploaded data
    result = run_whatsapp_engine(csv_path, message, img_path)
    
    # Clean up the temporary files so we don't clutter your folder
    if os.path.exists(csv_path):
        os.remove(csv_path)
    if img_path and os.path.exists(img_path):
        os.remove(img_path)
        
    return {"status": "success", "message": result}

app.mount("/", StaticFiles(directory="dist", html=True), name="static")