import { shuffleArray } from "./utils.js";

class CardDataBase {
  constructor(id, name, value) {
    this.id = id;
    this.name = name;
    this.value = value;
  }

  getDesc() {
    return `{P} ${this.value >= 0 ? "+" : ""}${this.value}`;
  }

  applyEffect(putridity, poison) {
    return putridity + this.value + poison;
  }
}

class CardDataMultipler extends CardDataBase {
  getDesc() {
    return `{P} x${this.value}`;
  }

  applyEffect(putridity, poison) {
    return putridity * (this.value + poison);
  }
}

class CardDataDiviser extends CardDataBase {
  getDesc() {
    return `{P} /${this.value}`;
  }

  applyEffect(putridity, currentPoison) {
    return Math.floor(putridity / (this.value + currentPoison));
  }
}

const allCardDataBase = [
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
    this.originalName = cardData.name;
    this.initialValue = cardData.value;
    this.value = cardData.value;

    this.getDesc = cardData.getDesc.bind(this);
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

  applyPassives(passives) {
    passives
      .filter(({ ingredientId }) => ingredientId === this.id)
      .forEach((passive) => {
        this.hasActivePassive = true;

        switch (passive.value) {
          case "poisoned": {
            this.name = "Poisoned " + this.name;
            this.status = "poisoned";

            const originalGetDec = this.getDesc;
            this.getDesc = () =>
              originalGetDec() + ` ► ${this.initialValue > 0 ? "+1" : "-1"}`;

            break;
          }

          case "expert": {
            this.name = "Safe " + this.name;
            this.status = "safe";

            const originalGetDec = this.getDesc;
            this.getDesc = () =>
              originalGetDec() + ` <span class="subEffect sprite ok"></span>`;

            break;
          }

          default: {
            const isMini = passive.id.startsWith("i");

            if (
              (isMini && this.size === "maxi") ||
              (!isMini && this.size === "mini")
            ) {
              this.size = "normal";
              this.name = this.originalName;
            } else {
              this.size = isMini ? "mini" : "maxi";
              this.name = (isMini ? "Mini " : "Maxi ") + this.name;
            }

            this.value += passive.value;
            break;
          }
        }
      });
  }
}
