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

// Camera trigger
cameraBtn.addEventListener('click', () => cameraInput.click());

// Handle image selection
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
        // Step 1: Identify the plant
        // Note: In a production environment, you'd use an API like Plant.id
        // For this dev demo, we'll simulate the AI identification delay and result
        const plantData = await simulatePlantIdentification();
        
        // Step 2: Fetch data from Wikipedia
        await fetchWikipediaData(plantData.name);
        
    } catch (error) {
        alert("Something went wrong analyzing the image. Please try again.");
        showSection(uploadSection);
    }
});

async function simulatePlantIdentification() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For the demo, we'll simulate a few common results
    const mockResults = [
        { name: "Aloe Vera", confidence: "98%" },
        { name: "Lavender", confidence: "92%" },
        { name: "Monstera Deliciosa", confidence: "87%" },
        { name: "Basil", confidence: "95%" }
    ];
    return mockResults[Math.floor(Math.random() * mockResults.length)];
}

async function fetchWikipediaData(plantName) {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(plantName)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.query.search.length === 0) throw new Error("Not found");
        
        const pageTitle = searchData.query.search[0].title;
        currentPlantUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
        
        // Fetch page summary and image
        const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&piprop=original&pithumbsize=400&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        
        const pages = detailsData.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        // Update UI
        plantNameEl.innerText = pageTitle;
        plantDescEl.innerText = page.extract ? page.extract.substring(0, 200) + "..." : "No description available.";
        wikiImg.src = page.thumbnail ? page.thumbnail.source : "https://via.placeholder.com/400?text=No+Image";
        confidenceEl.innerText = "Match Found";
        
        loader.classList.add('hidden');
        resultContent.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        plantNameEl.innerText = "Unknown Plant";
        plantDescEl.innerText = "We couldn't find a Wikipedia match for this specific plant.";
        wikiImg.src = "https://via.placeholder.com/400?text=Not+Found";
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
