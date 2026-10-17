/*
 * MMM-MarketLite
 *
 * Lightweight stock and forex market module for MagicMirror.
 *
 * Data Source:
 * Twelve Data API
 *
 * Features:
 * - Configurable symbols
 * - Configurable refresh interval
 * - Configurable font size
 * - Stock and Forex support
 * - Bloomberg-style display
 *
 * Author:
 * Jiong Lu and Quill (the CoPilot Agent who did the most lift)
 *
 * Version:
 * v1.0
 * 2026/10/17
*/

Module.register("MMM-MarketLite", {

    /*
     * Default module configuration.
     * Values may be overridden in config.js.
     *
     * Configuration examples:
     *
     *  apiKey: "YOUR_API_KEY"
     *  updateInterval: 900
     *  fontSize: "16px"
     *  symbols: [
     *      "MSFT",
     *      "USD/HKD"
     *  ]
    */
        defaults: {
        // Refresh interval in seconds.
        // Example: 900 = 15 minutes.
        updateInterval: 900,

        // Module font size.
        // Example: "16px".
        fontSize: "16px",

        // List of stock and forex symbols.
        // Maximum supported: 7 symbols. -- if you want to change this limit, make sure to also update the value in node_helper.js       
        symbols: []
    },

    /*
     * Module startup.
     *
     * Initializes local data structures and
     * starts automatic market data refresh.
    */
    start: function () {

        Log.info("Starting module: " + this.name);

        // Storage for latest market data.
        this.marketData = [];
        // Timestamp shown beneath the table.
        this.lastUpdated = "Never";

        // Perform first market data refresh immediately.
        this.refreshData();

        // Refresh market data periodically.
        setInterval(() => {
            this.refreshData();
        }, this.config.updateInterval * 1000);

    },

    /*
     * Request market data from node_helper.js.
     *
     * The symbol list is limited to the first
     * seven entries to control display size
     * and API usage.
    */
    refreshData: function () {

        this.sendSocketNotification(
            "MARKETLITE_TEST",
            {
                // Go to TwelveData.com and sign up for a free account. After confirming your email, open your Dashboard → API Keys. Your personal key appears there immediately. 
                // Place the API Key in the MMM-MarketLite section of config.js
                apiKey: this.config.apiKey,
                // Limit display to a maximum of 7 symbols. -- if you want to change this limit, make sure to also update the value in node_helper.js       
                symbols: this.config.symbols.slice(0, 7)
            }
        );

    },

    /*
     * Receive market data returned by node_helper.js.
    */
    socketNotificationReceived: function(notification, payload) {

        if (notification === "MARKETLITE_DATA") {

            console.log("MARKETLITE_DATA", payload);
            
            // Replace existing data with new values.
            this.marketData = payload;

            // Record local refresh time.
            this.lastUpdated = new Date().toLocaleString();

            // Redraw the module.
            this.updateDom();

        }

    },
    
    /*
     * Load module stylesheet.
    */
    getStyles: function () {
        return ["MMM-MarketLite.css"];
    },

    /* Build the HTML table displayed
     * on the MagicMirror user interface.
    */
    getDom: function () {

        const wrapper = document.createElement("div");

        wrapper.className = "marketlite";

        wrapper.style.fontSize = this.config.fontSize;

        // Generate one table row per symbol.
        const rows = this.marketData.map(item => {

            // Price formatted to three decimals.
            const price =
                Number(item.price).toFixed(3);

            // Percentage change returned by Twelve Data.
            const pct =
                Number(item.changePercent);

            // Add a "+" in front of a positive %    
            const pctText =
                (pct > 0 ? "+" : "") +
                pct.toFixed(3) +
                "%";

            // Apply CSS styling based on market direction.    
            const cssClass =
                pct >= 0 ? "up" : "down";

            return `
                <tr>
                    <td>${item.symbol}</td>
                    <td>${price}</td>
                    <td class="${cssClass}">
                        ${pctText}
                    </td>
                </tr>
            `;

        }).join("");

        // Design of the table header, body and footer
        wrapper.innerHTML = `
            <table class="marketlite-table">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Price</th>
                        <th>CHG%</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="marketlite-updated">
                Last Updated: ${this.lastUpdated}
            </div>
        `;

        return wrapper;

    }

});
