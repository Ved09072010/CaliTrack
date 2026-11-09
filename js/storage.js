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

export function replaceMany(entries) {
  if (!entries || typeof entries !== "object" || Array.isArray(entries) || Object.keys(entries).length === 0) {
    throw new Error("Choose saved data to replace.");
  }

  const serialized = new Map();
  Object.entries(entries).forEach(([key, data]) => {
    checkKey(key);
    if (data === null) {
      serialized.set(key, null);
      return;
    }
    const value = JSON.stringify(data);
    if (value === undefined) {
      throw new Error(`Saved "${key}" data cannot be encoded as JSON.`);
    }
    serialized.set(key, value);
  });

  const storage = getStorage();
  let previous;
  try {
    previous = new Map([...serialized.keys()].map((key) => [key, storage.getItem(key)]));
  } catch (error) {
    throw new Error("Could not read the previous saved data before replacing it.", { cause: error });
  }
  try {
    serialized.forEach((value, key) => {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    });
  } catch (error) {
    const rollbackErrors = [];
    previous.forEach((value, key) => {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch (rollbackError) {
        rollbackErrors.push(`${key}: ${rollbackError.message}`);
      }
    });
    const rollbackNote = rollbackErrors.length
      ? ` Previous data could not be fully restored (${rollbackErrors.join("; ")}).`
      : " Previous data was restored.";
    throw new Error(`Could not replace saved data.${rollbackNote}`, { cause: error });
  }
}
