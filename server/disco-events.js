module.exports = {
  setEnvironmentId(environmentId) {
    this.environment_id = environmentId;
  },
  setCollectionId(collectionId) {
    this.collection_id = collectionId;
  },
  createEvent(documentId, sessionToken) {
    const params = Object.assign({
      type: 'click',
      data: {
        environment_id: this.environment_id,
        collection_id: this.collection_id,
        document_id: documentId,
        session_token: sessionToken
      }
    });

    console.log('Discovery Event params: ');
    console.log(JSON.stringify(params, null, 2));
    return params;
  }
};
