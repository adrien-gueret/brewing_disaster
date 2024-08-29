import { shuffleArray } from "./utils.js";

const generatePassiveData = (
  id,
  name,
  ingredientId,
  desc,
  value,
  level,
  linkedId = ""
) => ({
  id,
  linkedId,
  name,
  ingredientId,
  getDesc: () => desc,
  value,
  level,
});

const generateIngredientMetadata = (name, plural, letter, sign) => ({
  id: name.toLowerCase(),
  name,
  plural,
  letter,
  sign,
});

const allEffectData = [
  generateIngredientMetadata("Worm", "Worms", "w", 1),
  generateIngredientMetadata("Fly", "Flies", "f", 1),
  generateIngredientMetadata("Bat", "Bats", "b", 1),
  generateIngredientMetadata("Spider", "Spiders", "s", 1),
  generateIngredientMetadata("Apple", "Apples", "a", -1),
  generateIngredientMetadata("Berry", "Berries", "y", -1),
].flatMap(({ id, name, plural, letter, sign }) => {
  const code = `{${letter.toUpperCase()}}`;
  return [
    generatePassiveData(
      `s${letter}p`,
      `Superior ${name} Potion`,
      id,
      `Your ${code} have {P} ${sign > 0 ? "+" : "-"}1`,
      sign > 0 ? 1 : -1,
      1
    ),
    generatePassiveData(
      `i${letter}p`,
      `Inferior ${name} Potion`,
      id,
      `Your ${code} have {P} ${sign > 0 ? "-" : "+"}1`,
      sign > 0 ? -1 : 1,
      1
    ),
    generatePassiveData(
      `p${letter}`,
      `Poisoned ${name}`,
      id,
      `When adding ${code}, next opponent's ingredient has {P} ${
        sign > 0 ? "+" : "-"
      }1`,
      "poisoned",
      2,
      `e${letter}`
    ),
    generatePassiveData(
      `e${letter}`,
      `Expert of ${plural}`,
      id,
      `You cannot lose when adding ${code}`,
      "expert",
      3,
      `p${letter}`
    ),
  ];
});

export function getRandomPassives(winsCount, excludedPassiveIds) {
  const passiveLevels1 = allEffectData.filter(({ level }) => level === 1);
  const passiveLevels2 = allEffectData.filter(({ level }) => level === 2);
  const passiveLevels3 = allEffectData.filter(({ level }) => level === 3);

  let availablePassives;

  switch (winsCount) {
    case 1:
      availablePassives = [...passiveLevels1];
      break;

    case 3:
      availablePassives = [...passiveLevels1, ...passiveLevels2];
      break;

    case 5:
      availablePassives = [
        ...passiveLevels1,
        ...passiveLevels2,
        ...passiveLevels3,
      ];
      break;

    case 7:
      availablePassives = [...passiveLevels2, ...passiveLevels3];
      break;
  }

  const [passive1, passive2, passive3] = shuffleArray(
    availablePassives.filter(
      ({ id, linkedId }) =>
        !excludedPassiveIds.includes(id) &&
        !excludedPassiveIds.includes(linkedId)
    )
  );

  return [passive1, passive2, passive3];
}

export function getPassiveById(idToFind) {
  return allEffectData.find(({ id }) => id === idToFind);
}
