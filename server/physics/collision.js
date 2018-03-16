const AABB = (rect1, rect2) => {
  // ? Implement stuff later
  if (rect1.x > rect2.x + rect2.width) {
    return false;
  }

  return true;
};

module.exports = {
  AABB,
};
