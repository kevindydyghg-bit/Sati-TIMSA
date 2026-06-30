
const allowedImageMimes = new Set();

async function noop() {}
async function noopImage() {}

module.exports = {
  allowedImageMimes,
  deleteEquipmentImage: noop,
  deleteStockImage: noop,
  readStoredImage: noopImage,
  uploadEquipmentImage: noopImage,
  uploadStockImage: noopImage
};
