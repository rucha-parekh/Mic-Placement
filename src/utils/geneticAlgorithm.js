// utils/geneticAlgorithm.js

import { isInMask, randomInMask } from './maskOperations';
import { evaluateIndividual } from './fitnessEvaluation';

export const runOptimization = async (params, activeMask, setProgress, setResults, setIsRunning, initialCoords = null) => {
  if (!activeMask) {
    alert('Please upload an image or use default semicircle!');
    return;
  }

  setIsRunning(true);
  setProgress(0);
  
  const gridSize = 80;
  const gridX = Array.from({ length: gridSize }, (_, i) => -30 + (60 / (gridSize - 1)) * i);
  const gridY = Array.from({ length: gridSize }, (_, i) => 0 + (30 / (gridSize - 1)) * i);

  let population = [];
  
  // If initial coordinates provided, use them
  if (initialCoords && initialCoords.length > 0) {
    const individual = { 
      xs: initialCoords.map(c => c.x), 
      ys: initialCoords.map(c => c.y), 
      fitness: 0 
    };
    population.push(individual);
    
    // Fill rest of population with random
    for (let i = 1; i < params.popSize; i++) {
      const ind = { xs: [], ys: [], fitness: 0 };
      for (let j = 0; j < initialCoords.length; j++) {
        const pos = randomInMask(activeMask);
        ind.xs.push(pos.x);
        ind.ys.push(pos.y);
      }
      population.push(ind);
    }
  } else {
    // Normal random initialization
    for (let i = 0; i < params.popSize; i++) {
      const individual = { xs: [], ys: [], fitness: 0 };
      for (let j = 0; j < params.numRecorders; j++) {
        const pos = randomInMask(activeMask);
        individual.xs.push(pos.x);
        individual.ys.push(pos.y);
      }
      population.push(individual);
    }
  }

  const bestScores = [];

  for (let gen = 0; gen < params.generations; gen++) {
    for (let ind of population) {
      ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, gen, params);
    }

    population.sort((a, b) => b.fitness - a.fitness);
    bestScores.push(population[0].fitness);
    setProgress(((gen + 1) / params.generations) * 100);

    const parents = population.slice(0, 5);
    const newPopulation = [{ ...population[0], xs: [...population[0].xs], ys: [...population[0].ys] }];

    while (newPopulation.length < params.popSize) {
      const p1 = parents[Math.floor(Math.random() * parents.length)];
      const p2 = parents[Math.floor(Math.random() * parents.length)];
      const alpha = Math.random();
      const child = {
        xs: p1.xs.map((x, i) => alpha * x + (1 - alpha) * p2.xs[i]),
        ys: p1.ys.map((y, i) => alpha * y + (1 - alpha) * p2.ys[i]),
        fitness: 0
      };

      for (let i = 0; i < child.xs.length; i++) {
        if (!isInMask(child.xs[i], child.ys[i], activeMask)) {
          const pos = randomInMask(activeMask);
          child.xs[i] = pos.x;
          child.ys[i] = pos.y;
        }
      }

      for (let i = 0; i < child.xs.length; i++) {
        if (Math.random() < params.mutationRate) {
          let attempts = 0, newX, newY;
          do {
            newX = child.xs[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
            newY = child.ys[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
            newX = Math.max(-30, Math.min(30, newX));
            newY = Math.max(0, Math.min(30, newY));
            attempts++;
          } while (!isInMask(newX, newY, activeMask) && attempts < 20);
          
          if (isInMask(newX, newY, activeMask)) {
            child.xs[i] = newX;
            child.ys[i] = newY;
          } else {
            const pos = randomInMask(activeMask);
            child.xs[i] = pos.x;
            child.ys[i] = pos.y;
          }
        }
      }
      newPopulation.push(child);
    }

    population = newPopulation;
    if (gen % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }

  for (let ind of population) ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, params.generations - 1, params);
  population.sort((a, b) => b.fitness - a.fitness);

  setResults({ best: population[0], scores: bestScores, gridX, gridY, mask: activeMask });
  setIsRunning(false);
  setProgress(100);
};