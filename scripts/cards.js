import { shuffleArray, capitalize } from "./utils.js";

const poisonedWrapper = (content, poison) =>
  poison === 0 ? content : `<span class="poisonnedValue">${content}</span>`;

class CardDataBase {
  constructor(id, name, value) {
    this.id = id;
    this.name = name;
    this.value = value;
  }

  getDesc(poison = 0) {
    const value = this.value + poison;
    return poisonedWrapper(`{P} ${value >= 0 ? "+" : ""}` + value, poison);
  }

  applyEffect(putridity, poison) {
    return putridity + this.value + poison;
  }
}

class CardDataMultipler extends CardDataBase {
  getDesc(poison = 0) {
    return poisonedWrapper(`{P} x${this.value + poison}`, poison);
  }

  applyEffect(putridity, poison) {
    return putridity * (this.value + poison);
  }
}

class CardDataDiviser extends CardDataBase {
  getDesc(poison = 0) {
    return poisonedWrapper(`{P} /${this.value + poison}`, poison);
  }

  applyEffect(putridity, currentPoison) {
    return Math.floor(putridity / (this.value + currentPoison));
  }
}

export const allCardDataBase = [
  new CardDataBase("w", "Worm", 1),
  new CardDataBase("f", "Fly", 2),
  new CardDataBase("b", "Bat", 3),
  new CardDataBase("s", "Spider", 4),
  new CardDataBase("a", "Apple", -1),
  new CardDataBase("y", "Berry", -2),
  new CardDataDiviser("m", "Meat", 2),
  new CardDataMultipler("r", "Brain", 2),
];

function getCardDataById(idToFind) {
  return allCardDataBase.find(({ id }) => id === idToFind);
}

export function getRandomCards(winsCount = 1, passives = []) {
  const [cardId1, cardId2, cardId3] = shuffleArray([
    winsCount > 4 ? "s" : "w",
    winsCount > 2 ? "f" : "w",
    winsCount > 2 ? "f" : "w",
    winsCount > 4 ? "m" : "w",
    winsCount > 4 ? "r" : "w",
    "f",
    "f",
    winsCount > 2 ? "a" : "f",
    winsCount > 2 ? "a" : "f",
    "b",
    winsCount > 2 ? "s" : "b",
    winsCount > 4 ? "s" : "b",
    winsCount > 2 ? "s" : "f",
    winsCount > 2 ? "s" : "b",
    "a",
    "a",
    "a",
    winsCount > 4 ? "y" : "a",
    winsCount > 4 ? "y" : "a",
    "y",
    "y",
    "y",
    winsCount > 4 ? "m" : "y",
    winsCount > 4 ? "r" : "b",
  ]);

  return [cardId1, cardId2, cardId3].map((id) => new UniqCard(id, passives));
}

let lastUnidCardId = 1;

export class UniqCard {
  constructor(cardId, passives = []) {
    this.uniqId = lastUnidCardId++;

    const cardData = getCardDataById(cardId);

    this.id = cardId;
    this.name = cardData.name;
    this.initialValue = cardData.value;
    this.value = cardData.value;

    this.baseCardGetDesc = cardData.getDesc.bind(this);
    this.baseCardEffect = cardData.applyEffect.bind(this);

    this.hasActivePassive = false;
    this.size = "normal";
    this.status = "none";

    this.applyPassives(passives);
  }

  applyEffect(currentPutridity, currentPoison, applyPoison) {
    const newPutridity = this.baseCardEffect(currentPutridity, currentPoison);

    if (this.status === "poisoned") {
      applyPoison(this.initialValue > 0 ? 1 : -1);
    } else {
      applyPoison(0);
    }

    return this.status === "safe"
      ? Math.max(1, Math.min(12, newPutridity))
      : newPutridity;
  }

  getName() {
    const { size, status, name } = this;
    const sizeModifier = size !== "normal" ? `${capitalize(size)} ` : "";
    const statusModifier = status !== "none" ? `${capitalize(status)} ` : "";
    return sizeModifier + statusModifier + name;
  }

  getDesc(poison = 0) {
    const statusToModifier = {
      poisoned: ` ► ${this.initialValue > 0 ? "+1" : "-1"}`,
      safe: ' <span class="subEffect sprite ok"></span>',
    };

    return this.baseCardGetDesc(poison) + (statusToModifier[this.status] || "");
  }

  applyPassives(passives) {
    passives
      .filter(({ ingredientId }) => ingredientId === this.id)
      .forEach((passive) => {
        this.hasActivePassive = true;

        switch (passive.value) {
          case "poisoned": {
            this.status = "poisoned";

            break;
          }

          case "expert": {
            this.status = "safe";

            break;
          }

          default: {
            const isMini = passive.id.startsWith("i");

            if (
              (isMini && this.size === "maxi") ||
              (!isMini && this.size === "mini")
            ) {
              this.size = "normal";
            } else {
              this.size = isMini ? "mini" : "maxi";
            }

            this.value += passive.value;
            break;
          }
        }
      });
  }
}
