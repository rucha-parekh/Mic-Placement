export const processImageToMask = (img, setMask, params) => {
  const W = params?.imageWidthKm ?? 60;
  const H = params?.imageHeightKm ?? 30;

  const targetAspect = W / H;
  const imgAspect = img.width / img.height;

  let newWidth, newHeight;

  if (imgAspect > targetAspect) {
    newWidth = img.width;
    newHeight = img.width / targetAspect;
  } else {
    newHeight = img.height;
    newWidth = img.height * targetAspect;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(newWidth);
  canvas.height = Math.round(newHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offsetX = (canvas.width - img.width) / 2;
  const offsetY = (canvas.height - img.height) / 2;

  ctx.drawImage(img, offsetX, offsetY);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const iw = canvas.width;
  const ih = canvas.height;

  const maskArray = new Array(iw * ih);

  for (let row = 0; row < ih; row++) {
    const flippedRow = ih - 1 - row;

    for (let col = 0; col < iw; col++) {
      const srcIdx = (flippedRow * iw + col) * 4;

      const brightness =
        (data[srcIdx] +
          data[srcIdx + 1] +
          data[srcIdx + 2]) / 3;

      maskArray[row * iw + col] = brightness > 128 ? 1 : 0;
    }
  }

  setMask({
    data: maskArray,
    width: iw,
    height: ih,
    xMin: -(W / 2),
    xMax: W / 2,
    yMin: 0,
    yMax: H,
  });
};

export const handleImageUpload = (
  e,
  setImage,
  setMask,
  setUseDefaultSemicircle,
  setImageObj,
  params
) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    const img = new Image();

    img.onload = () => {
      // ✅ store BOTH
      setImage(event.target.result); // base64 (for UI)
      setImageObj(img);              // actual image object (for processing)

      processImageToMask(img, setMask, params);
      setUseDefaultSemicircle(false);
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
};