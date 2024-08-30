const card = (id, count = 1) => new Array(count).fill(id);

const deck = (cards, desc) => ({
  cards: cards.flat(),
  desc,
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
    deck(
      [
        card("worm", 3),
        card("fly", 2),
        card("bat", 2),
        card("apple", 2),
        card("berry"),
      ],
      "A well-balanced choices of ingredients."
    )
  ),
  character(
    "Wizard of the Cough",
    4,
    "cough",
    "I... like... flies...",
    ["sfp", "iap", "ef"],
    deck(
      [card("fly", 6), card("bat", 1), card("apple", 3)],
      "Flies, flies everywhere!"
    )
  ),
  character(
    "Wizard of the Old",
    5,
    "old",
    "I am old and wise...",
    ["pw", "ifp", "iwp"],
    deck(
      [
        card("worm", 2),
        card("fly"),
        card("bat"),
        card("spider"),
        card("berry"),
        card("apple", 2),
        card("brain"),
        card("meat"),
      ],
      "At least one of each ingredients."
    )
  ),
  character(
    "Wizard of the Boast",
    6,
    "boast",
    "I have the best ingredients!",
    ["sbp", "ps", "eb"],
    deck(
      [
        card("bat", 4),
        card("berry", 2),
        card("spider", 2),
        card("brain"),
        card("meat"),
      ],
      "No worms and no flies!"
    )
  ),
  character(
    "Wizard of the Haste",
    9,
    "haste",
    "It's already too putrid!",
    ["pa", "sap", "ey"],
    deck(
      [card("apple", 4), card("berry", 4), card("meat", 2)],
      "Only ingredients reducing putridity!"
    )
  ),
];

export const getCharacterById = (charId) =>
  structuredClone(allCharacters.find(({ id }) => id === charId));

export const getCharacterToUnlock = (fromCharId) => {
  const charIndex = allCharacters.findIndex(({ id }) => id === fromCharId);

  return allCharacters[charIndex + 1];
};
