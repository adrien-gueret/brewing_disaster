export function getRandom(x) {
  return Math.floor(Math.random() * (x + 1));
}

export function isLucky(percentOfChance) {
  return getRandom(99) + 1 <= percentOfChance;
}

export function shuffleArray(array) {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = getRandom(i);
    const temp = newArray[i];

    newArray[i] = newArray[j];
    newArray[j] = temp;
  }

  return newArray;
}
