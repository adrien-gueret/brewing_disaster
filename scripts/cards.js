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
  new CardDataBase("worm", "Worm", 1),
  new CardDataBase("fly", "Fly", 2),
  new CardDataBase("bat", "Bat", 3),
  new CardDataBase("spider", "Spider", 4),
  new CardDataBase("apple", "Apple", -1),
  new CardDataBase("berry", "Berry", -2),
  new CardDataDiviser("meat", "Meat", 2),
  new CardDataMultipler("brain", "Brain", 2),
];

function getCardDataById(idToFind) {
  return allCardDataBase.find(({ id }) => id === idToFind);
}

export function getRandomCards(winsCount = 1, passives = []) {
  const [cardId1, cardId2, cardId3] = shuffleArray([
    winsCount > 4 ? "spider" : "worm",
    winsCount > 2 ? "fly" : "worm",
    winsCount > 2 ? "fly" : "worm",
    winsCount > 4 ? "meat" : "worm",
    winsCount > 4 ? "brain" : "worm",
    "fly",
    "fly",
    winsCount > 2 ? "apple" : "fly",
    winsCount > 2 ? "apple" : "fly",
    "bat",
    winsCount > 2 ? "spider" : "bat",
    winsCount > 4 ? "spider" : "bat",
    winsCount > 2 ? "spider" : "fly",
    winsCount > 2 ? "spider" : "bat",
    "apple",
    "apple",
    "apple",
    winsCount > 4 ? "berry" : "apple",
    winsCount > 4 ? "berry" : "apple",
    "berry",
    "berry",
    "berry",
    winsCount > 4 ? "meat" : "berry",
    winsCount > 4 ? "brain" : "bat",
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
