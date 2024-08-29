import { getRandom, isLucky } from "./utils.js";

const putridityValue = document.getElementById("putridityValue");
const scene = document.getElementById("scene");
const hand = document.getElementById("hand");
const playerScene = document.getElementById("playerScene");
const opponentScene = document.getElementById("opponentScene");
const cauldronContent = document.getElementById("cauldronContent");
const thrownItem = document.getElementById("thrownItem");
const cardAwards = document.getElementById("cardAwards");
const passiveAwards = document.getElementById("passiveAwards");
const characterList = document.getElementById("characterList");
const opponentList = document.getElementById("opponentList");
const wizardName = document.getElementById("wizardName");
const nextWizardDesc = document.getElementById("nextWizardDesc");
const nextWizardDeckDesc = document.getElementById("nextWizardDeckDesc");
const nextWizardCards = document.getElementById("nextWizardCards");
const nextWizardPutridity = document.getElementById("nextWizardPutridity");
const ruleCardList = document.getElementById("ruleCardList");
const playerDeck = document.getElementById("playerDeck");
const battleResultsWon = document.getElementById("battleResultsWon");
const playerDeckDesc = document.getElementById("playerDeckDesc");
const soundsCheckbox = document.getElementById("soundsCheckbox");
const gameWin = document.getElementById("gameWin");
const floorCanvas = document.getElementById("floorCanvas");
const floorCanvasCtx = floorCanvas.getContext("2d");

const codeToClassName = {
  "{P}": "skull",
  "{W}": "worm",
  "{F}": "fly",
  "{B}": "bat",
  "{S}": "spider",
  "{A}": "apple",
  "{Y}": "berry",
};

function createCardNode(
  { id, uniqId, name, getDesc, hasActivePassive, status },
  element = "div"
) {
  const card = document.createElement(element);
  card.className = "card";

  if (uniqId) {
    card.dataset.uniqId = uniqId;
  }

  if (hasActivePassive) {
    card.classList.add("withPassive");
  }

  card.classList.add(status);

  const content = getDesc();

  card.innerHTML = `
        <div class="image sprite ${id}"></div>
        <div class="name">${name}</div>
        <div class="effect">${content.replace(
          new RegExp(Object.keys(codeToClassName).join("|"), "g"),
          (match) => `<span class="sprite ${codeToClassName[match]}"></span>`
        )}</div>
    `;

  return card;
}

export function drawSceneFloor() {
  const groundWidth = 848;
  const groundHeight = 92;

  const tileSpacing = 2;

  const tileWidth = 64;
  const tileHeight = 16;
  const cols = Math.floor(groundWidth / (tileWidth + tileSpacing)) + 1;
  const rows = Math.floor(groundHeight / (tileHeight + tileSpacing)) + 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (tileWidth + tileSpacing);
      const y = row * (tileHeight + tileSpacing);

      floorCanvasCtx.fillStyle = "#cbcab8";
      floorCanvasCtx.fillRect(x, y + 2, tileWidth, tileHeight);

      floorCanvasCtx.strokeStyle = "#8c8d7a";
      floorCanvasCtx.lineWidth = tileSpacing;
      floorCanvasCtx.strokeRect(x, y + 2, tileWidth, tileHeight);
    }
  }
}

function addSceneShelf(itemIndex, x, y) {
  const itemName = ["fitPotion", "fatPotion", "books", "flower"][itemIndex];

  const canBeReversed = itemName === "books";

  const shelf = document.createElement("div");
  shelf.className = `shelf sprite ${itemName} ${
    canBeReversed ? (isLucky(50) ? "reversed" : "") : ""
  }`;
  shelf.style.left = `${x * 32}px`;
  shelf.style.top = `${y * 48}px`;

  scene.append(shelf);
}

function renderSceneBackground(background) {
  for (let shelf of document.querySelectorAll(".shelf")) {
    shelf.remove();
  }

  background.forEach((row, rowIndex) => {
    row.forEach((item, columnIndex) => {
      if (item === undefined) {
        return;
      }
      addSceneShelf(item, columnIndex, rowIndex);
    });
  });
}

function generateSceneBackground() {
  const getRow = () =>
    new Array(24).fill(void 0).map(() => (isLucky(25) ? getRandom(3) : void 0));

  const background = new Array(5).fill(void 0).map(getRow);

  renderSceneBackground(background);
}

let isSceneLightActivated = false;

function activateSceneLight() {
  let i = 100;
  let direction = 1;

  isSceneLightActivated = true;

  function updateLight() {
    if (!isSceneLightActivated) {
      return;
    }

    if (i <= 80 || i >= 100) {
      direction *= -1;
    }

    i += direction;

    scene.style.setProperty("--dark-amount", i + "%");

    window.setTimeout(() => {
      window.requestAnimationFrame(updateLight);
    }, 132);
  }

  updateLight();
}

export function desactivateSceneLight() {
  isSceneLightActivated = false;
}

export function updateCauldronPutridity(putridity) {
  cauldronScene.dataset.putridity = putridity;
  putridityValue.innerHTML = putridity;
}

export function showWinSection(sectionName) {
  gameWin.className = sectionName;
}

export function setPlayerSprite(charId) {
  playerScene.className = "sprite character " + charId;
}

export function dropCauldron(hasWon, history) {
  return new Promise((resolve) => {
    cauldronContent.innerHTML = history.reduce(
      (acc, uniqCard) =>
        acc + `<div class="sprite ${uniqCard.id} ${uniqCard.status}"></div>`,
      ""
    );
    cauldronContent.addEventListener("transitionend", resolve, { once: true });

    cauldronContent.classList.add("shown", hasWon ? "won" : "lost");

    cauldronScene.style.transform = `rotate(${hasWon ? 90 : -90}deg)`;
  });
}

export function initBattle({ putridity, opponentId }) {
  drawSceneFloor();
  activateSceneLight();
  generateSceneBackground();
  updateCauldronPutridity(putridity);

  cauldronContent.classList.remove("shown", "won", "lost");

  cauldronScene.style.removeProperty("transform");

  opponentScene.className = "sprite character " + opponentId;

  hand.innerHTML = "";
}

export function drawCard(uniqCard) {
  const cardNode = createCardNode(uniqCard, "button");

  const playedCard = hand.querySelector('.card[data-played="1"]');

  if (playedCard) {
    hand.insertBefore(cardNode, playedCard);
    playedCard.remove();
  } else {
    hand.append(cardNode);
  }
}

export async function throwItem(user, card) {
  const fromPlayer = user === "player";
  const fromNode = fromPlayer ? playerScene : opponentScene;

  const rect = fromNode.getBoundingClientRect();
  const { left: sourceX, top: sourceY } = rect;
  thrownItem.style.left = `${sourceX}px`;
  thrownItem.style.top = `${sourceY}px`;
  thrownItem.classList.add(card.id, card.status);

  switch (card.size) {
    case "mini":
      thrownItem.style.transform = "scale(2)";
      break;

    case "maxi":
      thrownItem.style.transform = "scale(4)";
      break;

    default:
      thrownItem.style.removeProperty("transform");
      break;
  }

  if (fromPlayer) {
    thrownItem.classList.add("fromPlayer");
  }

  const animation = thrownItem.animate(
    [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
    {
      duration: 700,
      iterations: 1,
      fill: "forwards",
    }
  );

  await animation.finished;

  animation.cancel();

  thrownItem.style.removeProperty("left");
  thrownItem.style.removeProperty("top");
  thrownItem.classList.remove(card.id, "fromPlayer", card.status);
}

export async function suggestCardAwards(packs, onPackClicked) {
  battleResultsWon.dataset.type = "ingredients";

  cardAwards.innerHTML = "";

  const mainListFragment = document.createDocumentFragment();

  packs.forEach((cards) => {
    const packButton = document.createElement("button");
    packButton.type = "button";
    packButton.className = "option";

    packButton.onclick = () => {
      onPackClicked(cards);
    };

    const packNode = document.createElement("ul");

    cards.forEach((card) => {
      const cardItem = document.createElement("li");
      const cardNode = createCardNode(card);
      cardNode.classList.add("mini");
      cardItem.append(cardNode);
      packNode.append(cardItem);
    });

    packButton.append(packNode);
    mainListFragment.append(packButton);
  });

  cardAwards.append(mainListFragment);
}

export async function suggestPassiveAwards(passives, onPassiveClicked) {
  battleResultsWon.dataset.type = "passives";

  passiveAwards.innerHTML = "";

  const mainListFragment = document.createDocumentFragment();

  passives.forEach((passive) => {
    const passiveButton = document.createElement("button");
    passiveButton.type = "button";
    passiveButton.className = "option";

    passiveButton.onclick = () => {
      onPassiveClicked(passive.id);
    };

    const passiveUl = document.createElement("ul");
    const cardNode = createCardNode(passive, "li");
    cardNode.classList.add("big");
    passiveUl.append(cardNode);

    passiveButton.append(passiveUl);
    mainListFragment.append(passiveButton);
  });

  passiveAwards.append(mainListFragment);
}

export function renderUnlockedCharacter(character) {
  const cardNode = createCardNode({
    id: character.id,
    name: character.name,
    getDesc: () => `<q>${character.desc}</q>`,
  });

  unlockedCharacter.innerHTML = "";
  unlockedCharacter.append(cardNode);
}

export function renderCharacterList(characters) {
  characterList.innerHTML = "";

  characters.forEach((character) => {
    const cardNode = createCardNode({
      id: character.id,
      name: character.name,
      getDesc: () =>
        character.isLocked ? character.desc : `<q>${character.desc}</q>`,
    });

    let nodeToInsert;

    if (character.isLocked) {
      cardNode.classList.add("isLocked");
      nodeToInsert = document.createElement("div");
      nodeToInsert.append(cardNode);
    } else {
      nodeToInsert = document.createElement("a");
      nodeToInsert.href = "#rules";
      nodeToInsert.dataset.characterId = character.id;
      nodeToInsert.append(cardNode);
    }

    characterList.append(nodeToInsert);
  });
}

function renderCardsIntoList(cards, ul) {
  ul.innerHTML = "";

  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    const cardNode = createCardNode(card, "li");
    cardNode.classList.add("mini");
    fragment.append(cardNode);
  });

  ul.append(fragment);
}

export function renderPlayerDeck(cards, desc) {
  if (desc) {
    playerDeckDesc.innerHTML = desc;
  }

  renderCardsIntoList(cards, ruleCardList);
  renderCardsIntoList(
    cards.sort((a, b) => a.id.localeCompare(b.id)),
    playerDeck
  );
}

export function renderOpponentList(opponentIds, wins, nextOpponent) {
  opponentList.innerHTML = "";
  wizardName.innerHTML = `${nextOpponent.name}${
    wins > 3 ? " <span>(hard)</span>" : ""
  }`;
  nextWizardDesc.innerHTML = nextOpponent.desc;
  nextWizardDeckDesc.innerHTML = nextOpponent.deck.desc;
  nextWizardPutridity.innerHTML = nextOpponent.startPutridity;

  renderCardsIntoList(nextOpponent.deck.cards, nextWizardCards);

  const fragment = document.createDocumentFragment();

  opponentIds.forEach((id, index) => {
    const isNext = index === wins;
    const isPrevious = index < wins;
    const container = document.createElement(isNext ? "a" : "div");

    if (isNext) {
      container.href = "#battle";
    }

    if (isPrevious) {
      container.className = "prev";
    }

    container.innerHTML = `<div class="sprite ${isNext ? "character" : ""} ${
      isPrevious ? "ok" : id
    }"></div>`;

    fragment.append(container);
  });

  opponentList.append(fragment);
}

export function toggleSoundsCheckbox(isChecked) {
  soundsCheckbox.checked = isChecked;
}

export function onSoundsCheckboxChange(callback) {
  soundsCheckbox.onchange = callback;
}

export default async function init({ onPlayCard }) {
  hand.onclick = async (e) => {
    const card = e.target;

    if (!("uniqId" in card.dataset)) {
      return;
    }

    document.body.inert = true;

    const animation = card.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-500px)" }],
      {
        duration: 300,
        iterations: 1,
        fill: "forwards",
      }
    );

    card.dataset.played = 1;

    await animation.finished;

    await onPlayCard(card);

    document.body.inert = false;
  };
}
