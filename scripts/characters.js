const card = (id, count = 1) => new Array(count).fill(id);

const deck = (cards) => ({
  cards: cards.flat(),
});

const character = (name, startPutridity, id, desc, botPassiveIds, deck) => ({
  name,
  startPutridity,
  id,
  desc,
  botPassiveIds,
  deck,
});

export const allCharacters = [
  character(
    "Hairy Totter",
    5,
    "totter",
    "I wanna be the very best wizard!",
    ["pw", "swp", "ef"],
    deck([card("w", 3), card("f", 2), card("b", 2), card("a", 2), card("y")])
  ),
  character(
    "Wizard of the Cough",
    4,
    "cough",
    "I... like... flies...",
    ["sfp", "iap", "ef"],
    deck([card("f", 6), card("b", 1), card("a", 3)])
  ),
  character(
    "Wizard of the Old",
    5,
    "old",
    "I am old and wise...",
    ["pw", "ifp", "iwp"],
    deck([
      card("w", 2),
      card("f"),
      card("b"),
      card("s"),
      card("y"),
      card("a", 2),
      card("r"),
      card("m"),
    ])
  ),
  character(
    "Wizard of the Boast",
    6,
    "boast",
    "I have the best ingredients!",
    ["sbp", "ps", "eb"],
    deck([card("b", 4), card("y", 2), card("s", 2), card("r"), card("m")])
  ),
  character(
    "Wizard of the Haste",
    9,
    "haste",
    "It's already too putrid!",
    ["pa", "sap", "ey"],
    deck([card("a", 4), card("y", 4), card("m", 2)])
  ),
  character(
    "Wizard of the Custom",
    0,
    "custom",
    "Choose your starter ingredients!"
  ),
];

export const getCharacterById = (charId) =>
  structuredClone(allCharacters.find(({ id }) => id === charId));

export const getCharacterToUnlock = (fromCharId) => {
  const charIndex = allCharacters.findIndex(({ id }) => id === fromCharId);

  return allCharacters[charIndex + 1];
};
