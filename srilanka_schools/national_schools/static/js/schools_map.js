// schools_map.js

/**
 * This script initializes a Leaflet map to display national schools in Sri Lanka.
 * It provides functionality for filtering schools by province, district, education zone, and division.
 */

// Define a global variable to hold the complete dataset of schools loaded from the CSV.
let schoolsData;

// Define the SW and NE coordinates of Sri Lanka to set the map's boundaries.
const southWest = L.latLng(5.5, 79.5);
const northEast = L.latLng(10.0, 81.0);
const bounds = L.latLngBounds(southWest, northEast);

// Initialize Leaflet map and set the initial view.
const map = L.map('map', {
    minZoom: 7.42 // This restricts the user from zooming out too far.
}).setView([7.8, 80.87], 7.46);

// Add the OpenStreetMap tile layer to the map.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Use a FeatureGroup to manage all school markers.
/**
 * A group to hold all school markers, making it easy to clear them from the map.
 */
const schoolMarkersGroup = L.featureGroup().addTo(map);

// Define a custom icon for markers
/**
 * A custom icon with a smaller size for the school markers.
 */
const smallIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [0, -32],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [30, 30]
});

/**
 * Adds markers to the map from a given data array.
 */
function addMarkersFromData(data) {
    // Clear all existing markers from the map.
    schoolMarkersGroup.clearLayers();

    // Iterate over each school data row to create a marker.
    data.forEach(row => {
        const lat = parseFloat(row.Latitude || row.latitude);
        const lon = parseFloat(row.Longitude || row.longitude);

        if (!isNaN(lat) && !isNaN(lon)) {
            // Create a new marker and add a click event listener.
            L.marker([lat, lon], { icon: smallIcon })
                // Popup appears when clicked
                .bindPopup(`
                    <strong>${row.School_Name || "Unnamed"}</strong><br>
                    <hr style="margin: 5px 0;">
                    <strong>Address:</strong> ${row['School Address'] || "No Address"}<br>
                    <strong>Province:</strong> ${row.Province || "No Province"}<br>
                    <strong>District:</strong> ${row.District || "No District"}<br>
                    <strong>Education Zone:</strong> ${row.Zone || "No Zone"}<br>
                    <strong>Education Division:</strong> ${row['Education Division'] || "No Division"}<br>
                    <strong>School Type:</strong> ${row.Type || "No Type"}<br>
                    <strong>Medium of Instruction:</strong> ${row.Medium || "No Medium"}
                `)
                .addTo(schoolMarkersGroup);
        } else {
            console.warn('Invalid coordinates for a school:', row);
        }
    });
}

/**
 * Populates all filter dropdowns with unique values from the dataset.
 * The function updates dropdowns based on the selected value of the previous dropdown in the hierarchy.
 */
function populateFilters(data = schoolsData, level = 'province') {
    const provinceSelect = document.getElementById('province-select');
    const districtSelect = document.getElementById('district-select');
    const zoneSelect = document.getElementById('zone-select');
    const divisionSelect = document.getElementById('division-select');

    if (level === 'province') {
        const provinces = [...new Set(data.map(s => s.Province))].filter(Boolean).sort();
        provinces.forEach(p => provinceSelect.add(new Option(p, p)));
    }

    if (level === 'province' || level === 'district') {
        const selectedProvince = provinceSelect.value;
        const districtData = selectedProvince === 'all' ? schoolsData : schoolsData.filter(s => s.Province === selectedProvince);
        const districts = [...new Set(districtData.map(s => s.District))].filter(Boolean).sort();
        districtSelect.innerHTML = '<option value="all">All Districts</option>';
        districts.forEach(d => districtSelect.add(new Option(d, d)));
    }

    if (level === 'province' || level === 'district' || level === 'zone') {
        const selectedDistrict = districtSelect.value;
        const zoneData = selectedDistrict === 'all' ? schoolsData : schoolsData.filter(s => s.District === selectedDistrict);
        const zones = [...new Set(zoneData.map(s => s.Zone))].filter(Boolean).sort();
        zoneSelect.innerHTML = '<option value="all">All Zones</option>';
        zones.forEach(z => zoneSelect.add(new Option(z, z)));
    }

    if (level === 'province' || level === 'district' || level === 'zone' || level === 'division') {
        const selectedZone = zoneSelect.value;
        const divisionData = selectedZone === 'all' ? schoolsData : schoolsData.filter(s => s.Zone === selectedZone);
        const divisions = [...new Set(divisionData.map(s => s['Education Division']))].filter(Boolean).sort();
        divisionSelect.innerHTML = '<option value="all">All Divisions</option>';
        divisions.forEach(d => divisionSelect.add(new Option(d, d)));
    }
}

/**
 * Filters the map markers based on the current selections in the dropdown menus.
 * It also triggers the repopulation of downstream filter options to ensure they are relevant.
 */
function filterMarkers() {
    const selectedProvince = document.getElementById('province-select').value;
    const selectedDistrict = document.getElementById('district-select').value;
    const selectedZone = document.getElementById('zone-select').value;
    const selectedDivision = document.getElementById('division-select').value;

    const filteredData = schoolsData.filter(school => {
        const matchesProvince = (selectedProvince === 'all' || school.Province === selectedProvince);
        const matchesDistrict = (selectedDistrict === 'all' || school.District === selectedDistrict);
        const matchesZone = (selectedZone === 'all' || school.Zone === selectedZone);
        const matchesDivision = (selectedDivision === 'all' || school['Education Division'] === selectedDivision);

        return matchesProvince && matchesDistrict && matchesZone && matchesDivision;
    });

    addMarkersFromData(filteredData);

    // This block handles the cascade effect on the filters
    if (this && this.id) {
        if (this.id === 'province-select') populateFilters(schoolsData.filter(s => s.Province === selectedProvince), 'district');
        if (this.id === 'district-select') populateFilters(schoolsData.filter(s => s.District === selectedDistrict), 'zone');
        if (this.id === 'zone-select') populateFilters(schoolsData.filter(s => s.Zone === selectedZone), 'division');
    }
}

/**
 * Resets all filter dropdowns to the "All" option and re-populates the map with all markers.
 */
function clearAllFilters() {
    document.getElementById('province-select').value = 'all';
    document.getElementById('district-select').value = 'all';
    document.getElementById('zone-select').value = 'all';
    document.getElementById('division-select').value = 'all';

    populateFilters();
    filterMarkers();
}

// Define the path to your CSV file
const csvFileUrl = '/static/data/geocoded_schools_national.csv';

// This event listener ensures the script runs after the HTML is ready.
document.addEventListener('DOMContentLoaded', () => {

    // Load and parse the CSV file directly using PapaParse.
    // PapaParse handles downloading the file and parsing its content.
    Papa.parse(csvFileUrl, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                schoolsData = results.data;
                populateFilters();
                addMarkersFromData(schoolsData);
            } else {
                console.warn("The CSV file is empty or could not be parsed.");
            }
        },
        error: function(err) {
            console.error("Error parsing CSV: " + err.message, err);
        }
    });

    // Add event listeners for filter dropdowns to trigger marker filtering.
    document.getElementById('province-select').addEventListener('change', filterMarkers);
    document.getElementById('district-select').addEventListener('change', filterMarkers);
    document.getElementById('zone-select').addEventListener('change', filterMarkers);
    document.getElementById('division-select').addEventListener('change', filterMarkers);

    // Event listener for the clear filters button.
    const clearButton = document.getElementById('clear-filters-btn');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllFilters);
    } else {
        console.warn("Could not find the 'clear-filters-btn' element.");
    }
});