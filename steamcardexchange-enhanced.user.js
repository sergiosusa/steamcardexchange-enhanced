// ==UserScript==
// @name         Steam Card Exchange Enhanced
// @namespace    https://sergiosusa.com/
// @version      0.3
// @description  This script enhanced the famous steam trading cards site Steam Card Exchange.
// @author       Sergio Susa (https://sergiosusa.com)
// @match        https://www.steamcardexchange.net/index.php?inventorygame-appid-*
// @match        https://www.steamcardexchange.net/index.php?inventory
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    let steamCardExchange = new SteamCardExchangeEnhanced();
    steamCardExchange.render();

})();

function SteamCardExchangeEnhanced() {

    this.UNMARK_BORDER_STYLE = '2px solid transparent';
    this.UNMARK_BUTTON_TEXT = 'Mark';
    this.UNMARK_BACKGROUND_COLOR = 'red';

    this.MARK_BORDER_STYLE = '2px solid green';
    this.MARK_BUTTON_TEXT = 'Unmark';
    this.MARK_BACKGROUND_COLOR = 'green';

    this.render = () => {
        this.renderInventoryGamePage();
        this.renderInventoryPage();
    };

    this.renderInventoryPage = () => {

        if (!this.isInventoryPage()) {
            return;
        }

        let inventoryData = this.loadInventoryData();
        let contentBox = document.querySelector("#inventory-content > div.content-box-normal");
        let responseTable = this.inventoryPageTemplate(inventoryData);

        contentBox.outerHTML = contentBox.outerHTML + this.inventoryGamePageActionBarTemplate() +
            responseTable;

        this.addClickListenerToActionBar();
        this.addClickListenerToActionButtons();

    };

    this.addClickListenerToActionButtons = () => {
        document.querySelector('#sceClearGame').addEventListener('click', (function (self, event) {

            if (confirm('Are you sure you want to clear this games?')) {

                let inventoryData = self.loadInventoryData();
                let appId = event.target.getAttribute('sce-enhanced-index');
                delete inventoryData[appId];
                self.saveInventoryData(inventoryData);
                location.reload();
            }
            return false;
        }).bind(null, this));
    };

    this.inventoryPageTemplate = (inventoryData) => {

        let template = '<div class="content-box">' +
            '<div class="content-box-topbar"><span class="left">MARKED GAMES</span></div>' +
            '<div class="dataTables_wrapper no-footer">' +
            '<table id="markedGamesList" class="price-list-table nth dataTable no-footer" ><thead><tr>';

        if (Object.keys(inventoryData).length === 0 && inventoryData.constructor === Object) {
            template += '<th class="name" style="width: 100%;padding: 0px;" >Empty</th>';
        } else {
            template += '<th class="name" style="width: 80%;padding: 0px;" >Name</th><th style="width: 20%;padding: 0px;">Actions</th>';
        }

        template += '</tr></thead><tbody>';

        let times = 0;
        for (let key in inventoryData) {

            template += '<tr class="' + (times % 2 === 0 ? 'even' : 'odd') + '">' +
                '<td class="name"><a href="index.php?inventorygame-appid-' + key + '">' + inventoryData[key].name + '</a></td><td><a id="sceClearGame" sce-enhanced-index="' + key + '" style="float: inherit;" href="#sceExport" class="button-blue">REMOVE</a></td>' +
                '</tr>';
            times++;
        }

        template += '</tbody></table></div></div>';

        return template;
    };

    this.renderInventoryGamePage = () => {

        if (!this.isInventoryGamePage()) {
            return;
        }

        let inventoryData = this.loadInventoryData();

        document.querySelectorAll('.inventory-game-card-item').forEach(function (element, index) {

            let borderStyle = this.UNMARK_BORDER_STYLE;
            let backgroundColor = this.UNMARK_BACKGROUND_COLOR;
            let buttonText = this.UNMARK_BUTTON_TEXT;
            let appId = this.appId();

            if (inventoryData[appId] !== undefined && inventoryData[appId][index] !== undefined) {
                if (inventoryData[appId][index]) {
                    borderStyle = this.MARK_BORDER_STYLE;
                    buttonText = this.MARK_BUTTON_TEXT;
                    backgroundColor = this.MARK_BACKGROUND_COLOR;
                }
            }

            this.renderInventoryGamePageGameCard(element, index, backgroundColor, buttonText, borderStyle);

        }, this);

        this.addClickListenerToInventoryGamePageGameCardButton();

        this.renderInventoryGamePageActionBar();
    };

    this.addClickListenerToActionBar = () => {

        document.querySelector('#sceExport').addEventListener('click', (function (self) {
            GM_setClipboard(JSON.stringify(self.loadInventoryData()));
            alert('Your exportation have been copied to your clipboard.');
            return false;
        }).bind(null, this));

        document.querySelector('#sceImport').addEventListener('click', (function (self) {
            let inventoryData = prompt('Paste your exportation here: ');

            if (inventoryData === null) {
                return;
            }

            try {
                self.saveInventoryData(JSON.parse(inventoryData));
                alert('Importation complete.');
                location.reload();
            } catch (e) {
                alert('Importation text is not valid.');
            }
            return false;
        }).bind(null, this));

        document.querySelector('#sceClear').addEventListener('click', (function (self) {

            if (confirm('Are you sure you want to clear your configuration?')) {
                self.saveInventoryData({});
                alert('Your configuration have been cleared.');
                location.reload();
            }

            return false;
        }).bind(null, this));
    };

    this.renderInventoryGamePageActionBar = () => {
        document.querySelector('#content-advert').outerHTML = this.inventoryGamePageActionBarTemplate() + document.querySelector('#content-advert').outerHTML;
        this.addClickListenerToActionBar();
    };

    this.inventoryGamePageActionBarTemplate = () => {
        return '<div class="content-box-button-bar" style="width: 1000px;height: 40px;line-height: 40px;margin: 2px auto 0px auto;background-color: #18191B;background-color: rgba(0, 0, 0, .3);position: relative;text-align: center;">\n' +
            '  <span style="padding-top: 2px;font-weight: bold">SCE Enhanced: </span>' +
            '  <a id="sceExport" style="float: inherit;" href="#sceExport" class="button-blue">EXPORT</a>' +
            '  <a id="sceImport" style="float: inherit;" href="#sceImport" class="button-blue">IMPORT</a>' +
            '  <a id="sceClear" style="float: inherit;" href="#sceClear" class="button-blue">CLEAR ALL</a>' +
            '</div>';
    }

    this.loadInventoryData = () => {
        return JSON.parse(localStorage.getItem('sce-enhanced-inventory') || JSON.stringify({}));
    };

    this.saveInventoryData = (inventoryData) => {
        localStorage.setItem('sce-enhanced-inventory', JSON.stringify(inventoryData));
    };

    this.inventoryGamePageGameCardTemplate = (index, buttonText, backgroundColor) => {
        return '<div class="btn-action" sce-enhanced-index=' + index + ' style="position: absolute;background-color: ' + backgroundColor + ';padding: 2px 12px 2px 12px;z-index: 1;top: 10px;right: 0px;cursor: pointer;">' + buttonText + '</div>';
    };

    this.renderInventoryGamePageGameCard = (element, index, backgroundColor, buttonText, borderStyle) => {

        if (element.innerText.trim() !== '') {
            let htmlTemplate = this.inventoryGamePageGameCardTemplate(index, buttonText, backgroundColor);
            element.innerHTML = htmlTemplate + element.innerHTML;
            element.style.border = borderStyle;
        } else {
            element.remove();
        }
    };

    this.addClickListenerToInventoryGamePageGameCardButton = function () {

        let self = this;

        document.querySelectorAll('.btn-action').forEach(function (element) {

            element.addEventListener('click', (function (self, event) {

                let borderStyle = self.UNMARK_BORDER_STYLE;
                let backgroundColor = self.UNMARK_BACKGROUND_COLOR;
                let buttonText = self.UNMARK_BUTTON_TEXT;
                let selected = 0;

                if (event.target.innerText === 'Mark') {
                    borderStyle = self.MARK_BORDER_STYLE;
                    backgroundColor = self.MARK_BACKGROUND_COLOR;
                    buttonText = self.MARK_BUTTON_TEXT;
                    selected = 1;
                }

                event.target.parentElement.style.border = borderStyle;
                event.target.innerText = buttonText;
                event.target.style.backgroundColor = backgroundColor;

                let inventoryData = self.loadInventoryData();
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

                self.saveInventoryData(inventoryData);

            }).bind(null, self));
        });
    };

    this.isSomethingMarked = (game) => {
        for (let key in game) {
            if (key !== 'name') {
                if (game[key] !== 0) {
                    return true;
                }
            }
        }
        return false;
    };

    this.appId = () => {
        let matches = window.location.href.match(/\.*\?inventorygame-appid-(\d*)/i);
        return matches[1];
    }

    this.appName = () => {
        return document.querySelector('.game-title').innerText.trim();
    }

    this.isInventoryPage = () => {
        return window.location.href.includes('?inventory') && !this.isInventoryGamePage();
    };

    this.isInventoryGamePage = () => {
        return window.location.href.includes('?inventorygame-appid-');
    };
}


