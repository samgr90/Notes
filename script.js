// Global array to store hotspot data
let hotspots = [];

// --- 1. Load Image Logic ---
function loadImage() {
    const url = document.getElementById('imageUrl').value.trim();
    if (!url) {
        alert("Please enter a valid image URL.");
        return;
    }
    const img = document.getElementById('interactive-image');
    const container = document.getElementById('image-container');
    
    // Reset previous state
    img.src = url;
    img.style.display = 'block';
    container.querySelectorAll('.hotspot-marker').forEach(m => m.remove());
    hotspots = [];
    document.getElementById('hotspot-list').innerHTML = '<p style="color: #666;">Click on the image to add hotspots.</p>';
    document.getElementById('config-output').textContent = 'The generated config will appear here.';
}

// --- 2. Hotspot Click and Coordinate Calculation ---
document.getElementById('image-container').addEventListener('click', function(event) {
    const img = document.getElementById('interactive-image');
    if (img.style.display === 'none' || img.src === '') return;

    // Get click position relative to the image container
    const containerRect = this.getBoundingClientRect();
    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top;

    // Calculate normalized coordinates (0 to 1)
    const normalizedX = clickX / img.clientWidth;
    const normalizedY = clickY / img.clientHeight;

    // *** Conversion from 2D (Normalized) to 3D (Yaw, Pitch) ***
    // Yaw: Maps [0, 1] to [-180, 180] degrees
    const yaw = (normalizedX * 360) - 180; 
    // Pitch: Maps [0, 1] to [90, -90] degrees (90 is top, -90 is bottom)
    const pitch = 90 - (normalizedY * 180);  
    
    const hotspotId = hotspots.length + 1;

    const newHotspot = {
        pitch: pitch.toFixed(4),
        yaw: yaw.toFixed(4),
        type: "info", // Default type for Pannellum
        text: `Point ${hotspotId} Info`, // Default text
    };

    hotspots.push(newHotspot);
    
    // Add visual marker
    addMarker(clickX, clickY, hotspotId);
    
    // Update the list display
    updateHotspotList(newHotspot, hotspotId);
});

function addMarker(x, y, id) {
    const marker = document.createElement('div');
    marker.className = 'hotspot-marker';
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.dataset.hotspotIndex = id - 1; 
    document.getElementById('image-container').appendChild(marker);
}

function updateHotspotList(hotspot, id) {
    const list = document.getElementById('hotspot-list');
    if (list.querySelector('p')) {
        list.innerHTML = ''; // Clear placeholder text
    }

    const listItem = document.createElement('div');
    listItem.className = 'hotspot-item';
    listItem.innerHTML = `
        <strong>Hotspot ${id}</strong><br>
        Yaw: ${hotspot.yaw}, Pitch: ${hotspot.pitch}<br>
        Text: <input type="text" value="${hotspot.text}" onchange="updateHotspotText(${id-1}, this.value)">
    `;
    list.appendChild(listItem);
}

window.updateHotspotText = function(index, newText) {
    // Updates the text property in the global hotspots array
    if (hotspots[index]) {
        hotspots[index].text = newText;
    }
}

// --- 3. Generate and Display JSON Config ---
function generateConfig() {
    if (hotspots.length === 0) {
        document.getElementById('config-output').textContent = "Error: Please define at least one hotspot.";
        return;
    }

    const panoramaUrl = document.getElementById('imageUrl').value.trim();

    const config = {
        "default": {
            "firstScene": "scene1",
            "author": "Hotspot Config Generator",
            "autoLoad": true
        },
        "scenes": {
            "scene1": {
                "type": "equirectangular",
                "panorama": panoramaUrl,
                "hotspots": hotspots.map(h => ({
                    "pitch": parseFloat(h.pitch),
                    "yaw": parseFloat(h.yaw),
                    "type": h.type,
                    "text": h.text,
                    // Optionally, add a "sceneId" for link hotspots:
                    // "sceneId": "nextScene"
                }))
            }
        }
    };
    
    const configJsonString = JSON.stringify(config, null, 4); // Format nicely
    document.getElementById('config-output').textContent = configJsonString;
}

// --- 4. Copy Functionality ---
function copyConfig() {
    const outputElement = document.getElementById('config-output');
    
    // Ensure config is generated first
    if (outputElement.textContent.includes("generated config will appear here") || outputElement.textContent.includes("Error")) {
        generateConfig();
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(outputElement.textContent)
        .then(() => {
            alert('Config copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy. Please manually select and copy the text.');
        });
}