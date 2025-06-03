document.addEventListener("DOMContentLoaded", () => {
    let equityChart;
    const initialBalance = 1000;

    async function fetchHistory() {
        const response = await fetch('https://iucapitalfund.com/api/get_history');
        const data = await response.json();

        const accountTable = document.getElementById('accountTable');
        const dealTable = document.getElementById('dealTable');
        accountTable.innerHTML = "";
        dealTable.innerHTML = "";

        const sortedDeals = data.deals
        .filter(deal => deal.symbol && deal.symbol !== "BTCUSD" && deal.symbol !== "US30" && !isNaN(deal.profit))
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    

        const balance = parseFloat(data.account.balance || initialBalance);
        let cumulative = initialBalance;
        let grossProfit = 0;
        let grossLoss = 0;
        let wins = 0;
        let losses = 0;
        let peak = initialBalance;

        const equityHistory = [];
        const labels = [];
        const dealInfo = [];

        for (const deal of sortedDeals) {
            const profit = parseFloat(deal.profit);

            if (profit === 0) continue;

            cumulative += profit;

            if (profit > 0) {
                grossProfit += profit;
                wins++;
            } else if (profit < 0) {
                grossLoss += Math.abs(profit);
                losses++;
            }

            peak = Math.max(peak, cumulative);

            const dealDate = new Date(deal.time);
            const dateLabel = dealDate.toLocaleDateString();
            labels.push(dateLabel);
            equityHistory.push(parseFloat(cumulative.toFixed(2)));

            dealInfo.push({
                time: deal.time,
                symbol: deal.symbol,
                type: deal.type,
                volume: deal.volume,
                profit: profit.toFixed(2)
            });
        }

        const totalProfit = balance - initialBalance;
        const percentageGain = (totalProfit / initialBalance) * 100;
        const totalTrades = sortedDeals.length;

        const firstTradeDate = new Date(sortedDeals[0].time);
        const lastTradeDate = new Date(sortedDeals[sortedDeals.length - 1].time);

        const msPerDay = 1000 * 60 * 60 * 24;
        const tradingDays = Math.floor((lastTradeDate - firstTradeDate) / msPerDay) + 1;

        // No weeklyEquity calculation here since it's empty in original code

        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit;
        const winRate = (wins / totalTrades) * 100 || 0;
        const profitClass = totalProfit >= 0 ? "positive" : "negative";
        const uniqueSymbols = [...new Set(sortedDeals.map(deal => deal.symbol))].join(', ');

        accountTable.innerHTML += `<tr><th>Account Balance</th><td>$ ${balance.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Total Profit / Loss</th><td class="profit ${profitClass}">$ ${totalProfit.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Percentage Gain</th><td class="profit ${profitClass}">${percentageGain.toFixed(2)}%</td></tr>`;
        accountTable.innerHTML += `<tr><th>Profit Factor</th><td>${profitFactor.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Win Rate</th><td>${winRate.toFixed(2)}%</td></tr>`;   
        accountTable.innerHTML += `<tr><th>Traded Instruments</th><td>${uniqueSymbols}</td></tr>`; 
        accountTable.innerHTML += `<tr><th>Total Deals</th><td>${totalTrades}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Trading Days Count</th><td>${tradingDays}</td></tr>`;

        // Show deals in reverse chronological order
        for (const deal of sortedDeals.slice().reverse()) {
            const profit = parseFloat(deal.profit);
            if (profit === 0) continue;

            const dealProfitClass = profit >= 0 ? "positive" : "negative";
            dealTable.innerHTML += `
                <tr>
                    <td>${deal.time}</td>
                    <td>${deal.symbol}</td>
                    <td>${deal.type}</td>
                    <td>${deal.volume}</td>
                    <td class="profit ${dealProfitClass}">$${profit.toFixed(2)}</td>
                </tr>
            `;
        }

        // Chart drawing
        const ctx = document.getElementById('equityChart').getContext('2d');
        if (equityChart) equityChart.destroy();

        const minY = Math.min(...equityHistory);
        const maxY = Math.max(...equityHistory);
        const padding = (maxY - minY) * 0.1;

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(250, 204, 21, 0.4)');
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');

        equityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Equity',
                    data: equityHistory,
                    borderColor: '#facc15',
                    backgroundColor: gradient,
                    pointBackgroundColor: '#facc15',
                    pointBorderColor: '#1e293b',
                    pointHoverRadius: 6,
                    pointRadius: 4,
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { color: '#e2e8f0', maxRotation: 60 },
                        grid: { color: '#334155' }
                    },
                    y: {
                        ticks: { color: '#e2e8f0' },
                        grid: { color: '#334155' },
                        min: Math.floor(minY - padding),
                        max: Math.ceil(maxY + padding)
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#facc15',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'nearest',
                        intersect: false,
                        backgroundColor: '#1e293b',
                        titleColor: '#facc15',
                        bodyColor: '#e2e8f0',
                        borderColor: '#facc15',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                const index = context.dataIndex;
                                const deal = dealInfo[index];
                                return [
                                    `Symbol: ${deal.symbol}`,
                                    `Type: ${deal.type}`,
                                    `Volume: ${deal.volume}`,
                                    `Profit: $${deal.profit}`,
                                    `Time: ${new Date(deal.time).toLocaleString()}`
                                ];
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    // Call fetchHistory once on page load
    fetchHistory();        
});
