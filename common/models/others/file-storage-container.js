'use strict';

module.exports = function (FileStorageContainer) {

  //Never ever change directory name once you create it
  FileStorageContainer.containers = require(`../../../server/filestorage-config.${process.env.NODE_ENV || 'development'}.json`);

  // safety check
  FileStorageContainer.destroyContainer = function (container, callback) {
    throw new Error('Can not delete a container');
  };

  FileStorageContainer.loadFileAsBuffer = function (containerName, fileName, callback) {
    const promise = new Promise(function (resolve, reject) {
      let buffers = [];
      FileStorageContainer.downloadStream(containerName, fileName)
        .on('data', (chunk) => {
          buffers.push(chunk);
        })
        .once('end', () => {
          return resolve(Buffer.concat(buffers));
        })
        .once('error', (err) => {
          return reject(err);
        });
    });

    if (callback !== null && typeof callback === 'function') {
      promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
    } else {
      return promise;
    }
  };
};
