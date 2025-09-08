document.addEventListener("DOMContentLoaded", () => {
    let equityChart;

    async function fetchHistory() {
        const response = await fetch('https://iucapitalfund.com/api/get_history');
        const data = await response.json();

        const accountTable = document.getElementById('accountTable');
        const dealTable = document.getElementById('dealTable');
        accountTable.innerHTML = "";
        dealTable.innerHTML = "";

        // Calculate actual starting balance from deposit/withdrawal transactions
        const depositWithdrawals = data.deals
            .filter(deal => deal.comment === "Deposit" || deal.comment.includes("Withdrawal"))
            .sort((a, b) => new Date(a.time) - new Date(b.time));
        
        let actualStartingBalance = 0;
        for (const transaction of depositWithdrawals) {
            actualStartingBalance += parseFloat(transaction.profit);
        }

        // Get all trading deals (excluding deposits/withdrawals and zero PnL trades) for the graph
        const allTradingDeals = data.deals
            .filter(deal => deal.comment !== "Deposit" && !deal.comment.includes("Withdrawal"))
            .filter(deal => !isNaN(deal.profit))
            .filter(deal => parseFloat(deal.profit) !== 0)
            .sort((a, b) => new Date(a.time) - new Date(b.time));

        // Get filtered deals for display in the table
        const filteredDeals = allTradingDeals
            .filter(deal => deal.symbol)
            .filter(deal => {
                const p = parseFloat(deal.profit);
                return p > 1 || p < -1;
            });

        const balance = parseFloat(data.account.balance || actualStartingBalance);
        let cumulative = actualStartingBalance;
        let grossProfit = 0;
        let grossLoss = 0;
        let wins = 0;
        let losses = 0;
        let peak = actualStartingBalance;

        const equityHistory = [];
        const labels = [];
        const dealInfo = [];

        // Add starting point
        labels.push('START');
        equityHistory.push(actualStartingBalance);
        dealInfo.push({
            time: allTradingDeals[0]?.time || new Date().toISOString(),
            symbol: 'START',
            type: '',
            volume: '',
            profit: '0.00'
        });
        
        for (let i = 0; i < allTradingDeals.length; i++) {
            const deal = allTradingDeals[i];
            const profit = parseFloat(deal.profit);
            cumulative += profit;

            if (cumulative > peak) peak = cumulative;

            // Add each trade as a separate point on the graph
            labels.push(`Trade ${i + 1}`);
            equityHistory.push(parseFloat(cumulative.toFixed(2)));
            dealInfo.push({
                time: deal.time,
                symbol: deal.symbol || 'N/A',
                type: deal.type || 'N/A',
                volume: deal.volume || '0',
                profit: profit.toFixed(2)
            });
        }

        // Calculate statistics using filtered deals for display
        for (const deal of filteredDeals) {
            const profit = parseFloat(deal.profit);
            if (profit > 0) {
                grossProfit += profit;
                wins++;
            } else {
                grossLoss += Math.abs(profit);
                losses++;
            }
        }

        // Ensure the final equity value matches the current balance from API
        if (equityHistory.length > 0) {
            const finalEquity = equityHistory[equityHistory.length - 1];
            const expectedBalance = balance;
            
            // If there's a discrepancy, adjust the final point to match the API balance
            if (Math.abs(finalEquity - expectedBalance) > 0.01) {
                equityHistory[equityHistory.length - 1] = expectedBalance;
            }
        }

        const totalProfit = balance - actualStartingBalance;
        const percentageGain = (totalProfit / actualStartingBalance) * 100;
        const totalTrades = filteredDeals.length;

        const firstTradeDate = new Date(allTradingDeals[0]?.time);
        const lastTradeDate = new Date(allTradingDeals[allTradingDeals.length - 1]?.time);
        const tradingDays = Math.floor((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24)) + 1;

        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit;
        const winRate = (wins / totalTrades) * 100 || 0;
        const profitClass = totalProfit >= 0 ? "positive" : "negative";
        const uniqueSymbols = [...new Set(filteredDeals.map(deal => deal.symbol))].join(', ');

        const avgProfitPerTrade = totalProfit / totalTrades || 0;
        const avgWin = wins > 0 ? grossProfit / wins : 0;
        const avgLoss = losses > 0 ? grossLoss / losses : 0;
        const profitLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;

        let peakEquity = actualStartingBalance;
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

        accountTable.innerHTML += `<tr><th>Starting Balance</th><td>$${actualStartingBalance.toFixed(2)}</td></tr>`;
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
                    tension: 0,
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
                            display: false
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
