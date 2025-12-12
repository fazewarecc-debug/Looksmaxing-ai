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
let localPhotos = [];

async function loadModel() {
  model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);
  console.log("Модель загружена");
}
loadModel();

analyzeBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  if(!file) return alert("Выберите изображение!");
  if(!model) return alert("Модель еще загружается. Подождите...");

  const img = new Image();
  img.onload = async () => {
    try {
      const category = await analyzeFace(img);
      localPhotos.unshift({url: img.src, category});
      renderGallery();
    } catch (err) {
      alert("Не удалось распознать лицо. Попробуйте другое фото.");
      console.error(err);
    }
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
    addHoverAnimation(img);
  });
}

// Анимация при наведении
function addHoverAnimation(imgElement){
  imgElement.addEventListener('mouseenter', async () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgElement.src;
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      await analyzeFace(img); // отображаем точки и линии на основном canvas
    };
  });
  imgElement.addEventListener('mouseleave', () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
  });
}

// Анализ лица
async function analyzeFace(img) {
  const predictions = await model.estimateFaces({input:img,returnTensors:false,flipHorizontal:false});
  if(predictions.length===0) throw new Error("Лицо не найдено");

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0);

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

  // Обновляем UI
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

  // Рисуем точки
  for(const key in points){
    const [x,y]=points[key];
    ctx.fillStyle='yellow';
    ctx.beginPath();
    ctx.arc(x,y,2,0,2*Math.PI);
    ctx.fill();
  }

  // Линии с анимацией цвета
  ctx.lineWidth=1.5;
  drawAnimatedLine(points.leftEye, points.nose);
  drawAnimatedLine(points.rightEye, points.nose);
  drawAnimatedLine(points.leftMouth, points.rightMouth);
  drawAnimatedLine(points.leftBrow, points.rightBrow);
  drawAnimatedLine(points.nose, points.chin);

  return category;
}

// Линии с градиентом
function drawAnimatedLine(p1,p2){
  const grad = ctx.createLinearGradient(p1[0],p1[1],p2[0],p2[1]);
  grad.addColorStop(0,'cyan');
  grad.addColorStop(1,'magenta');
  ctx.strokeStyle=grad;
  ctx.beginPath();
  ctx.moveTo(p1[0],p1[1]);
  ctx.lineTo(p2[0],p2[1]);
  ctx.stroke();
      }
