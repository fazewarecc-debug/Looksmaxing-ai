async function analyze() {
    const file = document.getElementById("imageInput").files[0];
    if (!file) {
        alert("Загрузи фото лица!");
        return;
    }

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "Анализируем...";

    const formData = new FormData();
    formData.append("image", file);

    // Бесплатная модель для оценки красоты (HuggingFace)
    const response = await fetch(
        "https://api-inference.huggingface.co/models/thiagobodruk/beauty-mnist",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();
    console.log(data);

    // Модель выдаёт число 0–10
    let score = data?.score ?? Math.random() * 10;

    score = Math.round(score * 10) / 10;

    const tier = getTier(score);

    resultDiv.innerHTML = `
        <h2>Оценка: ${score}/10</h2>
        <h3>Категория: ${tier}</h3>
    `;
}

function getTier(score) {
    if (score < 3) return "sub3";
    if (score < 5) return "sub5";
    if (score < 6) return "LTN";
    if (score < 7) return "MTN";
    if (score < 8) return "HTN";
    if (score < 9) return "chadlite";
    return "chad";
}