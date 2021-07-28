'use strict';

 require('dotenv').config({
   silent: true
 });
 
 require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const WatsonDiscoverySetup = require('../lib/watson-discovery-setup');
const queryTrendBuilder = require('./query-builder-trending');
const queryBuilder = require('./query-builder');
const discoEvents = require('./disco-events');
const DiscoveryV1 = require('ibm-watson/discovery/v1');
const utils = require('../lib/utils');

const discovery = new DiscoveryV1({
  version: '2019-03-25'
});
var environment_id;
var collection_id;

var discoveryDocs = [];

const DEFAULT_NAME = 'agro-recycler-data';

var arrayOfFiles = fs.readdirSync('./data/');
arrayOfFiles.forEach(function(file) {
  discoveryDocs.push(path.join('./data/', file));
});
// shorten the list if we are loading - trail version of IBM Cloud 
// is limited to 256MB application size, so use this if you get
// out of memory errors.
discoveryDocs = discoveryDocs.slice(0,300);

const discoverySetup = new WatsonDiscoverySetup(discovery);
const discoverySetupParams = { 
  default_name: DEFAULT_NAME, 
  config_name: 'agro-recycler-keyword-extraction'   // instead of 'Default Configuration'
};

const WatsonDiscoServer = new Promise((resolve) => {
  discoverySetup.setupDiscovery(discoverySetupParams, (err, data) => {
    if (err) {
      discoverySetup.handleSetupError(err);
    } else {
      console.log('Dicovery is ready!');
      // now load data into discovery service collection
      var collectionParams = data;
    
      // set collection creds - at this point the collectionParams
      // will point to the actual credentials, whether the user
      // entered them in .env for an existing collection, or if
      // we had to create them from scratch.
      environment_id = collectionParams.environmentId;
      collection_id = collectionParams.collectionId;
      console.log('environment_id: ' + environment_id);
      console.log('collection_id: ' + collection_id);
      queryBuilder.setEnvironmentId(environment_id);
      queryBuilder.setCollectionId(collection_id);
      queryTrendBuilder.setEnvironmentId(environment_id);
      queryTrendBuilder.setCollectionId(collection_id);
      discoEvents.setEnvironmentId(environment_id);
      discoEvents.setCollectionId(collection_id);

      collectionParams.documents = discoveryDocs;
      console.log('Begin loading ' + discoveryDocs.length + 
        ' json files into discovery. Please be patient as this can take several minutes.');
      discoverySetup.loadCollectionFiles(collectionParams);
      resolve(createServer());
    }
  });
});


/**
 * createServer - create express server and handle requests
 * from client.
 */
function createServer() {
    console.log('inside createserver')
    const server = require('./express');
  
    server.get('/api/createEvent', (req, res) => {
      const { sessionToken, documentId } = req.query;
    
 const path = require('path');  console.log('sessionToken: ' + sessionToken);
      // console.log('IN api/metrics');
  
      var discoEventsParams = discoEvents.createEvent(documentId, sessionToken);
  
      discovery.createEvent(discoEventsParams)
        .then(response => res.json(response))
        .catch(error => {
          if (error.message === 'Number of free queries per month exceeded') {
            res.status(429).json(error);
          } else {
            res.status(error.code).json(error);
          }
        });
    });
 
   // initial start-up request
   server.get('/*', function(req, res) {
    console.log('In /*');

    // this is the inital query to the discovery service
    console.log('Initial Search Query at start-up');
    const params = queryBuilder.search({ 
      naturalLanguageQuery: '',
      count: 1000,
      passages: false
    });
    return new Promise((resolve, reject) => {
      discovery.query(params)
        .then(results =>  {

          // get all the results data in right format
          var matches = utils.parseData(results);
          matches = utils.formatData(matches, []);
          var totals = utils.getTotals(matches);

           console.log('++++++++++++ DISCO RESULTS ++++++++++++++++++++');
           console.log(JSON.stringify(results, null, 2));
      
          res.render('index',{});
          /*res.render('index', { 
            data: matches, 
            entities: results,   
            categories: results,
            concepts: results,
            keywords: results,
            entityTypes: results,
            numMatches: matches.results.length,
            numPositive: totals.numPositive,
            numNeutral: totals.numNeutral,
            numNegative: totals.numNegative,
            sessionToken: results.result.session_token
          });*/
    
          resolve(results);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
    
  });

  return server;
}

module.exports = WatsonDiscoServer;
