const statusDiv = document.getElementById('status');
const imageInput = document.getElementById('imageInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const scoreDiv = document.getElementById('score');
const categoryDiv = document.getElementById('category');
const progressBar = document.getElementById('progressBar');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let model;

async function loadModel(){
  statusDiv.textContent = "Загрузка модели...";
  model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);
  statusDiv.textContent = "Модель загружена! Загрузи фото.";
}
loadModel();

analyzeBtn.addEventListener('click', async ()=>{
  const file = imageInput.files[0];
  if(!file) return alert("Выберите изображение!");
  if(!model) return alert("Модель еще загружается.");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = async ()=>{
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);

    try{
      await analyzeFace(img);
    }catch(err){
      alert("Не удалось распознать лицо. Попробуйте другое фото.");
      console.error(err);
    }
  };
  img.src = URL.createObjectURL(file);
});

async function analyzeFace(img){
  const predictions = await model.estimateFaces({input:img,returnTensors:false,flipHorizontal:false});
  if(predictions.length===0) throw new Error("Лицо не найдено");

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

  // Вычисляем симметрию
  const eyeSym = 1-Math.abs(points.leftEye[0]-points.rightEye[0])/Math.abs(points.leftEye[0]+points.rightEye[0])*2;
  const noseSym = 1-Math.abs((points.leftEye[0]+points.rightEye[0])/2-points.nose[0])/Math.abs(points.rightEye[0]-points.leftEye[0]);
  const mouthSym = 1-Math.abs(points.leftMouth[0]-points.rightMouth[0])/Math.abs(points.rightMouth[0]+points.leftMouth[0])*2;
  const jawSym = 1-Math.abs(points.leftEye[1]-points.rightEye[1])/Math.abs(points.chin[1]);
  const browSym = 1-Math.abs(points.leftBrow[0]-points.rightBrow[0])/Math.abs(points.rightBrow[0]+points.leftBrow[0]);

  let score = (eyeSym+noseSym+mouthSym+jawSym+browSym)/5*10;
  score = Math.max(0,Math.min(score,10));

  let category;
  if(score<3) category="sub 3";
  else if(score<5) category="sub 5";
  else if(score<6) category="ltn";
  else if(score<7) category="mtn";
  else if(score<8) category="htn";
  else if(score<9) category="chadlite";
  else category="chad";

  scoreDiv.textContent = `Score: ${score.toFixed(2)} / 10`;
  categoryDiv.textContent = `Category: ${category}`;
  progressBar.style.width = `${score*10}%`;

  // Рисуем точки
  for(const key in points){
    const [x,y]=points[key];
    ctx.fillStyle='yellow';
    ctx.beginPath();
    ctx.arc(x,y,2,0,2*Math.PI);
    ctx.fill();
  }

  // Линии с градиентом
  ctx.lineWidth=1.5;
  drawLine(points.leftEye, points.nose);
  drawLine(points.rightEye, points.nose);
  drawLine(points.leftMouth, points.rightMouth);
  drawLine(points.leftBrow, points.rightBrow);
  drawLine(points.nose, points.chin);
}

function drawLine(p1,p2){
  const grad = ctx.createLinearGradient(p1[0],p1[1],p2[0],p2[1]);
  grad.addColorStop(0,'cyan');
  grad.addColorStop(1,'magenta');
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.moveTo(p1[0],p1[1]);
  ctx.lineTo(p2[0],p2[1]);
  ctx.stroke();
    }
