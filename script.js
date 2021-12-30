/***************************************
 *           REMAKE DEMO               *
 *           ===========               *
 *                                     *
 *    See how Remake works without     *
 *        installing anything!         *
 *                                     *
 *    For the full framework, with     *
 *    data saving and user accounts:   *
 *                                     *
 *    https://docs.remaketheweb.com/   *
 ***************************************/

/**
  * Get the JSON which we will initialize Remake with
  * if user is logged in, we will use the json file from Scratchpad
  * else we will use a dummy json file 
**/
(async () => await downloadJSON()
  .then(startingData => { 
    Remake.demoInit({
      // Log data to console when page is 
      // saved, useful for debugging
      logDataOnSave: true,
      // Load Sortable library for drag and 
      // drop reordering (only use if your 
      // app  needs drag-and-drop reordering)
      sortable: {sortablejs: Sortable},
      // Load crostini for displaying 
      // temporary success/error notices
      crostini: crostini,
      // Load Handlebars for rendering the 
      // demo on the client-side
      Handlebars: Handlebars,
      // Where in localStorage to store data
      demoLocalStorageNamespace: demoKey,
      loginUrl: COGNITO_LOGIN_URL,
      saveFunctions: {
        _defaultSave: async function ({data, path, saveToId, elem}) {
          localStorage.setItem(demoKey, JSON.stringify(data));
          await saveButtonClicked();
        }
      },
      // Initial data to load into the demo app
      demoStartingData: startingData
    });
  }))();
