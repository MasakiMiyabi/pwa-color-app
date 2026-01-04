const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

// カメラ起動
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" },
  audio: false
})
.then(stream => {
  video.srcObject = stream;
})
.catch(err => {
  alert("Camera access failed: " + err);
});
document.getElementById("capture").addEventListener("click", () => {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

 // G値の平均
  let gSum = 0;
  const pixelCount = data.length / 4;
  for(let i=0;i<data.length;i+=4) gSum += data[i+1];
  const meanG = Math.round(gSum / pixelCount);
  
 // 補正
  const correctedG = applyModelG(meanG, bestCoeff, bestModel);

  result.textContent = `G: ${meanG}, Corrected G: ${correctedG}`;
});

// 実測G値（カメラで撮影した参照色）
const refMeasuredG = [110, 200, 290, 380]; 

// 理論G値
const refTheoreticalG = [100, 200, 300, 400]; 
// --- 多項式回帰（線形・二次・三次） ---
function fitPolynomialG(x, y, type="linear") {
    const n = x.length;
    let coeff;

    if(type === "linear"){
        // y = a*x + b
        const xMean = x.reduce((a,b)=>a+b,0)/n;
        const yMean = y.reduce((a,b)=>a+b,0)/n;
        let num = 0, den = 0;
        for(let i=0;i<n;i++){
            num += (x[i]-xMean)*(y[i]-yMean);
            den += (x[i]-xMean)**2;
        }
        const a = num/den;
        const b = yMean - a*xMean;
        coeff = [a,b];
    } 
    else if(type === "quadratic"){
        coeff = polyRegression(x, y, 2); // 下で定義する
    } 
    else if(type === "cubic"){
        coeff = polyRegression(x, y, 3);
    }
    return coeff;
}

// --- 決定係数 R² ---
function calculateR2G(x, y, coeff, type="linear") {
    let yPred = [];
    for(let i=0;i<x.length;i++){
        let pred;
        if(type==="linear") pred = coeff[0]*x[i] + coeff[1];
        else if(type==="quadratic") pred = coeff[0]*x[i]**2 + coeff[1]*x[i] + coeff[2];
        else if(type==="cubic") pred = coeff[0]*x[i]**3 + coeff[1]*x[i]**2 + coeff[2]*x[i] + coeff[3];
        yPred.push(pred);
    }
    const yMean = y.reduce((a,b)=>a+b,0)/y.length;
    let ss_res=0, ss_tot=0;
    for(let i=0;i<y.length;i++){
        ss_res += (y[i]-yPred[i])**2;
        ss_tot += (y[i]-yMean)**2;
    }
    return 1 - ss_res/ss_tot;
}

// --- 最適モデル判定 ---
function fitBestModelG(x, y){
    const models = ["linear","quadratic","cubic"];
    let bestR2 = -Infinity;
    let bestModel = null;
    let bestCoeff = null;
    models.forEach(m=>{
        const c = fitPolynomialG(x, y, m);
        const r2 = calculateR2G(x, y, c, m);
        if(r2>bestR2){
            bestR2=r2;
            bestModel=m;
            bestCoeff=c;
        }
    });
    return {bestModel, bestCoeff, R2: bestR2};
}

// --- 補正関数（G値用） ---
function applyModelG(value, coeff, type){
    let corrected;
    if(type==="linear") corrected = coeff[0]*value + coeff[1];
    else if(type==="quadratic") corrected = coeff[0]*value**2 + coeff[1]*value + coeff[2];
    else if(type==="cubic") corrected = coeff[0]*value**3 + coeff[1]*value**2 + coeff[2]*value + coeff[3];
    return corrected;
}


