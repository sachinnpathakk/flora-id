const fileInput = document.getElementById('file-input');
const cameraInput = document.getElementById('camera-input');
const cameraBtn = document.getElementById('camera-btn');
const identifyBtn = document.getElementById('identify-btn');
const resetBtn = document.getElementById('reset-btn');
const confirmBtn = document.getElementById('confirm-btn');
const retryBtn = document.getElementById('retry-btn');

const uploadSection = document.getElementById('upload-section');
const previewSection = document.getElementById('preview-section');
const resultSection = document.getElementById('result-section');
const resultContent = document.getElementById('result-content');
const loader = document.getElementById('loader');

const imagePreview = document.getElementById('image-preview');
const userImgSmall = document.getElementById('user-img-small');
const wikiImg = document.getElementById('wiki-img');
const plantNameEl = document.getElementById('plant-name');
const plantDescEl = document.getElementById('plant-desc');
const confidenceEl = document.getElementById('confidence');

let currentPlantUrl = "";
const API_KEY = "2b10MZl1ODGJMGCwky6iPXpWu";

cameraBtn.addEventListener('click', () => cameraInput.click());

[fileInput, cameraInput].forEach(input => {
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                userImgSmall.src = event.target.result;
                showSection(previewSection);
            };
            reader.readAsDataURL(file);
        }
    });
});

resetBtn.addEventListener('click', () => {
    showSection(uploadSection);
    fileInput.value = "";
    cameraInput.value = "";
});

identifyBtn.addEventListener('click', async () => {
    showSection(resultSection);
    loader.classList.remove('hidden');
    resultContent.classList.add('hidden');

    try {
        const plantData = await identifyPlant();
        await fetchWikipediaData(plantData.name, plantData.confidence);
    } catch (error) {
        console.error(error);
        alert("Identification failed. Please try a clearer photo.");
        showSection(uploadSection);
    }
});

async function identifyPlant() {
    const imageSrc = imagePreview.src;
    const base64Image = imageSrc.split(',')[1];

    const response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Key': API_KEY
        },
        body: JSON.stringify({
            images: [base64Image],
            similar_images: true
        })
    });

    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    const suggestion = data.suggestions[0].plant_details;
    const confidence = data.suggestions[0].probability * 100;

    return {
        name: suggestion.common_names[0] || suggestion.scientific_name,
        confidence: Math.round(confidence) + "%"
    };
}

async function fetchWikipediaData(plantName, confidence) {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(plantName)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.query.search.length === 0) throw new Error("Not found");
        
        const pageTitle = searchData.query.search[0].title;
        currentPlantUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
        
        const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&piprop=original&pithumbsize=400&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        
        const pages = detailsData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        plantNameEl.innerText = pageTitle;
        plantDescEl.innerText = page.extract ? page.extract.substring(0, 200) + "..." : "No description available.";
        wikiImg.src = page.thumbnail ? page.thumbnail.source : "https://via.placeholder.com/400?text=No+Image";
        confidenceEl.innerText = confidence + " Match";
        
        loader.classList.add('hidden');
        resultContent.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        plantNameEl.innerText = "Plant Identified";
        plantDescEl.innerText = "We identified the plant, but couldn't find a matching Wikipedia page.";
        wikiImg.src = "https://via.placeholder.com/400?text=No+Wiki+Image";
        confidenceEl.innerText = confidence + " Match";
        loader.classList.add('hidden');
        resultContent.classList.remove('hidden');
    }
}

confirmBtn.addEventListener('click', () => {
    if (currentPlantUrl) {
        window.open(currentPlantUrl, '_blank');
    }
});

retryBtn.addEventListener('click', () => {
    showSection(uploadSection);
});

function showSection(section) {
    uploadSection.classList.add('hidden');
    previewSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    section.classList.remove('hidden');
}
