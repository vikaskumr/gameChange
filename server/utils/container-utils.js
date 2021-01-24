'use strict';

const _ = require('underscore');
const fs = require('fs');
const path = require('path');

module.exports = {
  downloadFileToServer: function (storageServiceModel, container, file, writePath, callback) {
    const promise = new Promise(function (resolve, reject) {
      try {
        let writeStream = fs.createWriteStream(path.resolve(writePath));
        writeStream.on('finish', function () {
          return resolve(writePath);
        });
        storageServiceModel.downloadStream(container, file).pipe(writeStream);
      } catch (e) {
        return reject(e);
      }
    });

    if (callback !== null && typeof callback === 'function') {
      promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
    } else {
      return promise;
    }
  },

  uploadFileFromServer: function (storageServiceModel, container, file, readPath, callback) {
    const promise = new Promise(function (resolve, reject) {
      try {
        let writeStream = storageServiceModel.uploadStream(container, file);
        writeStream.on('success', function (file) {
          // console.log('uploadFileFromServer-success', file);
          return resolve(readPath);
        });
        writeStream.on('error', function (err) {
          return reject(err);
        });
        fs.createReadStream(path.resolve(readPath)).pipe(writeStream);
      } catch (e) {
        return reject(e);
      }
    });

    if (callback !== null && typeof callback === 'function') {
      promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
    } else {
      return promise;
    }
  }
};
