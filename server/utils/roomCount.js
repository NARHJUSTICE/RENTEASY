function normalizeRoomCount(value, options = {}) {
  const { fallback = 1, min = 1 } = options;
  const parsed = Number.parseInt(value, 10);

  if (Number.isInteger(parsed) && parsed >= min) {
    return parsed;
  }

  return fallback;
}

module.exports = {
  normalizeRoomCount
};
