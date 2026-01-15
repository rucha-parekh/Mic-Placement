// utils/imageProcessing.js

export const processImageToMask = (img, setMask) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  const maskArray = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    maskArray.push(brightness > 128 ? 1 : 0);
  }
  
  setMask({ data: maskArray, width: img.width, height: img.height });
};

export const handleImageUpload = (e, setImage, setMask, setUseDefaultSemicircle) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(event.target.result);
        processImageToMask(img, setMask);
        setUseDefaultSemicircle(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};