// ==UserScript==
// @name         Steam Card Exchange Enhanced
// @namespace    https://sergiosusa.com/
// @version      1.00
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

    this.rendererList = [
        new ExchangeConfigurationHelper(this.dataManager),
        new ExchangeConfiguredList(this.dataManager),
        new ExchangeConfiguredToolbar(this.dataManager)
    ];
}

SteamCardExchangeEnhanced.prototype = Object.create(Renderer.prototype);

function Renderer() {
    this.rendererList = [];
    this.globalRenderList = [];

    this.render = () => {
        let renderers = this.findRenderers();
        for (const renderer of renderers) {
            renderer.render();
        }
        this.globalRender();
    }

    this.findRenderers = () => {
        let renderers = [];

        for (const renderer of this.rendererList) {
            if (renderer.canHandleCurrentPage()) {
                renderers.push(renderer);
            }
        }
        return renderers;
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

    this.loadInventoryArray = () => {
        let inventory = this.loadInventory();
        let resultArray = [];

        for (let key in inventory) {
            resultArray.push(inventory[key]);
        }
        return resultArray;
    }

    this.loadOrderedInventory = () => {
        let inventory = this.loadInventoryArray();

        return inventory.sort((a, b) => {
            if (a['name'] > b['name']) {
                return 1;
            }

            if (a['name'] < b['name']) {
                return -1;
            }

            return 0;
        })
    };
}

function ExchangeConfiguredToolbar(dataManager) {
    Renderable.call(this);

    this.dataManager = dataManager;

    this.handlePage = /https:\/\/www.steamcardexchange\.net\/index.php\?(inventorygame-appid-(.*)|inventory)/g;

    this.render = () => {

        if (this.isInventoryGamePage()) {
            document.querySelector('main div:nth-child(3)').outerHTML = this.template() + document.querySelector('main div:nth-child(3)').outerHTML;
            this.addListeners();
        }

        if (this.isInventoryPage()) {
            let contentBox = document.querySelector("#inventorylist_wrapper");
            contentBox.outerHTML = contentBox.outerHTML + this.template();
            this.addListeners();
        }

    }

    this.template = () => {
        return '<div style="display:flex;margin-top: 10px;justify-content: space-between;" class="flex items-center p-2 mx-auto mt-0.5 leading-none bg-black">' +
            '<div class="w-1.5 h-1.5 bg-blue ml-1 mr-2 shrink-0"></div>' +
            '  <span style="margin-right: 100px;flex-grow: 2;" class="tracking-wider font-league-gothic">SCE ENHANCED </span>' +
            '<div>' +
            '  <a class="btn-primary lg:w-min" id="sceExport" style="float: inherit;" href="javascript:void(0)" >EXPORT</a>' +
            '  <a class="btn-primary lg:w-min" id="sceImport" style="float: inherit;" href="javascript:void(0)" >IMPORT</a>' +
            '  <a class="btn-primary lg:w-min" id="sceClear" style="float: inherit;" href="javascript:void(0)" >CLEAR ALL</a>' +
            '</div>' +
            '</div>' +
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

    this.isInventoryPage = () => {
        return null !== window.location.search.match(/inventory$/g);
    }

    this.isInventoryGamePage = () => {
        return null !== window.location.search.match(/inventorygame-appid-(\d+)/g);
    }
}

ExchangeConfiguredToolbar.prototype = Object.create(Renderable.prototype);

function ExchangeConfigurationHelper(dataManager) {
    Renderable.call(this);
    this.dataManager = dataManager;

    this.handlePage = /https:\/\/www.steamcardexchange\.net\/index.php\?inventorygame-appid-(.*)/g;

    this.render = () => {
        this.renderButtonsToCard();
        this.loadSavedInventory();
    };

    this.renderButtonsToCard = () => {
        let cardList = document.querySelectorAll('.grid > div.flex-col:not(.hidden)');

        cardList.forEach((element, index) => {

            element.classList.add('sce-enhanced-card');
            element.classList.add('sce-enhanced-card-' + index);

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
                        'name': undefined,
                        'appId': undefined
                    };
                }

                let action = 'have';

                if (event.target.classList.contains('btn-need-action')) {
                    action = 'need';
                }

                let status = event.target.closest(".sce-enhanced-buttons").getAttribute('sce-enhanced-status');

                if (status === "" || status !== action) {
                    status = action;
                } else {
                    status = "";
                }

                event.target.closest(".sce-enhanced-buttons").setAttribute('sce-enhanced-status', status);
                inventory[appId]['name'] = appName.trim();
                inventory[appId]['appId'] = appId;
                inventory[appId][event.target.getAttribute('sce-enhanced-index')] = status;

                if (!self.isSomethingMarked(inventory[appId])) {
                    delete inventory[appId]
                }

                self.dataManager.saveInventory(inventory);
                event.target.closest('.sce-enhanced-card').style.border = '2px solid ' + self.colorByStatus(status);

            }).bind(null, self));
        });

    }

    this.loadSavedInventory = () => {
        let inventory = this.dataManager.loadInventory();
        let appId = this.appId();
        let ignoredFields = ['name', 'appId'];

        if (inventory[appId] !== undefined) {
            let cards = inventory[appId];

            for (let key in cards) {
                if (!ignoredFields.includes(key)) {
                    if (cards[key] !== "") {
                        let card = document.querySelector(".sce-enhanced-card-" + key);
                        let color = this.colorByStatus(cards[key]);
                        card.style.border = '2px solid ' + color;
                        card.querySelector(".sce-enhanced-buttons").setAttribute('sce-enhanced-status', cards[key]);
                    }
                }
            }
        }

    }

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

    this.colorByStatus = (status) => {
        let color = 'transparent';

        if (status === 'need') {
            color = 'green'
        }

        if (status === 'have') {
            color = 'grey';
        }

        return color;
    }
}

ExchangeConfigurationHelper.prototype = Object.create(Renderable.prototype);

function ExchangeConfiguredList(dataManager) {
    Renderable.call(this);
    this.dataManager = dataManager;

    this.handlePage = /https:\/\/www.steamcardexchange\.net\/index.php\?inventory$/g;

    this.render = () => {

        let inventory = this.dataManager.loadOrderedInventory();
        let contentBox = document.querySelector("#inventorylist_wrapper");
        let tableTemplate = this.exchangeConfiguredListTemplate(inventory);
        contentBox.outerHTML = contentBox.outerHTML + tableTemplate;
        this.addListenersToExchangeConfiguredList();
    };

    this.addListenersToExchangeConfiguredList = () => {

        let removeButtonList = document.querySelectorAll('#sceClearGame');

        if (removeButtonList.length === 0) {
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
                    event.target.closest("tr").remove();
                }
                return false;
            }.bind(self));
        });

    };

    this.exchangeConfiguredListTemplate = (inventory) => {

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
                '<td class="name"><a href="index.php?inventorygame-appid-' + inventory[key].appId + '">' + inventory[key].name + '</a></td><td><a id="sceClearGame" sce-enhanced-index="' + inventory[key].appId + '" style="float: inherit;" href="javascript:void(0)" class="button-blue">❌</a></td>' +
                '</tr>';
            times++;
        }

        template += '</tbody></table></div></div>';

        return template;
    };
}

ExchangeConfiguredList.prototype = Object.create(Renderable.prototype);
