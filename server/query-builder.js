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
      highlight: true,
      aggregation:
        '[term(enriched_text.entities.text).term(enriched_text.sentiment.document.label),' +
        'term(enriched_text.categories.label).term(enriched_text.sentiment.document.label),' +
        'term(enriched_text.concepts.text).term(enriched_text.sentiment.document.label),' +
        'term(enriched_text.keywords.text).term(enriched_text.sentiment.document.label),' +
        'term(enriched_text.entities.type).term(enriched_text.sentiment.document.label)]'
    }, queryOpts);

    console.log('Discovery Search Query Params: ');
    console.log(util.inspect(params, false, null));
    return params;
  }
};
