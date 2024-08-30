(function () {
  'use strict';

  let availableSections = [];
  let nextSectionVars = {};

  function isValidSection(sectionName) {
    return availableSections.includes(sectionName);
  }

  let onSectionChange = () => {};

  function renderSection(sectionName) {
    const newSection = isValidSection(sectionName) ? sectionName : "title";

    if (document.body.dataset.currentSection) {
      document.body.dataset.prevSection = document.body.dataset.currentSection;
    }

    const resultSectionChange = onSectionChange({
      nextSection: newSection,
      currentSection: document.body.dataset.prevSection,
      vars: nextSectionVars,
    });

    if (resultSectionChange !== false) {
      document.body.dataset.currentSection = newSection;
    } else {
      window.history.forward();
    }
  }

  function goToSection(sectionName, vars = {}) {
    nextSectionVars = vars;
    window.location.hash = sectionName;
  }

  function init$5(onSectionChangeCallback) {
    onSectionChange = onSectionChangeCallback;

    let sectionSelectors = [];

    for (let section of document.querySelectorAll("section[id]")) {
      availableSections.push(section.id);

      sectionSelectors.push(
        `body[data-current-section="${section.id}"] section#${section.id}`
      );
    }

    document.head.insertAdjacentHTML(
      "beforeend",
      `<style>${sectionSelectors.join(",") + "{display:flex;}"}</style>`
    );

    function onHashChange(e = {}) {
      renderSection(window.location.hash.substring(1));
    }

    window.addEventListener("hashchange", onHashChange);

    document.body.addEventListener("click", (e) => {
      if (e.target.tagName.toUpperCase() !== "A") {
        return;
      }

      nextSectionVars = JSON.parse(JSON.stringify(e.target.dataset));
    });

    goToSection("title");
    onHashChange();
  }

  function getRandom(x) {
    return Math.floor(Math.random() * (x + 1));
  }

  function isLucky(percentOfChance) {
    return getRandom(99) + 1 <= percentOfChance;
  }

  function shuffleArray(array) {
    const newArray = [...array];

    for (let i = newArray.length - 1; i > 0; i -= 1) {
      const j = getRandom(i);
      const temp = newArray[i];

      newArray[i] = newArray[j];
      newArray[j] = temp;
    }

    return newArray;
  }

  function capitalize(word) {
    return word[0].toUpperCase() + word.slice(1);
  }

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

  function getRandomCards(winsCount = 1, passives = []) {
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

  class UniqCard {
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
    getName: () => name,
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

  function getRandomPassives(winsCount, excludedPassiveIds) {
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

  function getPassiveById(idToFind) {
    return allEffectData.find(({ id }) => id === idToFind);
  }

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

  function createCardNode(uniqCard, element = "div", poison) {
    const { id, uniqId, hasActivePassive, status } = uniqCard;
    const card = document.createElement(element);
    card.className = "card";

    if (uniqId) {
      card.dataset.uniqId = uniqId;
    }

    if (hasActivePassive) {
      card.classList.add("withPassive");
    }

    card.classList.add(status);

    const content = uniqCard.getDesc(poison);

    card.innerHTML = `
        <div class="image sprite ${id}"></div>
        <div class="name">${uniqCard.getName()}</div>
        <div class="effect">${content.replace(
          new RegExp(Object.keys(codeToClassName).join("|"), "g"),
          (match) => `<span class="sprite ${codeToClassName[match]}"></span>`
        )}</div>
    `;

    return card;
  }

  function drawSceneFloor() {
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

  function desactivateSceneLight() {
    isSceneLightActivated = false;
  }

  function updateCauldronPutridity(putridity) {
    cauldronScene.dataset.putridity = putridity;
    putridityValue.innerHTML = putridity;
  }

  function showWinSection(sectionName) {
    gameWin.className = sectionName;
  }

  function setPlayerSprite(charId) {
    playerScene.className = "sprite character " + charId;
  }

  function dropCauldron(hasWon, history) {
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

  function initBattle({ putridity, opponentId }) {
    drawSceneFloor();
    activateSceneLight();
    generateSceneBackground();
    updateCauldronPutridity(putridity);

    cauldronContent.classList.remove("shown", "won", "lost");

    cauldronScene.style.removeProperty("transform");

    opponentScene.className = "sprite character " + opponentId;

    hand.innerHTML = "";
  }

  function drawCard(uniqCard) {
    const cardNode = createCardNode(uniqCard, "button");

    const playedCard = hand.querySelector('.card[data-played="1"]');

    if (playedCard) {
      hand.insertBefore(cardNode, playedCard);
      playedCard.remove();
    } else {
      hand.append(cardNode);
    }
  }

  function applyPoisonToHand(cardsInHand, poison) {
    hand.innerHTML = "";

    cardsInHand.forEach((uniqCard) => {
      const cardNode = createCardNode(uniqCard, "button", poison);
      hand.append(cardNode);
    });
  }

  async function throwItem(user, card) {
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

  async function suggestCardAwards(packs, onPackClicked) {
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

  async function suggestPassiveAwards(passives, onPassiveClicked) {
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

  function renderUnlockedCharacter(character) {
    const cardNode = createCardNode({
      id: character.id,
      getName: () => character.name,
      getDesc: () => `<q>${character.desc}</q>`,
    });

    unlockedCharacter.innerHTML = "";
    unlockedCharacter.append(cardNode);
  }

  function renderCharacterList(characters) {
    characterList.innerHTML = "";

    characters.forEach((character) => {
      const cardNode = createCardNode({
        id: character.id,
        getName: () => character.name,
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

  function renderPlayerDeck(cards, desc) {
    if (desc) {
      playerDeckDesc.innerHTML = desc;
    }

    renderCardsIntoList(cards, ruleCardList);
    renderCardsIntoList(
      cards.sort((a, b) => a.id.localeCompare(b.id)),
      playerDeck
    );
  }

  function renderOpponentList(opponentIds, wins, nextOpponent) {
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

  function toggleSoundsCheckbox(isChecked) {
    soundsCheckbox.checked = isChecked;
  }

  function onSoundsCheckboxChange(callback) {
    soundsCheckbox.onchange = callback;
  }

  async function init$4({ onPlayCard }) {
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

  const STORAGE_KEY = "brewing-disaster";

  function getSave() {
    const save = localStorage.getItem(STORAGE_KEY);

    try {
      return JSON.parse(save) || {};
    } catch (e) {
      return {};
    }
  }

  function storeSave(save) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }

  function storeKey(key, value) {
    const save = getSave();

    storeSave({
      ...save,
      [key]: value,
    });
  }

  function getKey(key) {
    const save = getSave();

    return save[key];
  }

  let state = {};
  let reducer$1;

  const getState = () => state;
  const setState = (newState) => {
    state = newState;
    storeKey("state", state);
  };

  const dispatch = (action) => setState(reducer$1(state, action));

  function init$3(defaultReducer, defaultState) {
    reducer$1 = defaultReducer;
    state = defaultState;
  }

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

  const allCharacters = [
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

  const getCharacterById = (charId) =>
    structuredClone(allCharacters.find(({ id }) => id === charId));

  const getCharacterToUnlock = (fromCharId) => {
    const charIndex = allCharacters.findIndex(({ id }) => id === fromCharId);

    return allCharacters[charIndex + 1];
  };

  const defaultState = {
    unlockedChars: ["totter"],
    muted: false,
    currentGame: {
      playerId: null,
      playerDeckCards: [],
      opponentIds: [],
      passiveIds: [],
      wins: 0,
    },
    currentBattle: null,
  };

  let isInAISimulation = false;

  function getPassives(passiveIds, wins) {
    if (wins < 4) {
      return [];
    }

    const passives = passiveIds.map(getPassiveById);

    return wins < 6 ? [passives[0]] : passives;
  }

  function reducer(state = defaultState, { type, payload }) {
    switch (type) {
      case "startGame": {
        const { playerCharacterId } = payload;
        const { deck } = getCharacterById(playerCharacterId);
        setPlayerSprite(playerCharacterId);

        const playerDeckCards = deck.cards.map((id) => new UniqCard(id));
        renderPlayerDeck(playerDeckCards, deck.desc);

        const otherCharactersIds = allCharacters
          .filter(({ id }) => id !== playerCharacterId)
          .map(({ id }) => id);

        const opponentIds = [
          ...otherCharactersIds,
          ...shuffleArray(otherCharactersIds),
        ];

        const nextOpponent = getCharacterById(opponentIds[0]);
        nextOpponent.deck.cards = nextOpponent.deck.cards.map(
          (id) => new UniqCard(id)
        );

        renderOpponentList(opponentIds, 0, nextOpponent);

        return {
          ...state,
          currentGame: {
            playerId: playerCharacterId,
            playerDeckCards,
            opponentIds,
            passiveIds: [],
            wins: 0,
          },
          currentBattle: null,
        };
      }

      case "toggleMuteSounds": {
        const muted = payload.isMuted;

        return {
          ...state,
          muted,
        };
      }

      case "startBattle": {
        const { wins, opponentIds } = state.currentGame;
        const opponentId = opponentIds[wins];

        const opponent = getCharacterById(opponentId);

        const { deck, startPutridity: putridity, botPassiveIds } = opponent;

        const playerDeck = shuffleArray(state.currentGame.playerDeckCards);
        const opponentDeck = shuffleArray(
          deck.cards.map(
            (id) => new UniqCard(id, getPassives(botPassiveIds, wins))
          )
        );

        initBattle({ putridity, opponentId });

        return {
          ...state,
          currentBattle: {
            poison: 0,
            putridity,
            playerDeck,
            opponentDeck,
            history: [],
            playerHand: [],
            opponentHand: [],
            playerDiscard: [],
            opponentDiscard: [],
          },
        };
      }

      case "setPutridity": {
        const { putridity } = payload;

        if (!isInAISimulation) {
          updateCauldronPutridity(putridity);
        }

        return {
          ...state,
          currentBattle: {
            ...state.currentBattle,
            putridity,
          },
        };
      }

      case "draw": {
        const {
          playerDeck,
          playerHand,
          playerDiscard,
          opponentDeck,
          opponentHand,
          opponentDiscard,
        } = state.currentBattle;

        const { user, index = playerHand.length } = payload;

        const isPlayer = user === "player";

        let [deck, hand, discard] = isPlayer
          ? [playerDeck, playerHand, playerDiscard]
          : [opponentDeck, opponentHand, opponentDiscard];

        let cardsCount = 1;

        if (deck.length === 0) {
          if (hand.length === 0) {
            deck = shuffleArray(discard);
            discard.length = 0;

            if (isPlayer) {
              state.currentBattle.playerDeck = deck;
              cardsCount = 4;
            } else {
              state.currentBattle.opponentDeck = deck;
              cardsCount = 2;
            }
          } else {
            return state;
          }
        }

        for (let i = 0; i < cardsCount; i++) {
          const drawnCard = deck.shift();

          if (cardsCount === 1) {
            hand.splice(index, 0, drawnCard);
          } else {
            hand.push(drawnCard);
          }

          if (isPlayer) {
            drawCard(drawnCard);
          }
        }

        return state;
      }

      case "playCard": {
        if (isInAISimulation) {
          return state;
        }

        const { playerDiscard, playerHand, opponentDiscard, opponentHand } =
          state.currentBattle;

        const { uniqCardId, user } = payload;
        const isPlayer = user === "player";

        const [discard, hand] = isPlayer
          ? [playerDiscard, playerHand]
          : [opponentDiscard, opponentHand];

        const [playedCard] = hand.splice(
          hand.findIndex(({ uniqId }) => uniqId === uniqCardId),
          1
        );

        discard.push(playedCard);

        state.currentBattle.history.push(playedCard);

        return state;
      }

      case "addPlayerCards": {
        const { cards } = payload;

        return {
          ...state,
          currentGame: {
            ...state.currentGame,
            playerDeckCards: [...state.currentGame.playerDeckCards, ...cards],
          },
        };
      }

      case "addPlayerPassive": {
        const passive = getPassiveById(payload.passiveId);
        const cards = state.currentGame.playerDeckCards;

        cards.forEach((card) => {
          card.applyPassives([passive]);
        });

        return {
          ...state,
          currentGame: {
            ...state.currentGame,
            playerDeckCards: cards,
            passiveIds: [...state.currentGame.passiveIds, payload.passiveId],
          },
        };
      }

      case "addWin": {
        const { wins, opponentIds } = state.currentGame;
        const newWins = wins + 1;

        const newState = {
          ...state,
          currentBattle: null,
          currentGame: {
            ...state.currentGame,
            wins: newWins,
          },
        };

        const nextOpponent = getCharacterById(opponentIds[newWins]);

        if (!nextOpponent) {
          return newState;
        }

        nextOpponent.deck.cards = nextOpponent.deck.cards.map(
          (id) =>
            new UniqCard(id, getPassives(nextOpponent.botPassiveIds, newWins))
        );

        renderOpponentList(opponentIds, newWins, nextOpponent);

        return newState;
      }

      case "unlockCharacter": {
        return {
          ...state,
          unlockedChars: [...state.unlockedChars, payload.characterId],
        };
      }

      case "setPoison": {
        const { value, user } = payload;
        const poison = value === 0 ? 0 : value > 0 ? 1 : -1;

        if (user === "opponent") {
          applyPoisonToHand(state.currentBattle.playerHand, poison);
        }

        return {
          ...state,
          currentBattle: {
            ...state.currentBattle,
            poison,
          },
        };
      }

      default:
        return state;
    }
  }

  const setPutridity = (putridity) =>
    dispatch({
      type: "setPutridity",
      payload: { putridity },
    });

  const draw = (user, index) =>
    dispatch({
      type: "draw",
      payload: { user, index },
    });

  const startGame = (playerCharacterId) =>
    dispatch({
      type: "startGame",
      payload: { playerCharacterId },
    });

  const startBattle = () =>
    dispatch({
      type: "startBattle",
    });

  const playCard = (uniqCardId, user) =>
    dispatch({
      type: "playCard",
      payload: {
        uniqCardId,
        user,
      },
    });

  const addPlayerCards = (cards) =>
    dispatch({
      type: "addPlayerCards",
      payload: { cards },
    });

  const addPlayerPassive = (passiveId) =>
    dispatch({
      type: "addPlayerPassive",
      payload: { passiveId },
    });

  const addWin = () =>
    dispatch({
      type: "addWin",
    });

  const unlockCharacter = (characterId) =>
    dispatch({
      type: "unlockCharacter",
      payload: { characterId },
    });

  const checkPutridity = () => {
    const { currentBattle } = getState();
    if (!currentBattle) {
      return true;
    }

    const { putridity } = currentBattle;

    return putridity > 0 && putridity < 13;
  };

  const getCardByUniqId = (uniqCardId) => {
    const { currentGame, currentBattle } = getState();

    const allUniqCards = [...currentGame.playerDeckCards];

    if (currentBattle) {
      allUniqCards.push(
        ...currentBattle.opponentDeck,
        ...currentBattle.opponentHand,
        ...currentBattle.opponentDiscard
      );
    }

    return allUniqCards.find(({ uniqId }) => uniqCardId === uniqId);
  };

  const getPutridity = () => getState().currentBattle.putridity;

  const getBattleHistory = () => getState().currentBattle.history;

  const getPlayerPassives = () =>
    getState().currentGame.passiveIds.map(getPassiveById);

  const getPlayerDeck = () => getState().currentGame.playerDeckCards;

  const isCharacterUnlocked = (charId) =>
    getState().unlockedChars.includes(charId);

  const areAllCharactersUnlocked = () =>
    getState().unlockedChars.length === allCharacters.length;

  const getWins = () => getState().currentGame.wins;

  const getPlayerId = () => getState().currentGame.playerId;

  const areSoundMuted = () => getState().muted;

  const toggleMuteSounds = (isMuted) =>
    dispatch({
      type: "toggleMuteSounds",
      payload: { isMuted },
    });

  const applyPoison = (value, user) =>
    dispatch({
      type: "setPoison",
      payload: { value, user },
    });

  function applyCardEffect(card, user) {
    setPutridity(
      card.applyEffect(
        getPutridity(),
        getState().currentBattle.poison,
        (newPoison) => applyPoison(newPoison, user)
      )
    );
  }

  const getNextOpponentCardUniqId = async () => {
    const { currentBattle, currentGame } = getState();

    const shouldUseRandomStrategy = currentGame.wins < 4;

    if (shouldUseRandomStrategy) {
      return currentBattle.opponentHand[
        getRandom(currentBattle.opponentHand.length - 1)
      ].uniqId;
    }

    isInAISimulation = true;
    const initialPutridity = currentBattle.putridity;
    const initialPoison = currentBattle.poison;

    const weightedCards = currentBattle.opponentHand
      .map((card) => {
        applyCardEffect(card, "opponent");

        const isOKToPlayCard = checkPutridity();
        const nextPutridity = getPutridity();

        setPutridity(initialPutridity);
        applyPoison(initialPoison);

        if (!isOKToPlayCard) {
          return { uniqId: card.uniqId, weight: 999 };
        }

        const deltaMax = 13 - nextPutridity;
        const deltaMin = nextPutridity - 0;

        return {
          uniqId: card.uniqId,
          weight: Math.min(deltaMin, deltaMax),
        };
      })
      .sort((a, b) => a.weight - b.weight);

    isInAISimulation = false;

    return weightedCards[0].uniqId;
  };

  function init$2() {
    init$3(reducer, getKey("state") || defaultState);
  }

  //https://github.com/keithclark/ZzFXM

  // zzfxX - the common audio context
  let zzfxX;

  // zzfxV - global volume
  let zzfxV = 0;

  // zzfxR - global sample rate
  let zzfxR = 44100;

  // zzfx() - the universal entry point -- returns a AudioBufferSourceNode
  const zzfx = (...t) => zzfxP(zzfxG(...t));

  // zzfxP() - the sound player -- returns a AudioBufferSourceNode
  const zzfxP = (...t) => {
    let e = zzfxX.createBufferSource(),
      f = zzfxX.createBuffer(t.length, t[0].length, zzfxR);
    t.map((d, i) => f.getChannelData(i).set(d)),
      (e.buffer = f),
      e.connect(zzfxX.destination),
      e.start();
    return e;
  };

  // zzfxG() - the sound generator -- returns an array of sample data
  const zzfxG = (
    q = 1,
    k = 0.05,
    c = 220,
    e = 0,
    t = 0,
    u = 0.1,
    r = 0,
    F = 1,
    v = 0,
    z = 0,
    w = 0,
    A = 0,
    l = 0,
    B = 0,
    x = 0,
    G = 0,
    d = 0,
    y = 1,
    m = 0,
    C = 0
  ) => {
    let b = 2 * Math.PI,
      H = (v *= (500 * b) / zzfxR ** 2),
      I = ((0 < x ? 1 : -1) * b) / 4,
      D = (c *= ((1 + 2 * k * Math.random() - k) * b) / zzfxR),
      Z = [],
      g = 0,
      E = 0,
      a = 0,
      n = 1,
      J = 0,
      K = 0,
      f = 0,
      p,
      h;
    e = 99 + zzfxR * e;
    m *= zzfxR;
    t *= zzfxR;
    u *= zzfxR;
    d *= zzfxR;
    z *= (500 * b) / zzfxR ** 3;
    x *= b / zzfxR;
    w *= b / zzfxR;
    A *= zzfxR;
    l = (zzfxR * l) | 0;
    for (h = (e + m + t + u + d) | 0; a < h; Z[a++] = f)
      ++K % ((100 * G) | 0) ||
        ((f = r
          ? 1 < r
            ? 2 < r
              ? 3 < r
                ? Math.sin((g % b) ** 3)
                : Math.max(Math.min(Math.tan(g), 1), -1)
              : 1 - (((((2 * g) / b) % 2) + 2) % 2)
            : 1 - 4 * Math.abs(Math.round(g / b) - g / b)
          : Math.sin(g)),
        (f =
          (l ? 1 - C + C * Math.sin((2 * Math.PI * a) / l) : 1) *
          (0 < f ? 1 : -1) *
          Math.abs(f) ** F *
          q *
          0.4 *
          (a < e
            ? a / e
            : a < e + m
            ? 1 - ((a - e) / m) * (1 - y)
            : a < e + m + t
            ? y
            : a < h - d
            ? ((h - a - d) / u) * y
            : 0)),
        (f = d
          ? f / 2 +
            (d > a ? 0 : ((a < h - d ? 1 : (h - a) / d) * Z[(a - d) | 0]) / 2)
          : f)),
        (p = (c += v += z) * Math.sin(E * x - I)),
        (g += p - p * B * (1 - ((1e9 * (Math.sin(a) + 1)) % 2))),
        (E += p - p * B * (1 - ((1e9 * (Math.sin(a) ** 2 + 1)) % 2))),
        n && ++n > A && ((c += w), (D += w), (n = 0)),
        !l || ++J % l || ((c = D), (v = H), (n = n || 1));
    return Z;
  };

  /**
   * ZzFX Music Renderer v2.0.3 by Keith Clark and Frank Force
   */
  const zzfxM = (instruments, patterns, sequence, BPM = 125) => {
    let instrumentParameters;
    let i;
    let j;
    let k;
    let note;
    let sample;
    let patternChannel;
    let notFirstBeat;
    let stop;
    let instrument;

    let attenuation;
    let outSampleOffset;
    let isSequenceEnd;
    let sampleOffset = 0;
    let nextSampleOffset;
    let sampleBuffer = [];
    let leftChannelBuffer = [];
    let rightChannelBuffer = [];
    let channelIndex = 0;
    let panning = 0;
    let hasMore = 1;
    let sampleCache = {};
    let beatLength = ((zzfxR / BPM) * 60) >> 2;

    // for each channel in order until there are no more
    for (; hasMore; channelIndex++) {
      // reset current values
      sampleBuffer = [(hasMore = notFirstBeat = outSampleOffset = 0)];

      // for each pattern in sequence
      sequence.map((patternIndex, sequenceIndex) => {
        // get pattern for current channel, use empty 1 note pattern if none found
        patternChannel = patterns[patternIndex][channelIndex] || [0, 0, 0];

        // check if there are more channels
        hasMore |= !!patterns[patternIndex][channelIndex];

        // get next offset, use the length of first channel
        nextSampleOffset =
          outSampleOffset +
          (patterns[patternIndex][0].length - 2 - !notFirstBeat) * beatLength;
        // for each beat in pattern, plus one extra if end of sequence
        isSequenceEnd = sequenceIndex == sequence.length - 1;
        for (
          i = 2, k = outSampleOffset;
          i < patternChannel.length + isSequenceEnd;
          notFirstBeat = ++i
        ) {
          // <channel-note>
          note = patternChannel[i];

          // stop if end, different instrument or new note
          stop =
            (i == patternChannel.length + isSequenceEnd - 1 && isSequenceEnd) ||
            (instrument != (patternChannel[0] || 0)) | note | 0;

          // fill buffer with samples for previous beat, most cpu intensive part
          for (
            j = 0;
            j < beatLength && notFirstBeat;
            // fade off attenuation at end of beat if stopping note, prevents clicking
            j++ > beatLength - 99 && stop
              ? (attenuation += (attenuation < 1) / 99)
              : 0
          ) {
            // copy sample to stereo buffers with panning
            sample = ((1 - attenuation) * sampleBuffer[sampleOffset++]) / 2 || 0;
            leftChannelBuffer[k] =
              (leftChannelBuffer[k] || 0) - sample * panning + sample;
            rightChannelBuffer[k] =
              (rightChannelBuffer[k++] || 0) + sample * panning + sample;
          }

          // set up for next note
          if (note) {
            // set attenuation
            attenuation = note % 1;
            panning = patternChannel[1] || 0;
            if ((note |= 0)) {
              // get cached sample
              sampleBuffer = sampleCache[
                [(instrument = patternChannel[(sampleOffset = 0)] || 0), note]
              ] =
                sampleCache[[instrument, note]] ||
                // add sample to cache
                ((instrumentParameters = [...instruments[instrument]]),
                (instrumentParameters[2] *= 2 ** ((note - 12) / 12)),
                // allow negative values to stop notes
                note > 0 ? zzfxG(...instrumentParameters) : []);
            }
          }
        }

        // update the sample offset
        outSampleOffset = nextSampleOffset;
      });
    }

    return [leftChannelBuffer, rightChannelBuffer];
  };

  const generateMusic = (noteCraftData) => zzfxM(...noteCraftData);

  const playMusic = (sound, loop = false) => {
    const node = zzfxP(...sound);
    node.loop = loop;
  };

  let volume = 1;

  const playSound = (noteCraftData) =>
    zzfxV > 0 && zzfx(...[zzfxV / 2, , ...noteCraftData]);

  const toggle = (isMuted) => {
    if (isMuted) {
      zzfxV = 0;
      zzfxX.suspend();
    } else {
      zzfxV = volume;
      zzfxX.resume();
    }
  };

  function init$1({ defaultMuted = false, maxVolume = 1 } = {}) {
    zzfxX = new (window.AudioContext || webkitAudioContext)();
    volume = maxVolume;
    toggle(defaultMuted);
  }

  const mainMusic = generateMusic([
    [
      [
        2,
        0,
        261.6255653005986,
        ,
        1,
        ,
        1,
        ,
        ,
        ,
        ,
        ,
        0.2,
        ,
        ,
        ,
        0.01,
        0.5,
        0.01,
        0.2,
      ],
      [, 0, 130.8127826502993, , 1, , , 2, , , 0.5, , , , , 0.1, , 0.4, 0.05],
      [1.3, 0, 65.40639132514966, , 0.02, , , 1.5, , , , , , 5, , , , 0.7, 0.02],
      [0.5, 0, 260, , , 0.04, , , , , , , 0.1, 99, , , , 2, 0.005, 0.2],
    ],
    [
      [
        [
          0, 0, 18, -1, 14, 19, 14, -1, 16, 19, 16, -1, 18, -1, 14, -1, 18, -1,
          16, 19, 14, -1, 14, 19, 16, -1, 18, -1, 14, -1, 18, -1, 16, 19, 16, -1,
          14, 19, 14, -1, 18, -1, 16, -1, 18, 24, 14, 26, 26, -1, 24, 19, 14, -1,
          18, -1, 16, -1, 18, -1, 14, 19, 14, 24, 16, 26, 26, -1, 24, -1, 29, 0,
          0, 0, 16, 19, 14, -1, 14, 19, 16, -1, 18, -1, 14, -1, 18, -1, 16, 19,
          16, -1, 14, 19, 14, -1, 18, -1, 16, -1, 18, -1, 14, 19, 16, -1, 16, 19,
          14, -1, 18, -1, 16, -1, 18, -1, 14, 24, 14, 26, 26, 19, 24, -1, 18, -1,
          14, -1, 18, -1, 16, 19, 14, -1, 14, 24, 16, 26, 26, -1, 24, -1, 29, 0,
          0, 0, 16, -1, 14, 19, 14, -1, 18, -1, 16, -1, 18, -1, 14, 19, 16, -1,
          16, 19, 14, -1, 18, -1, 16, -1, 18, -1, 14, 19, 14, -1, 16, 19, 16, -1,
          18, -1, 14, -1, 18, -1, 16, 19, 14, 24, 14, 26, 26, -1, 24, -1, 14, -1,
          18, -1, 16, 19,
        ],
        [
          0,
          0,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          19,
          16,
          -1,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          19,
          16,
          -1,
          18,
          -1,
          14,
          -1,
          18,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          19,
          -1,
          ,
          16,
          -1,
          16,
          -1,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          19,
          -1,
          ,
          18,
          -1,
          14,
          -1,
          18,
          -1,
          16,
          19,
          -1,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          19,
          16,
          -1,
          18,
          -1,
          ,
          ,
          14,
          -1,
          ,
        ],
        [
          0,
          0,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          14,
          -1,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          14,
          -1,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          16,
          -1,
          ,
          ,
          ,
          ,
          ,
        ],
        [
          1,
          0,
          ,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
          18,
          -1,
          18,
          -1,
          18,
          19,
          -1,
          19,
          -1,
          19,
          -1,
          19,
          18,
          -1,
        ],
      ],
    ],
    [0],
    100,
  ]);

  const winJingle = generateMusic([
    [
      [
        2,
        0,
        261.6255653005986,
        ,
        1,
        ,
        1,
        ,
        ,
        ,
        ,
        ,
        0.2,
        ,
        ,
        ,
        0.01,
        0.5,
        0.01,
        0.2,
      ],
      [, 0, 130.8127826502993, , 1, , , 2, , , 0.5, , , , , 0.1, , 0.4, 0.05],
      [1.3, 0, 65.40639132514966, , 0.02, , , 1.5, , , , , , 5, , , , 0.7, 0.02],
      [0.5, 0, 260, , , 0.04, , , , , , , 0.1, 99, , , , 2, 0.005, 0.2],
    ],
    [[[0, 0, 24, 36, 48, 60, 0, -1]]],
    [0],
    100,
  ]);

  const dropPotion = () =>
    playSound([40, 0.5, , 1.5, , 11, , , , , , 199]);

  const bonusTaken = () =>
    playSound([539, 0, 0.04, 0.29, 1, 1.92, , , 567, 0.02, 0.02, , , , 0.04]);

  const battleWin = () => playMusic(winJingle);

  const battleLost = () =>
    playSound([925, 0.04, 0.3, 0.6, 1, 0.3, , 6.27, -184, 0.09, 0.17]);

  const itemThrow = () =>
    playSound([537, 0.02, 0.02, 0.22, 1, 1.59, -6.98, 4.97]);

  const click = () =>
    playSound([20, 0.02, , 0.04, 1, 3, 41, , , , , , 1, , , , , 1]);

  function toggleSounds(isMuted) {
    toggle(isMuted);
    toggleSoundsCheckbox(!isMuted);

    toggleMuteSounds(isMuted);
  }

  function playMainMusic() {
    playMusic(mainMusic, true);
  }

  function init(initialMuted = false) {
    init$1({ defaultMuted: initialMuted });
    toggleSoundsCheckbox(!initialMuted);
    playMainMusic();

    onSoundsCheckboxChange((e) => {
      toggleSounds(!e.currentTarget.checked);
    });

    document.body.addEventListener("click", (e) => {
      if (
        e.target.tagName === "A" ||
        e.target.tagName === "INPUT" ||
        e.target.tagName === "BUTTON"
      ) {
        click();
      }
    });
  }

  (async () => {
    async function playCard$1(uniqId, isPlayer) {
      const user = isPlayer ? "player" : "opponent";

      playCard(uniqId, user);

      const card = getCardByUniqId(uniqId);

      itemThrow();
      await throwItem(user, card);

      applyCardEffect(card, user);

      return !checkPutridity();
    }

    await init$4({
      async onPlayCard(cardNode) {
        const cardIndex = Array.from(cardNode.parentNode.children).indexOf(
          cardNode
        );
        let hasLost = await playCard$1(Number(cardNode.dataset.uniqId), true);

        if (hasLost) {
          dropPotion();
          battleLost();
          await dropCauldron(false, getBattleHistory());
          goToSection("newGame");
          return;
        }

        draw("player", cardIndex);

        const opponentCardUniqId = await getNextOpponentCardUniqId();
        hasLost = await playCard$1(opponentCardUniqId);

        if (hasLost) {
          dropPotion();
          battleWin();
          await dropCauldron(true, getBattleHistory());
          addWin();
          goToSection(getWins() === 8 ? "gameWin" : "battleResultsWon");
          return;
        }

        draw("opponent");
      },
    });

    init$2();

    init$5(({ currentSection, nextSection, vars }) => {
      if (currentSection === "battle") {
        desactivateSceneLight();
      } else if (currentSection === "title" && nextSection !== "title") {
        init(areSoundMuted());
      }

      switch (nextSection) {
        case "newGame":
          renderCharacterList(
            allCharacters.map((character) => {
              if (isCharacterUnlocked(character.id)) {
                return {
                  ...character,
                  isLocked: false,
                };
              }

              return {
                ...character,
                name: "Locked",
                desc: "Play to unlock this character!",
                isLocked: true,
              };
            })
          );
          break;

        case "rules":
          if (vars.characterId) {
            startGame(vars.characterId);
          }
          break;

        case "gameWin": {
          if (areAllCharactersUnlocked()) {
            showWinSection("allCharactersUnlocked");
            break;
          }

          const charToUnlock = getCharacterToUnlock(getPlayerId());

          if (isCharacterUnlocked(charToUnlock.id)) {
            showWinSection("playWithOtherToUnlock");
          } else {
            unlockCharacter(charToUnlock.id);
            renderUnlockedCharacter(charToUnlock);
            showWinSection("unlockCharacter");
            bonusTaken();
          }

          break;
        }

        case "battle":
          if (currentSection !== "levelList") {
            return false;
          }

          startBattle();

          draw("player");
          draw("player");
          draw("player");
          draw("player");
          draw("opponent");
          draw("opponent");
          draw("opponent");
          draw("opponent");
          break;

        case "battleResultsWon": {
          if (currentSection !== "battle") {
            return false;
          }
          const wins = getWins();

          function renderSuggestCards() {
            const passives = getPlayerPassives();

            suggestCardAwards(
              [
                getRandomCards(wins, passives),
                getRandomCards(wins, passives),
                getRandomCards(wins, passives),
              ],

              (cards) => {
                bonusTaken();
                addPlayerCards(cards);
                goToSection("levelList");
              }
            );
          }

          renderPlayerDeck(getPlayerDeck());

          switch (wins) {
            case 1:
            case 3:
            case 5:
            case 7:
              suggestPassiveAwards(
                getRandomPassives(
                  wins,
                  getPlayerPassives().map(({ id }) => id)
                ),
                (passiveId) => {
                  bonusTaken();
                  addPlayerPassive(passiveId);
                  renderPlayerDeck(getPlayerDeck());
                  renderSuggestCards();
                }
              );
              break;

            default: {
              renderSuggestCards();
              break;
            }
          }

          break;
        }

        case "levelList": {
          if (
            currentSection !== "rules" &&
            currentSection !== "battleResultsWon"
          ) {
            return false;
          }
          break;
        }
      }
    });
  })();

})();
