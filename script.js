const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultDiv = document.getElementById('result');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let model;

// Загружаем модель
async function loadModel() {
    model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
    console.log("Модель загружена");
}

loadModel();

analyzeBtn.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) return alert("Выберите изображение!");
    
    const img = new Image();
    img.onload = async () => await analyzeFace(img);
    img.src = URL.createObjectURL(file);
});

async function analyzeFace(img) {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const predictions = await model.estimateFaces({
        input: img,
        returnTensors: false,
        flipHorizontal: false
    });

    if (predictions.length === 0) {
        resultDiv.innerHTML = "Лицо не найдено. Попробуйте другое фото.";
        return;
    }

    // Берем первое лицо
    const keypoints = predictions[0].scaledMesh;

    // Простая симметрия: сравниваем горизонтальные координаты глаз
    const leftEye = keypoints[33];  // левый глаз
    const rightEye = keypoints[263]; // правый глаз
    const nose = keypoints[1];       // нос

    const eyeDistance = Math.abs(leftEye[0] - rightEye[0]);
    const leftEyeOffset = Math.abs(leftEye[0] - nose[0]);
    const rightEyeOffset = Math.abs(rightEye[0] - nose[0]);

    let symmetry = 10 - Math.abs(leftEyeOffset - rightEyeOffset)/eyeDistance * 10;
    symmetry = Math.max(0, Math.min(symmetry, 10)); // ограничим 0–10

    // Категории
    let category;
    if (symmetry < 3) category = "sub 3";
    else if (symmetry < 5) category = "sub 5";
    else if (symmetry < 6) category = "ltn";
    else if (symmetry < 7) category = "mtn";
    else if (symmetry < 8) category = "htn";
    else if (symmetry < 9) category = "chadlite";
    else category = "chad";

    resultDiv.innerHTML = `
        Score: ${symmetry.toFixed(2)} / 10 <br>
        Category: ${category}
    `;
}
