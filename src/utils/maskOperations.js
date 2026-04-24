// utils/maskOperations.js

export const createDefaultSemicircleMask = (radius) => {
  const width = 200;
  const height = 200;
  const maskArray = [];
  
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = (i / width) * (radius * 2) - radius;
      const y = (j / height) * radius;
      const dist = Math.sqrt(x * x + y * y);
      maskArray.push(dist <= radius && y >= 0 ? 1 : 0);
    }
  }
  
  return {
    data: maskArray,
    width,
    height,
    xMin: -radius,
    xMax:  radius,
    yMin: 0,
    yMax:  radius,
  };
};

export const isInMask = (x, y, maskData) => {
  if (!maskData) return true;
  const xMin = maskData.xMin ?? -30;
  const xMax = maskData.xMax ??  30;
  const yMin = maskData.yMin ??   0;
  const yMax = maskData.yMax ??  30;
  const W = xMax - xMin;
  const H = yMax - yMin;
  const ix = Math.floor((x - xMin) / W * maskData.width);
  const iy = Math.floor((y - yMin) / H * maskData.height);
  if (ix < 0 || ix >= maskData.width || iy < 0 || iy >= maskData.height) return false;
  return maskData.data[iy * maskData.width + ix] === 1;
};

export const randomInMask = (maskData) => {
  const xMin = maskData.xMin ?? -30;
  const xMax = maskData.xMax ??  30;
  const yMin = maskData.yMin ??   0;
  const yMax = maskData.yMax ??  30;
  const W = xMax - xMin;
  const H = yMax - yMin;

  for (let attempts = 0; attempts < 100; attempts++) {
    const x = xMin + Math.random() * W;
    const y = yMin + Math.random() * H;
    if (isInMask(x, y, maskData)) return { x, y };
  }

  // Fallback: find first valid pixel
  for (let i = 0; i < maskData.data.length; i++) {
    if (maskData.data[i] === 1) {
      const col = i % maskData.width;
      const row = Math.floor(i / maskData.width);
      const x = xMin + (col / maskData.width)  * W;
      const y = yMin + (row / maskData.height) * H;
      return { x, y };
    }
  }
  return { x: xMin + W / 2, y: yMin + H / 2 };
};

// Helper: extract world bounds from a mask (works for both semicircle and custom)
export const getMaskBounds = (mask) => ({
  xMin: mask.xMin ?? -30,
  xMax: mask.xMax ??  30,
  yMin: mask.yMin ??   0,
  yMax: mask.yMax ??  30,
});