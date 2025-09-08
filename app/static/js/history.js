document.addEventListener("DOMContentLoaded", () => {
    let equityChart;
    const initialBalance = 10000;

    async function fetchHistory() {
        const response = await fetch('https://iucapitalfund.com/api/get_history');
        const data = await response.json();

        const accountTable = document.getElementById('accountTable');
        const dealTable = document.getElementById('dealTable');
        accountTable.innerHTML = "";
        dealTable.innerHTML = "";

        const filteredDeals = data.deals
            .filter(deal => deal.symbol && deal.symbol !== "US30" && !isNaN(deal.profit))
            .filter(deal => {
                const p = parseFloat(deal.profit);
                return p > 1 || p < -1;
            })
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

        const firstDate = new Date(filteredDeals[0]?.time);
        const startDateKey = firstDate.toISOString().split('T')[0];
        labels.push(startDateKey);
        equityHistory.push(initialBalance);
        dealInfo.push({
            time: firstDate.toISOString(),
            symbol: 'START',
            type: '',
            volume: '',
            profit: '0.00'
        });

        const equityMap = {};

        for (const deal of filteredDeals) {
            const profit = parseFloat(deal.profit);
            cumulative += profit;

            if (profit > 0) {
                grossProfit += profit;
                wins++;
            } else {
                grossLoss += Math.abs(profit);
                losses++;
            }

            peak = Math.max(peak, cumulative);

            const dealDate = new Date(deal.time);
            const dateKey = dealDate.toISOString().split('T')[0];

            equityMap[dateKey] = {
                equity: parseFloat(cumulative.toFixed(2)),
                deal: {
                    time: deal.time,
                    symbol: deal.symbol,
                    type: deal.type,
                    volume: deal.volume,
                    profit: profit.toFixed(2)
                }
            };
        }

        const sortedDates = Object.keys(equityMap).sort();
        for (const date of sortedDates) {
            labels.push(date);
            equityHistory.push(equityMap[date].equity);
            dealInfo.push(equityMap[date].deal);
        }

        const totalProfit = balance - initialBalance;
        const percentageGain = (totalProfit / initialBalance) * 100;
        const totalTrades = filteredDeals.length;

        const firstTradeDate = new Date(filteredDeals[0]?.time);
        const lastTradeDate = new Date(filteredDeals[filteredDeals.length - 1]?.time);
        const tradingDays = Math.floor((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24)) + 1;

        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit;
        const winRate = (wins / totalTrades) * 100 || 0;
        const profitClass = totalProfit >= 0 ? "positive" : "negative";
        const uniqueSymbols = [...new Set(filteredDeals.map(deal => deal.symbol))].join(', ');

        const avgProfitPerTrade = totalProfit / totalTrades || 0;
        const avgWin = wins > 0 ? grossProfit / wins : 0;
        const avgLoss = losses > 0 ? grossLoss / losses : 0;
        const profitLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;

        let peakEquity = initialBalance;
        let maxDrawdown = 0;
        for (const equity of equityHistory) {
            if (equity > peakEquity) peakEquity = equity;
            const drawdown = peakEquity - equity;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        let longestWinStreak = 0, longestLossStreak = 0;
        let currentWinStreak = 0, currentLossStreak = 0;

        for (const deal of filteredDeals) {
            const profit = parseFloat(deal.profit);
            if (profit > 0) {
                currentWinStreak++;
                currentLossStreak = 0;
                if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
            } else if (profit < 0) {
                currentLossStreak++;
                currentWinStreak = 0;
                if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
            } else {
                currentWinStreak = 0;
                currentLossStreak = 0;
            }
        }

        const totalVolume = filteredDeals.reduce((sum, deal) => sum + parseFloat(deal.volume || 0), 0);

        accountTable.innerHTML += `<tr><th>Starting Balance</th><td>$${initialBalance.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Current Balance</th><td>$${balance.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Total Profit / Loss</th><td class="profit ${profitClass}">$${totalProfit.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Percentage Gain</th><td class="profit ${profitClass}">${percentageGain.toFixed(2)}%</td></tr>`;
        accountTable.innerHTML += `<tr><th>Profit Factor</th><td>${profitFactor.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Win Rate</th><td>${winRate.toFixed(2)}%</td></tr>`;
        accountTable.innerHTML += `<tr><th>Traded Instruments</th><td>${uniqueSymbols}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Total Deals</th><td>${totalTrades}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Trading Days Count</th><td>${tradingDays}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Average Profit per Trade</th><td>$${avgProfitPerTrade.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Average Win</th><td>$${avgWin.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Average Loss</th><td>$${avgLoss.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Profit / Loss Ratio</th><td>${profitLossRatio.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Max Drawdown</th><td>$${maxDrawdown.toFixed(2)}</td></tr>`;
        accountTable.innerHTML += `<tr><th>Longest Winning Streak</th><td>${longestWinStreak} trades</td></tr>`;
        accountTable.innerHTML += `<tr><th>Longest Losing Streak</th><td>${longestLossStreak} trades</td></tr>`;
        accountTable.innerHTML += `<tr><th>Total Volume Traded</th><td>${totalVolume.toFixed(2)}</td></tr>`;

        for (const deal of filteredDeals.slice().reverse()) {
            const profit = parseFloat(deal.profit);
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

        // === FIXED Y-AXIS SCALE ===
        let minY = Math.min(...equityHistory);
        let maxY = Math.max(...equityHistory);

        if (minY === maxY) {
            minY -= 10;
            maxY += 10;
        } else {
            const range = maxY - minY;
            const padding = Math.max(10, range * 0.05);
            minY = Math.floor(minY - padding);
            maxY = Math.ceil(maxY + padding);
        }

        // Chart rendering
        const ctx = document.getElementById('equityChart').getContext('2d');
        if (equityChart) equityChart.destroy();

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(250, 204, 21, 0.4)');
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');

        equityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Equity Curve',
                    data: equityHistory,
                    borderColor: '#facc15',
                    backgroundColor: gradient,
                    pointBackgroundColor: '#facc15',
                    pointBorderColor: '#1e293b',
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBorderWidth: 1.5,
                    fill: true,
                    tension: 0.45,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 20
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#cbd5e1',
                            font: { family: 'Roboto Mono', size: 12 }
                        },
                        grid: {
                            color: 'rgba(100,116,139,0.2)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#cbd5e1',
                            font: { family: 'Roboto Mono', size: 12 }
                        },
                        grid: {
                            color: 'rgba(100,116,139,0.2)'
                        },
                        min: minY,
                        max: maxY
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'nearest',
                        intersect: false,
                        backgroundColor: '#1e293b',
                        titleColor: '#facc15',
                        bodyColor: '#e2e8f0',
                        borderColor: '#facc15',
                        borderWidth: 1,
                        cornerRadius: 6,
                        callbacks: {
                            label: function (context) {
                                const index = context.dataIndex;
                                const deal = dealInfo[index];
                                return [
                                    `${deal.symbol}`,
                                    `Type: ${deal.type}`,
                                    `Vol: ${deal.volume}`,
                                    `P&L: $${deal.profit}`,
                                    `🕒 ${new Date(deal.time).toLocaleString()}`
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

    fetchHistory();
});
