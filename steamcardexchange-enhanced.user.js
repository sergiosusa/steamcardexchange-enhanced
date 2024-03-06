// ==UserScript==
// @name         Steam Card Exchange Enhanced
// @namespace    https://sergiosusa.com/
// @version      0.10
// @description  This script enhanced the famous steam trading cards site Steam Card Exchange.
// @author       Sergio Susa (https://sergiosusa.com)
// @match        https://www.steamcardexchange.net/index.php?inventorygame-appid-*
// @match        https://www.steamcardexchange.net/index.php?inventory
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';
    try {
        let steamCardExchange = new SteamCardExchangeEnhanced();
        steamCardExchange.render();
    } catch (exception) {
        alert(exception);
    }
})();

function SteamCardExchangeEnhanced() {
    Renderer.call(this);

    this.dataManager = new DataManager();
    this.toolBar = new ToolBar(this.dataManager);

    this.rendererList = [
        new ExchangeConfigurationHelper(this.toolBar, this.dataManager),
        new ListMarkedGames(this.toolBar, this.dataManager)
    ];
}

SteamCardExchangeEnhanced.prototype = Object.create(Renderer.prototype);

function Renderer() {
    this.rendererList = [];
    this.globalRenderList = [];

    this.render = () => {
        let renderer = this.findRenderer();
        if (renderer){
            renderer.render();
        }
        this.globalRender();
    }

    this.findRenderer = () => {
        return this.rendererList.find(renderer => renderer.canHandleCurrentPage());
    };

    this.globalRender = function () {
        return this.globalRenderList.map(renderer => renderer.render());
    }
}

function Renderable() {
    this.handlePage = "";

    this.canHandleCurrentPage = () => {
        return null !== document.location.href.match(this.handlePage);
    };
}

function DataManager() {

    this.STORE_INVENTORY_KEY = "sce-enhanced-inventory";

    this.loadInventory = () => {
        return JSON.parse(localStorage.getItem(this.STORE_INVENTORY_KEY) || JSON.stringify({}));
    };

    this.saveInventory = (inventory) => {
        localStorage.setItem(this.STORE_INVENTORY_KEY, JSON.stringify(inventory));
    };

    this.isCardMarked = (appId, index) => {
        let inventoryData = this.loadInventory();
        return inventoryData[appId] !== undefined && inventoryData[appId][index] !== undefined && inventoryData[appId][index];
    }
}

function ToolBar(dataManager) {

    this.dataManager = dataManager;

    this.template = () => {
        return '<div style="display:flex;margin-top: 10px;justify-content: space-between;" class="flex items-center p-2 mx-auto mt-0.5 leading-none bg-black">' +
            '<div class="w-1.5 h-1.5 bg-blue ml-1 mr-2 shrink-0"></div>' +
            '  <span style="margin-right: 100px;flex-grow: 2;" class="tracking-wider font-league-gothic">SCE ENHANCED </span>' +
            '<div>'+
            '  <a class="btn-primary lg:w-min" id="sceExport" style="float: inherit;" href="#sceExport" >EXPORT</a>' +
            '  <a class="btn-primary lg:w-min" id="sceImport" style="float: inherit;" href="#sceImport" >IMPORT</a>' +
            '  <a class="btn-primary lg:w-min" id="sceClear" style="float: inherit;" href="#sceClear" >CLEAR ALL</a>' +
            '</div>' +
            '</div>'+
            '</div>';
    }

    this.addListeners = () => {

        document.querySelector('#sceExport').addEventListener('click', ((self) => {
            GM_setClipboard(JSON.stringify(self.dataManager.loadInventory()));
            alert('Your exportation have been copied to your clipboard.');
            return false;
        }).bind(null, this));

        document.querySelector('#sceImport').addEventListener('click', ((self) => {
            let inventoryData = prompt('Paste your exportation here: ');

            if (inventoryData === null) {
                return;
            }

            try {
                self.dataManager.saveInventory(JSON.parse(inventoryData));
                alert('Importation complete.');
                location.reload();
            } catch (e) {
                alert('Importation text is not valid.');
            }
            return false;
        }).bind(null, this));

        document.querySelector('#sceClear').addEventListener('click', ((self) => {

            if (confirm('Are you sure you want to clear your configuration?')) {
                self.dataManager.saveInventory({});
                alert('Your configuration have been cleared.');
                location.reload();
            }

            return false;
        }).bind(null, this));
    };
}
function ExchangeConfigurationHelper(toolBar, dataManager) {
    Renderable.call(this);
    this.dataManager = dataManager;
    this.toolBar = toolBar;

    this.handlePage = /https:\/\/www.steamcardexchange\.net\/index.php\?inventorygame-appid-(.*)/g;
    
    this.render = () => {
        this.renderButtonsToCard();
        this.loadSavedInventory();
        this.renderToolBar();
    };

    this.renderButtonsToCard = () => {
        let cardList = document.querySelectorAll('.grid > div.flex-col:not(.hidden)');

        cardList.forEach((element, index) => {

            element.classList.add('sce-enhanced-card');
            element.classList.add('sce-enhanced-card-'+ index);

            let template = '<div class="sce-enhanced-buttons" sce-enhanced-status="" style="display: flex;justify-content: space-around;width: 100%;">' +
                '<div title="I have extra cards" class="btn-primary btn-have-action" sce-enhanced-index=' + index + ' style="border:1px solid grey;font-size:1.3rem;position:relative;margin-left:10px;margin-right:10px;z-index:1;cursor:pointer;">' +
                    '✉️' +
                '</div>' +
                '<div title="I need it" class="btn-primary btn-need-action" sce-enhanced-index=' + index + ' style="border:1px solid green;font-size:1.3rem;position:relative;margin-left:10px;margin-right:10px;z-index:1;cursor:pointer;">' +
                    '💌' +
                '</div>' +
            '</div>';

            element.innerHTML = template + element.innerHTML;
        });

        this.addClickEventsToButtonsInCards();

    }

    this.addClickEventsToButtonsInCards = () => {

        let self = this;

        let buttons = document.querySelectorAll(".btn-need-action,.btn-have-action");

        buttons.forEach((button) => {
            button.addEventListener('click', ((self, event) => {

                let inventory = self.dataManager.loadInventory();
                let appId = self.appId();
                let appName = self.appName();

                if (inventory[appId] === undefined) {
                    inventory[appId] = {
                        'name': undefined
                    };
                }

                let action = 'have';

                if (event.target.classList.contains('btn-need-action')){
                    action = 'need';
                }

                let status = event.target.closest(".sce-enhanced-buttons").getAttribute('sce-enhanced-status');

                if(status === "" || status !== action){
                    status = action;
                } else {
                    status="";
                }

                event.target.closest(".sce-enhanced-buttons").setAttribute('sce-enhanced-status', status);
                inventory[appId]['name'] = appName;
                inventory[appId][event.target.getAttribute('sce-enhanced-index')] = status;

                if (!self.isSomethingMarked(inventory[appId])) {
                    delete inventory[appId]
                }

                self.dataManager.saveInventory(inventory);

                let color = 'transparent';

                if(status === 'need'){
                    color = 'green'
                }

                if(status === 'have'){
                    color = 'grey';
                }

                event.target.closest('.sce-enhanced-card').style.border = '2px solid ' + color;

            }).bind(null, self));
        });

    }

    this.loadSavedInventory = () => {
        let inventory = this.dataManager.loadInventory();
        let appId = this.appId();

        if (inventory[appId] !== undefined) {

            let cards = inventory[appId];

            for (let key in cards) {
                if (key !== 'name') {
                    if (cards[key] !== "") {
                        let card = document.querySelector(".sce-enhanced-card-" + key);

                        let color = 'transparent';

                        if(cards[key] === 'need'){
                            color = 'green'
                        }

                        if(cards[key] === 'have'){
                            color = 'grey';
                        }

                        card.style.border = '2px solid ' + color;
                        card.querySelector(".sce-enhanced-buttons").setAttribute('sce-enhanced-status', cards[key]);
                    }
                }
            }
        }

    }

    this.renderToolBar = () => {
        document.querySelector('main div:nth-child(3)').outerHTML = toolBar.template() + document.querySelector('main div:nth-child(3)').outerHTML;
        this.toolBar.addListeners();
    };

    this.appId = () => {
        let matches = window.location.href.match(/\.*\?inventorygame-appid-(\d*)/i);
        return matches[1];
    }

    this.appName = () => {
        return document.querySelector("body > main > div:nth-child(4) > div.flex.flex-col.justify-center.p-5.gap-y-1 > div:nth-child(1)").innerText.trim();
    }

    this.isSomethingMarked = (cards) => {
        for (let key in cards) {
            if (key !== 'name') {
                if (cards[key] !== "") {
                    return true;
                }
            }
        }
        return false;
    };
}

ExchangeConfigurationHelper.prototype = Object.create(Renderable.prototype);

function ListMarkedGames(toolBar, dataManager) {
    Renderable.call(this);
    this.dataManager = dataManager;
    this.toolBar = toolBar;

    this.handlePage = /https:\/\/www.steamcardexchange\.net\/index.php\?inventory/g;

    this.render = () => {

        let inventory = this.dataManager.loadInventory();
        let contentBox = document.querySelector("#inventorylist_wrapper");
        let responseTable = this.markedGamesTemplate(inventory);

        contentBox.outerHTML = contentBox.outerHTML + this.toolBar.template() + responseTable;

        this.toolBar.addListeners();
        this.addListenersToMarkedGames();

    };

    this.addListenersToMarkedGames = () => {

        let removeButtonList = document.querySelectorAll('#sceClearGame');

        if (removeButtonList.length === 0){
            return;
        }
        let self = this;
        removeButtonList.forEach(function (button) {

           button.addEventListener('click', function (event) {

               if (confirm('Are you sure you want to clear this games?')) {
                   let inventoryData = this.dataManager.loadInventory();
                   let appId = event.target.getAttribute('sce-enhanced-index');
                   delete inventoryData[appId];
                   this.dataManager.saveInventory(inventoryData);
                   location.reload();
               }
               return false;
           }.bind(self));
        });

    };

    this.markedGamesTemplate = (inventory) => {

        let template = '<div class="content-box">' +
            '<div class="flex items-center p-2 mx-auto mt-0.5 leading-none bg-black" style="justify-content: center;font-weight: bold;"><span class="left">🎮 GAMES PENDING TO TRADE 🎮</span></div>' +
            '<div class="dataTables_wrapper no-footer">' +
            '<table id="markedGamesList" class="price-list-table nth dataTable no-footer" ><thead><tr>';

        if (Object.keys(inventory).length === 0 && inventory.constructor === Object) {
            template += '<th class="name" style="width: 100%;padding: 0px;" >Empty</th>';
        } else {
            template += '<th class="name" style="width: 80%;padding: 0px;" >Name</th><th style="width: 20%;padding: 0px;">Actions</th>';
        }

        template += '</tr></thead><tbody>';

        let times = 0;
        for (let key in inventory) {

            template += '<tr class="' + (times % 2 === 0 ? 'even' : 'odd') + '">' +
                '<td class="name"><a href="index.php?inventorygame-appid-' + key + '">' + inventory[key].name + '</a></td><td><a id="sceClearGame" sce-enhanced-index="' + key + '" style="float: inherit;" href="#sceExport" class="button-blue">❌</a></td>' +
                '</tr>';
            times++;
        }

        template += '</tbody></table></div></div>';

        return template;
    };

}

ListMarkedGames.prototype = Object.create(Renderable.prototype);
