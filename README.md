# USB-Ghost
USB Ghost is a stealthy USB tracking system that captures location, computer info, and webcam photos when your USB drive is plugged into any computer. Get instant email alerts and view everything on a beautiful midnight-purple admin dashboard.
A complete USB tracking system that tracks location, captures photos, and sends alerts when your USB drive is plugged into any computer.

## 📋 Features

- 📍 **Real-time Location Tracking** - Tracks city/country via IP address
- 📸 **Photo Capture** - Captures photo from webcam when USB is inserted
- 📧 **Email Alerts** - Instant email notification with location and photo
- 🔒 **Remote Lock** - Lock the computer remotely from dashboard
- 🖥️ **Admin Dashboard** - Beautiful hacker-style dashboard with maps
- 📊 **Data Export** - Export location history as CSV/Excel
- 🚀 **Portable Python** - Works on any Windows PC without Python installed
- 🔄 **Auto-Start** - Option to run tracker automatically on Windows startup
- 💾 **Normal USB Usage** - Keep your personal files alongside tracker

## 📱 Dashboard Access

Once deployed, access the dashboard at:
https://your-dashboard-url.vercel.app

text

**Default Login:**
- Username: `admin`
- Password: `admin123`

*You can change these credentials in `dashboard/script.js`*

## 🚀 Quick Start

### Prerequisites

1. **Supabase Account** (Free)
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your Project URL and Anon Key

2. **Gmail Account** (For Email Alerts)
   - Enable 2-Step Verification
   - Generate App Password from Google Account settings

3. **Python 3.10+** (Optional - tracker includes portable Python)

### Step 1: Setup Supabase Database

1. Create a new project in Supabase
2. Go to SQL Editor and run these queries:

```sql
-- Devices table
CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT UNIQUE NOT NULL,
    name TEXT,
    owner TEXT,
    status TEXT DEFAULT 'inactive',
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    city TEXT,
    country TEXT,
    ip_address TEXT,
    computer_name TEXT,
    os_info TEXT,
    camera_image TEXT,
    battery TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commands table (for remote lock)
CREATE TABLE commands (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT,
    command TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (for admin login)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin
INSERT INTO users (username, email, password) 
VALUES ('admin', 'admin@example.com', 'admin123');

-- Disable RLS for all tables
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE commands DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
Step 2: Configure Dashboard
Open dashboard/config.js

Replace with your Supabase credentials:

javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-anon-key";
Step 3: Deploy Dashboard to Vercel
bash
cd dashboard
vercel --prod
If you don't have Vercel CLI, install it first:

bash
npm install -g vercel
Step 4: Configure USB Tracker
Open usb-tracker/tracker.py

Replace with your Supabase credentials:

python
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"
Configure Email Alerts:

python
EMAIL_ENABLED = True
EMAIL_SENDER = "your-email@gmail.com"
EMAIL_PASSWORD = "your-app-password"  # 16-digit app password from Gmail
EMAIL_RECEIVER = "receiver-email@gmail.com"
Step 5: Setup USB Drive
Format USB drive as NTFS

Copy the usb-tracker folder to USB drive

Copy all .bat files to USB root

Create a folder My_Files for your personal files

Final USB structure:

text
D:\
├── My_Files\              (Your personal files)
├── usb-tracker\           (Tracker files)
│   └── tracker.py
├── run.bat                (Manual run)
├── add_to_startup.bat     (Auto-start setup)
└── remove_from_startup.bat
🖥️ Using the USB Tracker
One-Time Setup (On Your Computer)
Insert USB drive

Open USB drive

Double-click add_to_startup.bat

Tracker will now run automatically on every startup

Manual Run
Insert USB drive

Double-click run.bat

Tracker will run and send data to dashboard

Remove from Startup
Double-click remove_from_startup.bat

📧 Email Alert Format
When USB is inserted, you'll receive an email with:

text
Subject: 🔌 USB TRACKER ALERT - USB-001

📍 LOCATION: City, Country
💻 COMPUTER: Computer-Name
🕐 TIME: 2024-01-15 14:30:25
📸 PHOTO: Attached
🔒 Remote Lock Command
Login to dashboard

Find your device in "REGISTERED DEVICES"

Click "LOCK" button

Next time USB is inserted, the computer will lock

📊 Dashboard Features
Interactive Map - Shows last location of each USB

Location Logs - Complete history with timestamps

Photo Gallery - All captured photos with delete option

Analytics - Location statistics and daily activity

Data Export - Download CSV/Excel reports

🛠️ Troubleshooting
Tracker not running?
Make sure USB drive is formatted as NTFS

Check if antivirus is blocking

Run run.bat manually to see error messages

No email received?
Check spam folder

Verify Gmail App Password (16-digit, no spaces)

Make sure internet is connected

Dashboard not showing data?
Check Supabase table has data

Verify API keys in config.js

Open browser console (F12) for errors

Camera not working?
Make sure webcam is connected

Check if antivirus is blocking camera access

Run tracker without camera (photo will be skipped)

🔧 Customization
Change Admin Password
Edit dashboard/script.js:

javascript
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";  // Change this
Change Device ID Auto-Format
Edit usb-tracker/tracker.py:

python
USB_DEVICE_ID = f"USB-{USB_SERIAL[-8:]}"  # Change format here
Disable Email Alerts
python
EMAIL_ENABLED = False
Change Dashboard Colors
Edit dashboard/style.css and modify the purple theme colors (#9c50ff)

📁 Project Structure
text
usb-tracker-project/
├── README.md
├── dashboard/
│   ├── index.html          # Main dashboard
│   ├── style.css           # Hacker theme styles
│   ├── script.js           # Dashboard logic
│   └── config.js           # Supabase config
└── usb-tracker/
    ├── tracker.py          # Main tracker script
    ├── run.bat             # Manual run
    ├── add_to_startup.bat  # Auto-start setup
    └── remove_from_startup.bat
⚙️ Requirements


## 📦 Required Libraries

### USB Tracker (Python)

Use CMD
Using System Python**
```bash
pip install requests opencv-python psutil pillow numpy


Python 3.10+ (for development, portable included)

Node.js (for Vercel deployment)

Supabase Account (free)

Gmail Account (for email alerts)

📝 How to Get App Password from Gmail
Go to your Google Account settings

Security → 2-Step Verification (must be enabled)

Search for "App Passwords"

Select app: "Mail", device: "Other"

Enter name: "USB Tracker"

Click Generate

Copy the 16-digit password (spaces will be there, remove them)

🌐 Deploy Dashboard to Vercel
bash
# Install Vercel CLI
npm install -g vercel

# Navigate to dashboard folder
cd dashboard

# Deploy
vercel --prod

# Follow prompts
# When asked, set up and deploy: Y
# Project name: usb-tracker-dashboard
📱 Mobile Access
Dashboard works on mobile browsers. You can:

Bookmark the URL

Create a QR code for easy sharing

Add to home screen as a web app

🔐 Security Notes
Change default admin password immediately

Keep your Supabase keys secure

Use app password for Gmail, not your main password

Dashboard uses HTTPS automatically on Vercel

📊 Performance
Location tracking: 10-30 seconds

Email delivery: 30-60 seconds

Dashboard updates: Real-time (10-second auto-refresh)

Photo size: ~100-200KB per photo

🤝 Contributing
Feel free to fork and improve this project. Pull requests welcome!

📧 Support
For issues:

Check troubleshooting section above

Check browser console for errors

Verify all credentials are correct

Open an issue on GitHub

📝 License
This project is open source. Feel free to modify and use.

Made with 🔌 by USB Tracker Project




