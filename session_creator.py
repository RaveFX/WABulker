import os
import shutil
from playwright.sync_api import sync_playwright

def create_whatsapp_session():
    session_dir = "./wa_session_2"
    zip_filename = "wa_session_2_export" # The name of your final zip file
    
    # 1. Check if session already exists
    if os.path.exists(session_dir):
        confirm = input(f"⚠️ '{session_dir}' already exists. Overwrite? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return

    # 2. Launch Browser and handle login
    with sync_playwright() as p:
        print("🚀 Launching Browser...")
        context = p.chromium.launch_persistent_context(
            user_data_dir=session_dir,
            headless=False,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        
        page = context.pages[0]
        page.goto("https://web.whatsapp.com")
        
        print("\n✅ ACTION REQUIRED:")
        print("1. Scan the QR code on your screen.")
        print("2. Wait for your chats to load completely.")
        print("3. Once your chats are visible, come back here and press Enter.\n")
        
        input("Press Enter here ONLY AFTER you are fully logged in...")
        
        print("💾 Saving session data...")
        context.close() # Browser MUST be closed before zipping to release file locks

    # 3. Zipping the folder
    try:
        print(f"📦 Compressing '{session_dir}' into '{zip_filename}.zip'...")
        # make_archive(base_name, format, root_dir)
        shutil.make_archive(zip_filename, 'zip', session_dir)
        print(f"✨ Success! Your session is zipped and ready: {zip_filename}.zip")
    except Exception as e:
        print(f"❌ Failed to zip folder: {e}")

if __name__ == "__main__":
    create_whatsapp_session()