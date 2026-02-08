// constants/defaultParams.js

export const DEFAULT_PARAMS = {
  numRecorders: 8,
  generations: 200,
  sd: 10,
  radius: 30,  // Default semicircle radius in km
  imageWidthKm: 60,  // Default width for uploaded images in km (2 × radius)
  imageHeightKm: 30,  // Default height for uploaded images in km (= radius)
  popSize: 50,
  mutationRate: 0.3,
  mutationStd: 2.0,
  emptyPenaltyFraction: 0.5,
  closePenaltyFraction: 0.5,
  minDist: 3,
  alphaCurve: 'linear',
  optimizationMethod: 'genetic', // 'genetic' or 'gradient'
  gradientLearningRate: 0.001,
  gradientSteps: 1000
};

export const COLORS = {
  navy: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#243b53',
    900: '#102a43'
  },
  cream: {
    50: '#fffefb',
    100: '#fefcf6',
    200: '#fef9ed',
    300: '#fdf5e0',
    400: '#fcf0d1',
    500: '#faeab8',
    600: '#f7e09e',
    700: '#f4d580',
    800: '#f0c85c',
    900: '#ecba33'
  }
};

export const ADVANCED_PARAM_DESCRIPTIONS = {
  popSize: 'Number of candidate solutions maintained in each generation',
  mutationRate: 'Probability of random position changes (0 = none, 1 = always)',
  mutationStd: 'Size of random position adjustments in km',
  emptyPenaltyFraction: 'Penalty weight for low-coverage areas (higher = better coverage)',
  closePenaltyFraction: 'Penalty weight for microphones too close together',
  minDist: 'Minimum allowed distance between any two microphones',
  alphaCurve: 'How fitness function transitions over generations',
  gradientLearningRate: 'Step size for gradient descent updates (gradient method only)',
  gradientSteps: 'Number of optimization iterations (gradient method only)'
};