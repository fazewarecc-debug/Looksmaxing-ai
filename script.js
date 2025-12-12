const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const scoreDiv = document.getElementById('score');
const categoryDiv = document.getElementById('category');
const progressBar = document.getElementById('progressBar');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const photoGallery = document.getElementById('photoGallery');
const filterCategory = document.getElementById('filterCategory');

let model;
let localPhotos = []; // локальная галерея

async function loadModel() {
  model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  if(!file) return alert("Выберите изображение!");

  const img = new Image();
  img.onload = async () => {
    const category = await analyzeFace(img);
    // Сохраняем локально
    localPhotos.unshift({url: img.src, category});
    renderGallery();
  };
  img.src = URL.createObjectURL(file);
});

filterCategory.addEventListener('change', renderGallery);

function renderGallery() {
  const cat = filterCategory.value;
  photoGallery.innerHTML = '';
  let photos = localPhotos;
  if(cat !== 'all') photos = photos.filter(p => p.category === cat);
  photos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'photoItem';
    const img = document.createElement('img');
    img.src = p.url;
    div.appendChild(img);
    photoGallery.appendChild(div);
  });
}

async function analyzeFace(img) {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0);

  const predictions = await model.estimateFaces({input:img,returnTensors:false,flipHorizontal:false});
  if(predictions.length===0) return alert("Лицо не найдено");

  const keypoints = predictions[0].scaledMesh;
  const points = {
    leftEye: keypoints[33],
    rightEye: keypoints[263],
    nose: keypoints[1],
    leftMouth: keypoints[61],
    rightMouth: keypoints[291],
    chin: keypoints[152],
    leftBrow: keypoints[70],
    rightBrow: keypoints[300]
  };

  const eyeSym = 1-Math.abs(points.leftEye[0]-points.rightEye[0])/Math.abs(points.leftEye[0]+points.rightEye[0])*2;
  const noseSym = 1-Math.abs((points.leftEye[0]+points.rightEye[0])/2-points.nose[0])/Math.abs(points.rightEye[0]-points.leftEye[0]);
  const mouthSym = 1-Math.abs(points.leftMouth[0]-points.rightMouth[0])/Math.abs(points.rightMouth[0]+points.leftMouth[0])*2;
  const jawSym = 1-Math.abs(points.leftEye[1]-points.rightEye[1])/Math.abs(points.chin[1]);
  const browSym = 1-Math.abs(points.leftBrow[0]-points.rightBrow[0])/Math.abs(points.rightBrow[0]+points.leftBrow[0]);

  let symmetryScore = (eyeSym+noseSym+mouthSym+jawSym+browSym)/5*10;
  symmetryScore = Math.max(0,Math.min(symmetryScore,10));

  let category;
  if(symmetryScore<3) category="sub 3";
  else if(symmetryScore<5) category="sub 5";
  else if(symmetryScore<6) category="ltn";
  else if(symmetryScore<7) category="mtn";
  else if(symmetryScore<8) category="htn";
  else if(symmetryScore<9) category="chadlite";
  else category="chad";

  // Обновление интерфейса
  scoreDiv.textContent = `Score: ${symmetryScore.toFixed(2)} / 10`;
  categoryDiv.textContent = `Category: ${category}`;
  progressBar.style.width = `${symmetryScore*10}%`;
  if(symmetryScore<3) progressBar.style.background='#ff4d4d';
  else if(symmetryScore<5) progressBar.style.background='#ff944d';
  else if(symmetryScore<6) progressBar.style.background='#ffde4d';
  else if(symmetryScore<7) progressBar.style.background='#a6ff4d';
  else if(symmetryScore<8) progressBar.style.background='#4dff4d';
  else if(symmetryScore<9) progressBar.style.background='#4dffb8';
  else progressBar.style.background='#4dffff';

  // Рисуем точки и линии
  for(const key in points){
    const [x,y]=points[key];
    ctx.fillStyle='yellow';
    ctx.beginPath();
    ctx.arc(x,y,2,0,2*Math.PI);
    ctx.fill();
  }

  ctx.strokeStyle='cyan';
  ctx.lineWidth=1.5;
  drawLine(points.leftEye, points.nose);
  drawLine(points.rightEye, points.nose);
  drawLine(points.leftMouth, points.rightMouth);
  drawLine(points.leftBrow, points.rightBrow);
  drawLine(points.nose, points.chin);

  return category;
}

function drawLine(p1,p2){
  ctx.beginPath();
  ctx.moveTo(p1[0],p1[1]);
  ctx.lineTo(p2[0],p2[1]);
  ctx.stroke();
                 }    });

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
