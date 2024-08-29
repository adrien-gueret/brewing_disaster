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

export function storeKey(key, value) {
  const save = getSave();

  storeSave({
    ...save,
    [key]: value,
  });
}

export function getKey(key) {
  const save = getSave();

  return save[key];
}
