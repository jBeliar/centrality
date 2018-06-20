
const native = require('./addon.node')

const fetchFileIconAsPng = (filePath, callback) => {
  try {
    native.fetchFileIconAsPng(filePath, callback);
  } catch (e) {
    console.log(e);
  }
}

module.exports = { fetchFileIconAsPng };
