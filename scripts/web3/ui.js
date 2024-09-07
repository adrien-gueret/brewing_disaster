"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPrivateKey = showPrivateKey;
exports.showPrivateKeyError = showPrivateKeyError;
exports.hidePrivateKeyError = hidePrivateKeyError;
exports.renderCharacterList = renderCharacterList;
exports.setCardsInputValue = setCardsInputValue;
exports.setCharacterName = setCharacterName;
exports.renderDeckIngredients = renderDeckIngredients;
exports.default = init;
const cards_1 = require("../cards");
const ui_1 = require("../ui");
const askPrivateKeyForm = document.getElementById("askPrivateKeyForm");
const privateKeyInput = document.getElementById("privateKeyInput");
const cancelButton = document.getElementById("cancelButton");
const privateKeyShow = document.getElementById("privateKeyShow");
const privateKeyError = document.getElementById("privateKeyError");
const cardSelection = document.getElementById("cardSelection");
const deckList = document.getElementById("deckList");
const cardsInput = document.getElementById("cardsInput");
const cardCount = document.getElementById("cardCount");
const saveButton = document.getElementById("saveButton");
const formCreate = document.getElementById("formCreate");
const characterName = document.getElementById("characterName");
const characterList = document.getElementById("characterList");
function showPrivateKey(key) {
    privateKeyShow.value = key;
}
function showPrivateKeyError() {
    privateKeyError.style.display = "block";
}
function hidePrivateKeyError() {
    privateKeyError.style.display = "none";
}
function renderCharacterList(characters) {
    characterList.innerHTML = "";
    characters.forEach((character) => {
        const cardNode = (0, ui_1.createCardNode)({
            id: character.id,
            status: "normal",
            getName: () => character.name,
            getDesc: () => character.desc,
        }, "div");
        let nodeToInsert = cardNode;
        if (character.href) {
            nodeToInsert = document.createElement("a");
            nodeToInsert.href = character.href;
            nodeToInsert.append(cardNode);
        }
        characterList.append(nodeToInsert);
    });
}
function ingredientsStringToIngredientArrayIds(value) {
    return value
        .split("_")
        .filter(Boolean)
        .flatMap((ingredientData) => {
        const [ingredientId, total] = ingredientData.split("-");
        return new Array(+total).fill(ingredientId);
    });
}
function ingredientArrayIdsToIngredientsString(arr) {
    const ingredientData = {};
    arr.forEach((ingredientId) => {
        if (!ingredientData[ingredientId]) {
            ingredientData[ingredientId] = 0;
        }
        ingredientData[ingredientId]++;
    });
    const strings = [];
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
function setCardsInputValue(value) {
    cardsInput.value = value;
    updateCardCount();
    if (value.length === 0) {
        deckList.innerHTML = "";
    }
    else {
        const cards = ingredientsStringToIngredientArrayIds(value).map((id) => new cards_1.UniqCard(id));
        renderDeckIngredients(cards);
    }
}
function setCharacterName(newValue = "") {
    characterName.value = newValue;
}
function renderDeckIngredients(ingredients) {
    deckList.innerHTML = "";
    const fragment = document.createDocumentFragment();
    ingredients.forEach((ingredient) => {
        const cardNode = (0, ui_1.createCardNode)(ingredient, "button");
        cardNode.type = "button";
        cardNode.classList.add("mini");
        cardNode.onclick = () => {
            const currentIngredients = ingredientsStringToIngredientArrayIds(cardsInput.value);
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
function init({ allIngredients, onPrivateKeyEnter, onCancel, onIngredientAdded, onDeckSaved, }) {
    const fragment = document.createDocumentFragment();
    allIngredients.forEach((ingredient) => {
        const cardNode = (0, ui_1.createCardNode)(ingredient, "button");
        cardNode.type = "button";
        cardNode.classList.add("mini");
        cardNode.onclick = () => {
            const currentIngredients = ingredientsStringToIngredientArrayIds(cardsInput.value);
            currentIngredients.push(ingredient.id);
            cardsInput.value =
                ingredientArrayIdsToIngredientsString(currentIngredients);
            onIngredientAdded(ingredientsStringToIngredientArrayIds(cardsInput.value));
            updateCardCount();
        };
        fragment.append(cardNode);
    });
    cardSelection.append(fragment);
    askPrivateKeyForm.onsubmit = (e) => {
        e.preventDefault();
        onPrivateKeyEnter(privateKeyInput.value);
    };
    cancelButton.onclick = onCancel;
    formCreate.onsubmit = (e) => {
        e.preventDefault();
        if (ingredientsStringToIngredientArrayIds(cardsInput.value).length < 10) {
            return;
        }
        onDeckSaved(characterName.value, cardsInput.value);
    };
}
