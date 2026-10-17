/*
 * MMM-MarketLite
 *
 * Backend Node Helper
 *
 * Responsibilities:
 * - Receive requests from MMM-MarketLite.js
 * - Query market data from Twelve Data
 * - Parse API responses
 * - Return market data to the front-end
 *
 * Data Flow:
 *
 * MMM-MarketLite.js
 *         │
 *         ▼
 * MARKETLITE_TEST
 *         │
 *         ▼
 * node_helper.js
 *         │
 *         ▼
 * Twelve Data API
 *         │
 *         ▼
 * MARKETLITE_DATA
 *         │
 *         ▼
 * MMM-MarketLite.js
*/

const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({

    /*
     * Start backend helper.
    */
    start() {
        console.log("MMM-MarketLite helper started");
    },

    /*
     * Query Twelve Data using a batch request.
     *
     * Supported asset types:
     * - Stocks
     * - ETFs
     * - Forex
     *
     * Note:
     * Twelve Data index symbols were found not to work with the quote endpoint.
    */
    fetchQuotes(symbols, apiKey) {

        // Convert symbol array into
        // Twelve Data batch format.
        const symbolList = symbols.join(",");

        const url =
            `https://api.twelvedata.com/quote?symbol=${symbolList}&apikey=${apiKey}`;

    // Safety check. The front-end already
    // limits symbols to 7 entries. -- if you change this limit, make sure to update the value in MMM-MarketLite.js       
	if (symbols.length > 7) {
    		console.log("MMM-MarketLite: limiting symbols to first 7");
	}

        console.log("Fetching:", symbolList);

        // Query Twelve Data API.
        https.get(url, (res) => {

            let data = "";

            res.on("data", chunk => {
                data += chunk;
            });

            res.on("end", () => {

                try {

                    const quotes = JSON.parse(data);

                    console.log("Twelve Data response:", quotes);

                    // Build simplified data structure used by MMM-MarketLite.js.
                    const marketData = [];

                    Object.keys(quotes).forEach(symbol => {

                        const quote = quotes[symbol];

                        if (quote && !quote.code) {

                            // Only keep fields required by
                            // the front-end display.
                            marketData.push({
                                symbol: quote.symbol,
                                price: quote.close,
                                changePercent: quote.percent_change
                            });

                        }

                    });
                    
                    // Send processed data back to the front end module.
                    this.sendSocketNotification(
                        "MARKETLITE_DATA",
                        marketData
                    );

                } catch (err) {
                    
                    // Invalid or unexpected API response.
                    console.error(
                        "MMM-MarketLite JSON parse error:",
                        err
                    );

                }

            });

        }).on("error", (err) => {

            // Network or API connection failure.
            console.error(
                "MMM-MarketLite request error:",
                err
            );

        });

    },

    /*
     * Receive requests from the front-end and trigger market data retrieval.
    */
    socketNotificationReceived(notification, payload) {

        if (notification === "MARKETLITE_TEST") {

            console.log(
                "MMM-MarketLite received:",
                payload
            );

            this.fetchQuotes(payload.symbols, payload.apiKey);

        }

    }

});
