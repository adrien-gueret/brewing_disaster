import { UniqCard } from "../cards";
import { createCardNode } from "../ui";

const askPrivateKeyForm = document.getElementById(
  "askPrivateKeyForm"
) as HTMLFormElement;

const privateKeyInput = document.getElementById(
  "privateKeyInput"
) as HTMLInputElement;

const privateKeyShow = document.getElementById(
  "privateKeyShow"
) as HTMLInputElement;

const privateKeyError = document.getElementById(
  "privateKeyError"
) as HTMLSpanElement;

const cardSelection = document.getElementById(
  "cardSelection"
) as HTMLDivElement;

const deckList = document.getElementById("deckList") as HTMLDivElement;

const cardsInput = document.getElementById("cardsInput") as HTMLInputElement;

const cardCount = document.getElementById("cardCount") as HTMLDivElement;

const saveButton = document.getElementById("saveButton") as HTMLButtonElement;

const formCreate = document.getElementById("formCreate") as HTMLFormElement;

const characterName = document.getElementById(
  "characterName"
) as HTMLInputElement;

const characterList = document.getElementById(
  "characterList"
) as HTMLDivElement;

export function showPrivateKey(key: string) {
  privateKeyShow.value = key;
}

export function showPrivateKeyError() {
  privateKeyError.style.display = "block";
}

export function hidePrivateKeyError() {
  privateKeyError.style.display = "none";
}

export function renderCharacterList(
  characters: Array<{
    id: string;
    name: string;
    href?: string;
    desc: string;
  }>
) {
  characterList.innerHTML = "";

  characters.forEach((character) => {
    const cardNode = createCardNode(
      {
        id: character.id,
        status: "normal",
        getName: () => character.name,
        getDesc: () => character.desc,
      },
      "div"
    );

    let nodeToInsert = cardNode;

    if (character.href) {
      nodeToInsert = document.createElement("a");
      nodeToInsert.href = character.href;
      nodeToInsert.append(cardNode);
    }

    characterList.append(nodeToInsert);
  });
}

function ingredientsStringToIngredientArrayIds(value: string): string[] {
  return value
    .split("_")
    .filter(Boolean)
    .flatMap((ingredientData) => {
      const [ingredientId, total] = ingredientData.split("-");

      return new Array(+total).fill(ingredientId);
    });
}

function ingredientArrayIdsToIngredientsString(arr: string[]): string {
  const ingredientData: Record<string, number> = {};

  arr.forEach((ingredientId) => {
    if (!ingredientData[ingredientId]) {
      ingredientData[ingredientId] = 0;
    }

    ingredientData[ingredientId]++;
  });

  const strings: string[] = [];

  for (let [ingredientId, count] of Object.entries(ingredientData)) {
    strings.push(`${ingredientId}-${count}`);
  }

  return strings.join("_");
}

function updateCardCount() {
  const count = ingredientsStringToIngredientArrayIds(cardsInput.value).length;

  cardCount.innerHTML = "" + count;

  cardSelection.inert = count === 10;
  saveButton.inert = count < 10;
}

export function setCardsInputValue(value: string) {
  cardsInput.value = value;

  updateCardCount();

  if (value.length === 0) {
    deckList.innerHTML = "";
  } else {
    const cards = ingredientsStringToIngredientArrayIds(value).map(
      (id) => new UniqCard(id)
    );
    renderDeckIngredients(cards);
  }
}

export function setCharacterName(newValue = "") {
  characterName.value = newValue;
}

export function renderDeckIngredients(ingredients: UniqCard[]) {
  deckList.innerHTML = "";

  const fragment = document.createDocumentFragment();

  ingredients.forEach((ingredient) => {
    const cardNode = createCardNode(ingredient, "button");
    cardNode.type = "button";
    cardNode.classList.add("mini");
    cardNode.onclick = () => {
      const currentIngredients = ingredientsStringToIngredientArrayIds(
        cardsInput.value
      );
      const index = currentIngredients.findIndex((id) => id === ingredient.id);
      currentIngredients.splice(index, 1);

      cardsInput.value =
        ingredientArrayIdsToIngredientsString(currentIngredients);

      updateCardCount();

      cardNode.remove();
    };
    fragment.append(cardNode);
  });

  deckList.append(fragment);
}

type InitParams = {
  allIngredients: UniqCard[];
  onPrivateKeyEnter(key: string): void;
  onCancel: () => void;
  onIngredientAdded: (newIngredientIds: string[]) => void;
  onDeckSaved: (name: string, cardsData: string) => void;
};

export default function init({
  allIngredients,
  onPrivateKeyEnter,
  onCancel,
  onIngredientAdded,
  onDeckSaved,
}: InitParams) {
  const fragment = document.createDocumentFragment();

  allIngredients.forEach((ingredient) => {
    const cardNode = createCardNode(ingredient, "button");
    cardNode.type = "button";
    cardNode.classList.add("mini");
    cardNode.onclick = () => {
      const currentIngredients = ingredientsStringToIngredientArrayIds(
        cardsInput.value
      );
      currentIngredients.push(ingredient.id);
      cardsInput.value =
        ingredientArrayIdsToIngredientsString(currentIngredients);

      onIngredientAdded(
        ingredientsStringToIngredientArrayIds(cardsInput.value)
      );

      updateCardCount();
    };
    fragment.append(cardNode);
  });

  cardSelection.append(fragment);

  askPrivateKeyForm.onsubmit = (e) => {
    e.preventDefault();
    onPrivateKeyEnter(privateKeyInput.value);
  };

  for (let backButton of document.querySelectorAll("[data-back-button]")) {
    (backButton as HTMLElement).onclick = onCancel;
  }

  formCreate.onsubmit = (e) => {
    e.preventDefault();

    if (ingredientsStringToIngredientArrayIds(cardsInput.value).length < 10) {
      return;
    }

    onDeckSaved(characterName.value, cardsInput.value);
  };
}
