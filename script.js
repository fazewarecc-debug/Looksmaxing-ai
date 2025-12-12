const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultDiv = document.getElementById('result');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

analyzeBtn.addEventListener('click', () => {
    const file = imageInput.files[0];
    if (!file) return alert("Выберите изображение!");
    
    const img = new Image();
    img.onload = () => analyzeFace(img);
    img.src = URL.createObjectURL(file);
});

function analyzeFace(img) {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Простейшая "оценка симметрии": будем использовать центр изображения и размеры лица
    const symmetryScore = Math.random() * 10; // Заглушка для примера, заменяется реальной AI логикой

    // Категории
    let category;
    if (symmetryScore < 3) category = "sub 3";
    else if (symmetryScore < 5) category = "sub 5";
    else if (symmetryScore < 6) category = "ltn";
    else if (symmetryScore < 7) category = "mtn";
    else if (symmetryScore < 8) category = "htn";
    else if (symmetryScore < 9) category = "chadlite";
    else category = "chad";

    resultDiv.innerHTML = `
        Score: ${symmetryScore.toFixed(2)} / 10 <br>
        Category: ${category}
    `;
}
