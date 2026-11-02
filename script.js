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
let model = null;

// Load the AI model immediately when the page opens
async function loadModel() {
    try {
        model = await mobilenet.load();
        console.log("AI Model Loaded Successfully!");
    } catch (e) {
        console.error("Model failed to load", e);
    }
}
loadModel();

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
    if (!model) {
        alert("AI is still waking up... please wait a few seconds and try again!");
        return;
    }

    showSection(resultSection);
    loader.classList.remove('hidden');
    resultContent.classList.add('hidden');

    try {
        // REAL AI IDENTIFICATION HAPPENING HERE
        const predictions = await model.classify(imagePreview);
        
        // Get the top result
        const topResult = predictions[0];
        const plantName = topResult.className.split(',')[0]; // Get the main name
        const confidence = Math.round(topResult.probability * 100) + "%";
        
        await fetchWikipediaData(plantName, confidence);
    } catch (error) {
        console.error(error);
        alert("AI could not read the image. Try a clearer photo!");
        showSection(uploadSection);
    }
});

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
        plantNameEl.innerText = "Object Identified";
        plantDescEl.innerText = "The AI identified the object, but Wikipedia has no direct page for it.";
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
