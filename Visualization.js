const Chart = require('chart.js');

class TradingVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.charts = {};
        this.data = {
            price: [],
            volume: [],
            indicators: {},
            trades: [],
            performance: []
        };
        
        this.initialize();
    }

    initialize() {
        // Cria gráficos
        this.createPriceChart();
        this.createIndicatorCharts();
        this.createVolumeChart();
        this.createPerformanceChart();
    }

    createPriceChart() {
        const ctx = this.canvas.getContext('2d');
        
        this.charts.price = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'Price',
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'right'
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    createIndicatorCharts() {
        const indicators = [
            'MACD', 'RSI', 'Stochastic', 'ADX',
            'CCI', 'MFI', 'OBV', 'ATR'
        ];
        
        indicators.forEach(indicator => {
            const canvas = document.createElement('canvas');
            document.getElementById('indicators').appendChild(canvas);
            
            this.charts[indicator] = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'minute'
                            }
                        },
                        y: {
                            type: 'linear',
                            position: 'right'
                        }
                    }
                }
            });
        });
    }

    createVolumeChart() {
        const canvas = document.createElement('canvas');
        document.getElementById('volume').appendChild(canvas);
        
        this.charts.volume = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                datasets: [{
                    label: 'Volume',
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'right'
                    }
                }
            }
        });
    }

    createPerformanceChart() {
        const canvas = document.createElement('canvas');
        document.getElementById('performance').appendChild(canvas);
        
        this.charts.performance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Balance',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Equity',
                        data: [],
                        borderColor: 'rgb(153, 102, 255)',
                        tension: 0.1
                    },
                    {
                        label: 'Drawdown',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'right'
                    }
                }
            }
        });
    }

    update(state) {
        // Atualiza dados
        this.updatePriceData(state);
        this.updateIndicatorData(state);
        this.updateVolumeData(state);
        this.updatePerformanceData(state);
        
        // Atualiza gráficos
        this.updateCharts();
    }

    updatePriceData(state) {
        const price = {
            x: state.timestamp,
            o: state.price.open,
            h: state.price.high,
            l: state.price.low,
            c: state.price.close
        };
        
        this.data.price.push(price);
        if (this.data.price.length > 1000) {
            this.data.price.shift();
        }
    }

    updateIndicatorData(state) {
        const timestamp = state.timestamp;
        
        // MACD
        this.data.indicators.macd = this.data.indicators.macd || [];
        this.data.indicators.macd.push({
            x: timestamp,
            macd: state.indicators.macd.line,
            signal: state.indicators.macd.signal,
            histogram: state.indicators.macd.histogram
        });
        
        // RSI
        this.data.indicators.rsi = this.data.indicators.rsi || [];
        this.data.indicators.rsi.push({
            x: timestamp,
            value: state.indicators.rsi
        });
        
        // Stochastic
        this.data.indicators.stochastic = this.data.indicators.stochastic || [];
        this.data.indicators.stochastic.push({
            x: timestamp,
            k: state.indicators.stochastic.k,
            d: state.indicators.stochastic.d
        });
        
        // ADX
        this.data.indicators.adx = this.data.indicators.adx || [];
        this.data.indicators.adx.push({
            x: timestamp,
            adx: state.indicators.adx.value,
            plusDI: state.indicators.adx.plusDI,
            minusDI: state.indicators.adx.minusDI
        });
        
        // Outros indicadores
        ['cci', 'mfi', 'obv', 'atr'].forEach(indicator => {
            this.data.indicators[indicator] = this.data.indicators[indicator] || [];
            this.data.indicators[indicator].push({
                x: timestamp,
                value: state.indicators[indicator]
            });
        });
        
        // Limita tamanho dos dados
        Object.values(this.data.indicators).forEach(arr => {
            if (arr.length > 1000) arr.shift();
        });
    }

    updateVolumeData(state) {
        this.data.volume.push({
            x: state.timestamp,
            y: state.price.volume
        });
        
        if (this.data.volume.length > 1000) {
            this.data.volume.shift();
        }
    }

    updatePerformanceData(state) {
        this.data.performance.push({
            x: state.timestamp,
            balance: state.balance,
            equity: state.equity,
            drawdown: state.metrics.maxDrawdown
        });
        
        if (this.data.performance.length > 1000) {
            this.data.performance.shift();
        }
    }

    updateCharts() {
        // Atualiza gráfico de preços
        this.charts.price.data.datasets[0].data = this.data.price;
        this.charts.price.update('quiet');
        
        // Atualiza gráficos de indicadores
        this.updateIndicatorCharts();
        
        // Atualiza gráfico de volume
        this.charts.volume.data.datasets[0].data = this.data.volume;
        this.charts.volume.update('quiet');
        
        // Atualiza gráfico de performance
        this.updatePerformanceChart();
    }

    updateIndicatorCharts() {
        // MACD
        this.charts.MACD.data.datasets = [
            {
                label: 'MACD',
                data: this.data.indicators.macd.map(d => ({
                    x: d.x,
                    y: d.macd
                })),
                borderColor: 'rgb(75, 192, 192)'
            },
            {
                label: 'Signal',
                data: this.data.indicators.macd.map(d => ({
                    x: d.x,
                    y: d.signal
                })),
                borderColor: 'rgb(255, 99, 132)'
            },
            {
                label: 'Histogram',
                data: this.data.indicators.macd.map(d => ({
                    x: d.x,
                    y: d.histogram
                })),
                type: 'bar',
                backgroundColor: d => 
                    d.raw.y >= 0 ? 'rgba(75, 192, 192, 0.5)' : 
                                  'rgba(255, 99, 132, 0.5)'
            }
        ];
        this.charts.MACD.update('quiet');
        
        // RSI
        this.charts.RSI.data.datasets = [{
            label: 'RSI',
            data: this.data.indicators.rsi.map(d => ({
                x: d.x,
                y: d.value
            })),
            borderColor: 'rgb(75, 192, 192)'
        }];
        this.charts.RSI.update('quiet');
        
        // Stochastic
        this.charts.Stochastic.data.datasets = [
            {
                label: '%K',
                data: this.data.indicators.stochastic.map(d => ({
                    x: d.x,
                    y: d.k
                })),
                borderColor: 'rgb(75, 192, 192)'
            },
            {
                label: '%D',
                data: this.data.indicators.stochastic.map(d => ({
                    x: d.x,
                    y: d.d
                })),
                borderColor: 'rgb(255, 99, 132)'
            }
        ];
        this.charts.Stochastic.update('quiet');
        
        // ADX
        this.charts.ADX.data.datasets = [
            {
                label: 'ADX',
                data: this.data.indicators.adx.map(d => ({
                    x: d.x,
                    y: d.adx
                })),
                borderColor: 'rgb(75, 192, 192)'
            },
            {
                label: '+DI',
                data: this.data.indicators.adx.map(d => ({
                    x: d.x,
                    y: d.plusDI
                })),
                borderColor: 'rgb(255, 99, 132)'
            },
            {
                label: '-DI',
                data: this.data.indicators.adx.map(d => ({
                    x: d.x,
                    y: d.minusDI
                })),
                borderColor: 'rgb(153, 102, 255)'
            }
        ];
        this.charts.ADX.update('quiet');
        
        // Outros indicadores
        ['CCI', 'MFI', 'OBV', 'ATR'].forEach(indicator => {
            this.charts[indicator].data.datasets = [{
                label: indicator,
                data: this.data.indicators[indicator.toLowerCase()].map(d => ({
                    x: d.x,
                    y: d.value
                })),
                borderColor: 'rgb(75, 192, 192)'
            }];
            this.charts[indicator].update('quiet');
        });
    }

    updatePerformanceChart() {
        const datasets = this.charts.performance.data.datasets;
        
        datasets[0].data = this.data.performance.map(d => ({
            x: d.x,
            y: d.balance
        }));
        
        datasets[1].data = this.data.performance.map(d => ({
            x: d.x,
            y: d.equity
        }));
        
        datasets[2].data = this.data.performance.map(d => ({
            x: d.x,
            y: d.drawdown * 100  // Converte para porcentagem
        }));
        
        this.charts.performance.update('quiet');
    }

    addTrade(trade) {
        this.data.trades.push(trade);
        
        // Adiciona marcador no gráfico de preços
        const marker = {
            x: trade.timestamp,
            y: trade.price,
            type: trade.type,
            profit: trade.profit
        };
        
        const dataset = {
            type: 'scatter',
            label: `${trade.type} (${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)})`,
            data: [marker],
            backgroundColor: trade.profit > 0 ? 'green' : 'red',
            pointStyle: trade.type === 'buy' ? 'triangle' : 'triangle-down',
            pointRadius: 8
        };
        
        this.charts.price.data.datasets.push(dataset);
        this.charts.price.update('quiet');
    }

    dispose() {
        Object.values(this.charts).forEach(chart => chart.destroy());
    }
}

module.exports = TradingVisualizer;
