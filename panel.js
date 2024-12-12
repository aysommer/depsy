const $ = document.querySelector.bind(document);

// States.
let deps = [];

// Components.
const depsList = $("#deps-list");
const depsCounter = $("#deps-counter");
const emptyDataContainer = $("#empty-data-container");
const reloadPageButton = $("#reload-page-button");
reloadPageButton.onclick = reloadPage;
const depsSorting = $("#deps-sorting");
depsSorting.onchange = sort;

// Consts.
const REGEXP = {
   IS_LANG_DICT: new RegExp(/json/gm),
};
const KB_SPLITTER = 1024;

/**
 * Adds dependency.
 * @param {String} request Dependency request.
 */
function addNewDep({ request, response }) {
   const newDep = {
      fileName: request.url,
      fileSize: +(response._transferSize / KB_SPLITTER).toFixed(2),
      loadDate: new Date(),
   };
   deps.push(newDep);
   addDepEl(newDep);
}

/**
 * Adds dependency in HTML.
 * @param {String} request Dependency request.
 */
function addDepEl({ fileName, fileSize }) {
   const depEl = document.createElement("li");
   depEl.innerText = `${fileName} Kb(${fileSize})`;
   depsList.appendChild(depEl);
}

/**
 * Sort deps list by type.
 * @param {Event} event
 */
function sort({ target }) {
   clearDepsListEl();

   let newDeps = [...deps];

   switch (target.value) {
      case "byTime": {
         newDeps = newDeps.sort((curr, next) => {
            return curr.loadDate - next.loadDate;
         });
         break;
      }
      case "bySize": {
         newDeps = newDeps.sort((curr, next) => {
            return next.fileSize - curr.fileSize;
         });
      }
   }
   deps = newDeps;

   updateDepsListEl();
}

function clearDepsListEl() {
   depsList.innerHTML = null;
}

function updateDepsListEl() {
   deps.forEach(addDepEl);
}

function updateDepsCounter() {
   depsCounter.innerText = deps.length;
}

/**
 * Checks file name by rules.
 * @param {String} name Dependency name.
 */
function isValidDep(name) {
   return !REGEXP.IS_LANG_DICT.test(name);
}

function resetData() {
   deps = [];
   depsSorting.value = "byTime";
   clearDepsListEl();
}

/**
 * Reloads current page.
 */
function reloadPage() {
   resetData();
   chrome.tabs.reload(() => {});
}

/**
 * Loads start data.
 */
function loadData() {
   chrome.devtools.network.onRequestFinished.addListener((response) => {
      if (response.response.content.mimeType === "application/javascript") {
         const { url } = response.request;

         if (isValidDep(url)) {
            if (emptyDataContainer.style.display !== "none") {
               emptyDataContainer.style.display = "none";
               depsList.style.display = "block";
            }

            addNewDep(response);
            updateDepsCounter();

            fetch(url)
               .then((_response) => _response.text())
               .then((text) => {
                  console.log(text);
               });
         }
      }
   });
}

loadData();
