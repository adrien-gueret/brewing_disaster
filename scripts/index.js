import initSections, { goToSection } from "./sections.js";
import { getRandomCards } from "./cards.js";
import { getRandomPassives } from "./passives.js";
import initUI, {
  desactivateSceneLight,
  throwItem,
  suggestCardAwards,
  suggestPassiveAwards,
  renderCharacterList,
  renderPlayerDeck,
  dropCauldron,
  renderUnlockedCharacter,
  showWinSection,
} from "./ui.js";

import initState, {
  startGame,
  startBattle,
  draw,
  playCard as statePlayCard,
  getCardByUniqId,
  checkPutridity,
  getNextOpponentCardUniqId,
  applyCardEffect,
  addPlayerCards,
  addPlayerPassive,
  addWin,
  isCharacterUnlocked,
  getWins,
  getPlayerPassives,
  getPlayerDeck,
  getBattleHistory,
  areSoundMuted,
  getPlayerId,
  areAllCharactersUnlocked,
  unlockCharacter,
} from "./state.js";
import { allCharacters, getCharacterToUnlock } from "./characters.js";
import initSounds, {
  itemThrow,
  dropPotion,
  battleWin,
  battleLost,
  bonusTaken,
} from "./sounds.js";

(async () => {
  async function playCard(uniqId, isPlayer) {
    const user = isPlayer ? "player" : "opponent";

    statePlayCard(uniqId, user);

    const card = getCardByUniqId(uniqId);

    itemThrow();
    await throwItem(user, card);

    applyCardEffect(card, user);

    return !checkPutridity();
  }

  await initUI({
    async onPlayCard(cardNode) {
      const cardIndex = Array.from(cardNode.parentNode.children).indexOf(
        cardNode
      );
      let hasLost = await playCard(Number(cardNode.dataset.uniqId), true);

      if (hasLost) {
        dropPotion();
        battleLost();
        await dropCauldron(false, getBattleHistory());
        goToSection("newGame");
        return;
      }

      draw("player", cardIndex);

      const opponentCardUniqId = await getNextOpponentCardUniqId();
      hasLost = await playCard(opponentCardUniqId);

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

  initState();

  initSections(({ currentSection, nextSection, vars }) => {
    if (currentSection === "battle") {
      desactivateSceneLight();
    } else if (currentSection === "title" && nextSection !== "title") {
      initSounds(areSoundMuted());
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
