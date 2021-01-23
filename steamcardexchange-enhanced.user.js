// ==UserScript==
// @name         Steam Card Exchange Enhanced
// @namespace    https://sergiosusa.com/
// @version      0.1
// @description  This script enhanced the famous steam trading cards site Steam Card Exchange.
// @author       Sergio Susa (https://sergiosusa.com)
// @match        https://www.steamcardexchange.net/index.php?inventorygame-appid-*
// @grant        none
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
    };

    this.renderInventoryGamePage = () => {

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

    };

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

                if (inventoryData[appId] === undefined) {
                    inventoryData[appId] = {};
                }

                inventoryData[appId][event.target.getAttribute('sce-enhanced-index')] = selected;
                self.saveInventoryData(inventoryData);

            }).bind(null, self));
        });
    };

    this.appId = () => {
        let matches = window.location.href.match(/\.*\?inventorygame-appid-(\d*)/i);
        return matches[1];
    }
}
