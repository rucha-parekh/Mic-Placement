export const createDefaultSemicircleMask = (radius) => {
  const width = 200;
  const height = 200;
  const maskArray = [];
  
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = (i / width) * 60 - 30;
      const y = (j / height) * 30;
      const dist = Math.sqrt(x * x + y * y);
      maskArray.push(dist <= radius && y >= 0 ? 1 : 0);
    }
  }
  
  return { data: maskArray, width, height };
};

export const isInMask = (x, y, maskData) => {
  if (!maskData) return true;
  const ix = Math.floor((x + 30) / 60 * maskData.width);
  const iy = Math.floor(y / 30 * maskData.height);
  if (ix < 0 || ix >= maskData.width || iy < 0 || iy >= maskData.height) return false;
  return maskData.data[iy * maskData.width + ix] === 1;
};

export const randomInMask = (maskData) => {
  for (let attempts = 0; attempts < 100; attempts++) {
    const x = Math.random() * 60 - 30;
    const y = Math.random() * 30;
    if (isInMask(x, y, maskData)) return { x, y };
  }
  
  for (let i = 0; i < maskData.data.length; i++) {
    if (maskData.data[i] === 1) {
      const x = (i % maskData.width) / maskData.width * 60 - 30;
      const y = Math.floor(i / maskData.width) / maskData.height * 30;
      return { x, y };
    }
  }
  return { x: 0, y: 10 };
};