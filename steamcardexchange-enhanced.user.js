// ==UserScript==
// @name         Steam Card Exchange Enhanced
// @namespace    https://sergiosusa.com/
// @version      0.7
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
        new MarkCardList(this.toolBar, this.dataManager),
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
function MarkCardList(toolBar, dataManager) {
    Renderable.call(this);
    this.dataManager = dataManager;
    this.toolBar = toolBar;

    this.handlePage = /https:\/\/www.steamcardexchange\.net\/index.php\?inventorygame-appid-(.*)/g;

    this.UNMARK_BORDER_STYLE = '2px solid transparent';
    this.UNMARK_BUTTON_TEXT = 'Needed';
    this.UNMARK_BACKGROUND_COLOR = 'red';

    this.MARK_BORDER_STYLE = '2px solid green';
    this.MARK_BUTTON_TEXT = 'Unneeded';
    this.MARK_BACKGROUND_COLOR = 'green';

    this.render = () => {
        this.renderGameCardsInterface();
        this.addListenersToGameCardInterface();
        this.injectToolBar();
    };

    this.renderGameCardsInterface = () => {
        document.querySelectorAll('.grid > div.flex-col:not(.hidden)').forEach((element, index) => {
            let borderStyle = this.UNMARK_BORDER_STYLE;
            let backgroundColor = this.UNMARK_BACKGROUND_COLOR;
            let buttonText = this.UNMARK_BUTTON_TEXT;
            let appId = this.appId();

            if (this.dataManager.isCardMarked(appId, index)) {
                borderStyle = this.MARK_BORDER_STYLE;
                buttonText = this.MARK_BUTTON_TEXT;
                backgroundColor = this.MARK_BACKGROUND_COLOR;
            }
            this.injectGameCardInterface(element, index, backgroundColor, buttonText, borderStyle);
        }, this);
    };

    this.injectGameCardInterface = (element, index, backgroundColor, buttonText, borderStyle) => {

        if (element.innerText.trim() !== '') {
            let htmlTemplate = this.gameCardInterfaceTemplate(index, buttonText, backgroundColor);
            element.innerHTML = htmlTemplate + element.innerHTML;
            element.style.border = borderStyle;
        } else {
            element.remove();
        }
    };

    this.gameCardInterfaceTemplate = (index, buttonText, backgroundColor) => {
        let styleTag = ' style="position: relative;background-color: ' + backgroundColor + ';padding: 2px 12px 2px 12px;z-index: 1;right: 0px;cursor: pointer;"';
        return '<div class="btn-action" sce-enhanced-index=' + index + styleTag + '>' + buttonText + '</div>';
    };

    this.addListenersToGameCardInterface = function () {

        let self = this;

        document.querySelectorAll('.btn-action').forEach((element) => {

            element.addEventListener('click', ((self, event) => {

                let borderStyle = self.UNMARK_BORDER_STYLE;
                let backgroundColor = self.UNMARK_BACKGROUND_COLOR;
                let buttonText = self.UNMARK_BUTTON_TEXT;
                let selected = 0;

                if (event.target.innerText === 'Needed') {
                    borderStyle = self.MARK_BORDER_STYLE;
                    backgroundColor = self.MARK_BACKGROUND_COLOR;
                    buttonText = self.MARK_BUTTON_TEXT;
                    selected = 1;
                }

                event.target.parentElement.style.border = borderStyle;
                event.target.innerText = buttonText;
                event.target.style.backgroundColor = backgroundColor;

                let inventoryData = self.dataManager.loadInventory();
                let appId = self.appId();
                let appName = self.appName();

                if (inventoryData[appId] === undefined) {
                    inventoryData[appId] = {};
                }

                inventoryData[appId]['name'] = appName;
                inventoryData[appId][event.target.getAttribute('sce-enhanced-index')] = selected;

                if (!self.isSomethingMarked(inventoryData[appId])) {
                    delete inventoryData[appId]
                }

                self.dataManager.saveInventory(inventoryData);

            }).bind(null, self));
        });
    };

    this.injectToolBar = () => {
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
                if (cards[key] !== 0) {
                    return true;
                }
            }
        }
        return false;
    };
}

MarkCardList.prototype = Object.create(Renderable.prototype);

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

        if (document.querySelector('#sceClearGame') === null){
            return;
        }

        document.querySelector('#sceClearGame').addEventListener('click', ((self, event) => {

            if (confirm('Are you sure you want to clear this games?')) {

                let inventoryData = self.dataManager.loadInventory();
                let appId = event.target.getAttribute('sce-enhanced-index');
                delete inventoryData[appId];
                self.dataManager.saveInventory(inventoryData);
                location.reload();
            }
            return false;
        }).bind(null, this));
    };

    this.markedGamesTemplate = (inventory) => {

        let template = '<div class="content-box">' +
            '<div class="flex items-center p-2 mx-auto mt-0.5 leading-none bg-black" style="justify-content: center;font-weight: bold;"><span class="left">MARKED GAMES</span></div>' +
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
                '<td class="name"><a href="index.php?inventorygame-appid-' + key + '">' + inventory[key].name + '</a></td><td><a id="sceClearGame" sce-enhanced-index="' + key + '" style="float: inherit;" href="#sceExport" class="button-blue">REMOVE</a></td>' +
                '</tr>';
            times++;
        }

        template += '</tbody></table></div></div>';

        return template;
    };

}

ListMarkedGames.prototype = Object.create(Renderable.prototype);
