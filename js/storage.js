function getStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    throw new Error("Local storage is unavailable in this browser.", { cause: error });
  }
}

function checkKey(key) {
  if (typeof key !== "string" || key.trim() === "") {
    throw new Error("Choose a non-empty name for saved data.");
  }
}

export function save(key, data) {
  checkKey(key);

  let value;
  try {
    value = JSON.stringify(data);
    if (value === undefined) {
      throw new Error("This value cannot be saved as JSON.");
    }
    getStorage().setItem(key, value);
  } catch (error) {
    throw new Error(`Could not save "${key}" in this browser.`, { cause: error });
  }
}

export function load(key, defaultValue) {
  checkKey(key);

  let value;
  try {
    value = getStorage().getItem(key);
  } catch (error) {
    throw new Error(`Could not read "${key}" from this browser.`, { cause: error });
  }

  if (value === null) {
    return defaultValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Saved "${key}" data is damaged and could not be read.`, { cause: error });
  }
}

export function remove(key) {
  checkKey(key);

  try {
    getStorage().removeItem(key);
  } catch (error) {
    throw new Error(`Could not remove "${key}" from this browser.`, { cause: error });
  }
}
