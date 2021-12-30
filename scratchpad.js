const DUMMY_JSON = {
  "todos": [
    {"text": "Get a cat [dummy]"},
    {"text": "Buy a rocket ship [dummy]"},
    {"text": "Go to Mars [dummy]"}
  ]
};
const demoKey = "remake-demo-todo-app"; // key used for local storage

const ORIGIN = (new URL(document.location)).origin;
const PATHNAME = (new URL(document.location)).pathname.replace(/\/+$/, '');
const LOGIN_REDIRECT_URL = `${ORIGIN}${PATHNAME}`;
const COGNITO_URL = 'https://scratchpad.moogle.cc';
const CLIENT_ID = '5tld2t3nlpkbt7mccfkkhbrj7u';
const RESPONSE_TYPE = 'token';
const SCOPE = 'email+openid';
const COGNITO_LOGIN_URL = `${COGNITO_URL}/login?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&redirect_uri=${LOGIN_REDIRECT_URL}`;
const SCRATCHPAD_ENDPOINT = 'https://moogle.cc/gallery/nirvaancms/attachments/';

/** creates a json file name of the url
  * replaces all non-alphanumeric chars in `cognito_user.email` with empty string
  * replaces all non-alphanumeric chars in `<host>:<port>/path/to/html/file` with hyphens
  * E.g., `http://localhost:8080/remake.html` will be converted to `localhost-8080-remake-html.json`
**/
let filenameForSave = (ud) => {
  let url = new URL(document.location);
  let fn = `${url.host}${url.pathname === "/" ? "/index.html" : url.pathname}`.replace(/[^A-Za-z0-9]/g, '-'); 
  return `${ud.email.replace(/[^A-Za-z0-9]/g, '')}/${fn}.json`;
};

/**
  * if user is logged in: downloads the latest JSON from the public nirvaancms location
  * if user is not logged in: return a dummy JSON
**/
let downloadJSON = async () => {
  if(!userIsLoggedIn()) {
    crostini(`<a href="${COGNITO_LOGIN_URL}">Sign up/login</a> to save/read from ScratchPad. Working locally for now...`, {type: "info"});
    return DUMMY_JSON;
  }
  else {
    let ud = userDetails();
    if(ud){
      let fn = filenameForSave(ud)
      let url = `${SCRATCHPAD_ENDPOINT}${fn}?v=${Math.random()*1000}`;
      return await fetch(url)
      .then(d => d.json())
      .catch(e => {
        console.log(e);
        return DUMMY_JSON
      });
    }
  }
}

/**
  * extract user details from AWS Cognito JWT
**/
let getUserdetailsFromUrl = () => {
  try{
    let hash = (new URL(document.URL)).hash;
    if(hash){
      let urlParams = new URLSearchParams(hash.substring(1)); //hash starts with #
      return {
        id_token: urlParams.get("id_token"),
        access_token: urlParams.get("access_token")
      }
    }
  }catch(e) {
    console.log(e);
    return undefined;
  }
};

/**
  * Push JSON file to presigned url
**/
let saveFileToUrl = async (url, idToken, data) => {
  return await fetch(url, {"headers": 
    {"Authorization": idToken}
  })
  .then(r => r.json())
  .then(r => r.psu)
  .then(psu => {
    return fetch(psu, {
      method: 'PUT',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: data
    })
  })
  .then(r => r.text())
  .then(r => console.log(r))
  .catch(e => {
    console.log(e);
  });
};

/**
  * read user details from local storage.
  * Not ideal. JWT should be stored in session store
**/
let userDetails = () => {
  let ud = JSON.parse(localStorage.getItem('userdetails'));
  if(ud && typeof ud === 'object' && ud.id_token){
    return JSON.parse(atob(ud.id_token.split('.')[1]));
  }
  return undefined;
};

/**
  * returns TRUE or FALSE depending on whether the user is logged in or not
  * 1. if `userdetails` are not in the URL nor in local storage, the user is not logged in
  * 2. if `userdetails` is in the URL, then remove it from url and check if the JWT's expiration date
  *    value is in the future. If not, user is not logged in. If yes, user is logged in.
  * 3. if `userdetails` is in localstorage, check its expiration date. If in future, user is logged in
  *    else not logged in
**/
let userIsLoggedIn = () => {
  let ud = getUserdetailsFromUrl() || JSON.parse(localStorage.getItem('userdetails'));
  if(!ud) return false;
  if(!ud.id_token) return false;
  let x = JSON.parse(atob(ud.id_token.split('.')[1]));
  removeTokenFromUrl();
  let expDateIsInFuture = Date.now() < x.exp * 1000;//converting exp to 
  if(expDateIsInFuture) localStorage.setItem('userdetails', JSON.stringify(ud));
  else if(localStorage.getItem('userdetails')) localStorage.removeItem('userdetails');
  return expDateIsInFuture;
};

/**
  * remove the id_token and access_token url fragment from the url
  * By default, on successful login, Cognito responds with `id_token` and `access_token`
  * attached as a url hash
**/
let removeTokenFromUrl = () => {
  let href = window.location.href;
  let newUrl = href.substring(0, href.indexOf('#'));
  window.history.replaceState({}, '', newUrl);
};

/**
  * if user is not logged in, show an error prompt asking user to log in
  * if user is logged in, get a presigned url from Scratchpad backend
  * then PUT the json file at that url
**/
let saveButtonClicked = async () => {
  if(!userIsLoggedIn()) {
    console.log("User not logged in");
    crostini(`<a href="${COGNITO_LOGIN_URL}">Sign up/login</a> to save to ScratchPad. Saving locally...`, {type: "info"});
  }
  else {
    const PSU_ENDPOINT = 'https://api.moogle.cc/p/tools/psu';
    let ud = userDetails();
    let data = localStorage.getItem(demoKey);
    if(ud && data){
      let fn = filenameForSave(ud)
      let filetype = 'application/json';
      let idToken = (JSON.parse(localStorage.getItem('userdetails')))['id_token'];
      let url = `${PSU_ENDPOINT}?filename=${fn}&filetype=${filetype}`;
      await saveFileToUrl(url, idToken, data);
    }
  }
};
