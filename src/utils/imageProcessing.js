// utils/imageProcessing.js

/**
 * processImageToMask — converts uploaded image to binary mask.
 * Critically: stores xMin/xMax/yMin/yMax so isInMask works in the correct
 * physical coordinate space.
 *
 * Physical space for custom images:
 *   x ∈ [-imageWidthKm/2,  +imageWidthKm/2]
 *   y ∈ [0,                 imageHeightKm]
 *
 * White pixels (brightness > 128) = valid zone = 1
 * Black pixels                     = no-go zone  = 0
 */
export const processImageToMask = (img, setMask, params) => {
  const canvas = document.createElement('canvas');
  canvas.width  = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  const W = params?.imageWidthKm  ?? 60;
  const H = params?.imageHeightKm ?? 30;
  const iw = img.width, ih = img.height;

  // Build mask with y-axis flipped:
  // Image pixel row 0 = top of image = HIGH physical y (yMax)
  // Image pixel row ih-1 = bottom of image = LOW physical y (yMin=0)
  // isInMask maps physical y → pixel row as: iy = floor((y-yMin)/(yMax-yMin)*ih)
  // So physical y=0 → iy=0 → but we want that to be the BOTTOM of the image.
  // Fix: store the mask with rows reversed so row 0 = physical y=0 (bottom of image).
  const maskArray = new Array(iw * ih);
  for (let row = 0; row < ih; row++) {
    const flippedRow = ih - 1 - row;          // row 0 in mask = bottom of image
    for (let col = 0; col < iw; col++) {
      const srcIdx = (flippedRow * iw + col) * 4;
      const brightness = (data[srcIdx] + data[srcIdx+1] + data[srcIdx+2]) / 3;
      maskArray[row * iw + col] = brightness > 128 ? 1 : 0;
    }
  }

  setMask({
    data:   maskArray,
    width:  iw,
    height: ih,
    xMin: -(W / 2),
    xMax:   W / 2,
    yMin:  0,
    yMax:  H,
  });
};

export const handleImageUpload = (e, setImage, setMask, setUseDefaultSemicircle, params) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      setImage(event.target.result);
      processImageToMask(img, setMask, params);
      setUseDefaultSemicircle(false);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};