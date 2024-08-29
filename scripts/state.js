import {
  initBattle,
  updateCauldronPutridity,
  drawCard,
  setPlayerSprite,
  renderOpponentList,
  renderPlayerDeck,
} from "./ui.js";
import { UniqCard } from "./cards.js";
import { getPassiveById } from "./passives.js";
import { getKey } from "./save.js";
import initStore, { dispatch, getState } from "./store.js";
import { shuffleArray, getRandom } from "./utils.js";
import { allCharacters, getCharacterById } from "./characters.js";

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

export function reducer(state = defaultState, { type, payload }) {
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

      if (deck.length === 0) {
        if (hand.length === 0) {
          deck = shuffleArray(discard);
          discard.length = 0;

          if (isPlayer) {
            state.currentBattle.playerDeck = deck;
          } else {
            state.currentBattle.opponentDeck = deck;
          }
        } else {
          return state;
        }
      }

      const drawnCard = deck.shift();
      hand.splice(index, 0, drawnCard);

      if (isPlayer) {
        drawCard(drawnCard);
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
      return {
        ...state,
        currentBattle: {
          ...state.currentBattle,
          poison: payload.value === 0 ? 0 : payload.value > 0 ? 1 : -1,
        },
      };
    }

    default:
      return state;
  }
}

export const setPutridity = (putridity) =>
  dispatch({
    type: "setPutridity",
    payload: { putridity },
  });

export const draw = (user, index) =>
  dispatch({
    type: "draw",
    payload: { user, index },
  });

export const startGame = (playerCharacterId) =>
  dispatch({
    type: "startGame",
    payload: { playerCharacterId },
  });

export const startBattle = () =>
  dispatch({
    type: "startBattle",
  });

export const playCard = (uniqCardId, user) =>
  dispatch({
    type: "playCard",
    payload: {
      uniqCardId,
      user,
    },
  });

export const addPlayerCards = (cards) =>
  dispatch({
    type: "addPlayerCards",
    payload: { cards },
  });

export const addPlayerPassive = (passiveId) =>
  dispatch({
    type: "addPlayerPassive",
    payload: { passiveId },
  });

export const addWin = () =>
  dispatch({
    type: "addWin",
  });

export const unlockCharacter = (characterId) =>
  dispatch({
    type: "unlockCharacter",
    payload: { characterId },
  });

export const checkPutridity = () => {
  const { currentBattle } = getState();
  if (!currentBattle) {
    return true;
  }

  const { putridity } = currentBattle;

  return putridity > 0 && putridity < 13;
};

export const getCardByUniqId = (uniqCardId) => {
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

export const getPutridity = () => getState().currentBattle.putridity;

export const getBattleHistory = () => getState().currentBattle.history;

export const getPlayerPassives = () =>
  getState().currentGame.passiveIds.map(getPassiveById);

export const getPlayerDeck = () => getState().currentGame.playerDeckCards;

export const isCharacterUnlocked = (charId) =>
  getState().unlockedChars.includes(charId);

export const areAllCharactersUnlocked = () =>
  getState().unlockedChars.length === allCharacters.length;

export const getWins = () => getState().currentGame.wins;

export const getPlayerId = () => getState().currentGame.playerId;

export const areSoundMuted = () => getState().muted;

export const toggleMuteSounds = (isMuted) =>
  dispatch({
    type: "toggleMuteSounds",
    payload: { isMuted },
  });

const applyPoison = (value) =>
  dispatch({
    type: "setPoison",
    payload: { value },
  });

export function applyCardEffect(card) {
  setPutridity(
    card.applyEffect(
      getPutridity(),
      getState().currentBattle.poison,
      applyPoison
    )
  );
}

export const getNextOpponentCardUniqId = async () => {
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
      applyCardEffect(card);

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

export default function init() {
  initStore(reducer, getKey("state") || defaultState);
}
