const input = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

input.addEventListener("change", () => {
  const file = input.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = () => {
    img.onload = () => {
      // Canvasサイズを画像に合わせる
      canvas.width = img.width;
      canvas.height = img.height;

      // 描画
      ctx.drawImage(img, 0, 0);
    };
    img.src = reader.result;
  };

  reader.readAsDataURL(file);
});
