const util = require('util');

module.exports = {
  setEnvironmentId(environmentId) {
    this.environment_id = environmentId;
  },
  setCollectionId(collectionId) {
    this.collection_id = collectionId;
  },
  search(queryOpts) {
    const params = Object.assign({
      environmentId: this.environment_id,
      collectionId: this.collection_id,
      aggregation: 'timeslice(date,1month).average(enriched_text.sentiment.document.score)'
    }, queryOpts);

    console.log('Discovery Trending Query Params: ');
    console.log(util.inspect(params, false, null));
    return params;
  }
};
