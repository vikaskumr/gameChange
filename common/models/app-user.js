'use strict';
const csv = require('csvtojson');
const JWT = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const containerUtils = require('../../server/utils/container-utils.js');
const RestError = require('../../server/utils/rest-error.js');
const bcrypt = require("bcryptjs");


module.exports = function (AppUser) {



  AppUser.uploadCSV = function (req, res, callback) {

    const promise = new Promise(function (resolve, reject) {
      let fileDetailsObject;
      return new Promise((resolve, reject) => {
        AppUser.app.models.FileStorageContainer.upload(AppUser.app.models.FileStorageContainer.containers.uploadfiles.name,
          req,
          res,
          {},
          (err, data) => {
            if (err) {
              console.log(err);
              reject(err);
            }
            resolve(data);
          });
      })
        .then((fileDetails) => {
          if (!fileDetails.files || Object.keys(fileDetails.files).length == 0) {
            return Promise.reject(new RestError(400, `No files found`));
          } else {
            fileDetailsObject = fileDetails;
            return containerUtils.downloadFileToServer(AppUser.app.models.FileStorageContainer, AppUser.app.models.FileStorageContainer.containers.uploadfiles.name,
              fileDetailsObject.files.file[0].name, path.resolve(__dirname,
                '../../../Gamechange/server/.tmp/', fileDetailsObject.files.file[0].name));
          }
        })
        .then((localPath) => {
          return readCSV(localPath);
        })
        .then((appUsers) => {
          let formattedResult = [];
          _.each(appUsers, (appUser) => {

            if (!appUser.username || !appUser.password || !appUser.firstName || !appUser.lastName || !appUser.mobile || !appUser.isActive) {
              return reject('file can not be uploaded as it has missing values');
            }

            let obj = {
              username: appUser.username,
              password: encryptPassword(appUser.password),
              firstName: appUser.firstName,
              lastName: appUser.lastName,
              mobile: appUser.mobile,
              isActive: appUser.isActive
            }
            formattedResult.push(obj);
          });


          return AppUser.create(formattedResult);

        })
        .then(resolve)

        .catch(err => {
          console.error(err);
          return reject(err);
        });
    });

    if (callback !== null && typeof callback === 'function') {
      promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
    } else {
      return promise;
    }

  }

  AppUser.remoteMethod('uploadCSV', {
    accepts: [
      {
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      },
      {
        arg: 'res',
        type: 'object',
        http: {
          source: 'res'
        }
      }
    ],
    returns: {
      arg: 'data',
      type: 'object',
      root: true
    },
    http: {
      path: '/uploadCSV',
      verb: 'POST'
    },
    description: 'CSV upload'
  });

  function readCSV(localPath, callback) {

    const promise = new Promise((resolve, reject) => {
      let readableStream = fs.createReadStream(localPath);
      csv({
        noheader: false
      })
        .fromStream(readableStream)
        .then(result => {
          return resolve(result);
        })
        .catch(reject);
    });
    if (callback !== null && typeof callback === 'function') {
      promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
    } else {
      return promise;
    }

  }


  AppUser.login = function (username, password, req, callback) {


    const promise = new Promise((resolve, reject) => {

      AppUser.findOne({
        where: {
          isActive: true,
          username: username
        }
      })
        .then((userDetails) => {
          if (userDetails) {
            let passwordValidation = decryptPassword(userDetails.password, password);
            if (!passwordValidation) {
              return reject(new RestError(400, `Incorrect Password !`));
            }
          }

          return resolve(userDetails);
        })
        .catch(reject);
    });

    if (callback !== null && typeof callback === 'function') {
      promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
    } else {
      return promise;
    }

  };

  AppUser.remoteMethod('login', {
    accepts: [
      {
        arg: 'username',
        type: 'string',
        http: {
          source: 'form'
        }
      },
      {
        arg: 'password',
        type: 'string',
        http: {
          source: 'form'
        }
      },
      {
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      }
    ],
    returns: {
      arg: 'data',
      type: 'object',
      root: true
    },
    http: {
      path: '/login',
      verb: 'POST'
    },
    description: 'login'
  });


  function encryptPassword(password) {
    try {
      let encryptPassword;
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      encryptPassword = passwordHash;
      return encryptPassword;
    } catch (error) {
      console.log(error);
    }
  }



  function decryptPassword(oldPassword, newPassword) {

    const isMatch = bcrypt.compareSync(oldPassword, newPassword);

    if (!isMatch) {
      return true;
    } else {
      return false;
    }
  }

};
