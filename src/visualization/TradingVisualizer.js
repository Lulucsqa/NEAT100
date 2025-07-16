class TradingVisualizer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.options = {
            width: options.width || 1200,
            height: options.height || 800,
            backgroundColor: options.backgroundColor || '#1a1a1a',
            gridColor: options.gridColor || '#333333',
            textColor: options.textColor || '#ffffff',
            ...options
        };
        
        this.setupCanvas();
        this.initializeData();
    }

    setupCanvas() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.backgroundColor = this.options.backgroundColor;
    }

    initializeData() {
        this.priceData = [];
        this.indicators = {};
        this.trades = [];
        this.currentIndex = 0;
        this.viewportStart = 0;
        this.viewportEnd = 100;
        
        // Layout configuration
        this.layout = {
            priceChart: { x: 50, y: 50, width: 800, height: 300 },
            indicatorChart: { x: 50, y: 370, width: 800, height: 150 },
            infoPanel: { x: 870, y: 50, width: 300, height: 470 },
            performanceChart: { x: 50, y: 540, width: 400, height: 200 },
            equityChart: { x: 470, y: 540, width: 400, height: 200 }
        };
    }

    updateData(environment) {
        this.priceData = environment.priceData;
        this.indicators = environment.indicators;
        this.trades = environment.trades;
        this.currentIndex = environment.currentIndex;
        this.balance = environment.balance;
        this.positions = environment.positions;
        this.performance = environment.getPerformanceMetrics();
        
        this.adjustViewport();
        this.render();
    }

    adjustViewport() {
        const viewportSize = 100;
        this.viewportEnd = Math.min(this.currentIndex + 20, this.priceData.length - 1);
        this.viewportStart = Math.max(0, this.viewportEnd - viewportSize);
    }

    render() {
        this.clearCanvas();
        this.drawGrid();
        this.drawPriceChart();
        this.drawIndicators();
        this.drawTrades();
        this.drawInfoPanel();
        this.drawPerformanceChart();
        this.drawEquityChart();
        this.drawCurrentPosition();
    }

    clearCanvas() {
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines
        const { priceChart } = this.layout;
        for (let i = 0; i <= 10; i++) {
            const x = priceChart.x + (i * priceChart.width / 10);
            this.ctx.beginPath();
            this.ctx.moveTo(x, priceChart.y);
            this.ctx.lineTo(x, priceChart.y + priceChart.height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = priceChart.y + (i * priceChart.height / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(priceChart.x, y);
            this.ctx.lineTo(priceChart.x + priceChart.width, y);
            this.ctx.stroke();
        }
    }

    drawPriceChart() {
        if (!this.priceData || this.priceData.length === 0) return;
        
        const { priceChart } = this.layout;
        const visibleData = this.priceData.slice(this.viewportStart, this.viewportEnd + 1);
        
        if (visibleData.length === 0) return;
        
        // Calculate price range
        const prices = visibleData.map(d => d.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        
        // Draw candlesticks
        const candleWidth = priceChart.width / visibleData.length * 0.8;
        
        visibleData.forEach((data, i) => {
            const x = priceChart.x + (i * priceChart.width / visibleData.length);
            const openY = priceChart.y + priceChart.height - ((data.open - minPrice) / priceRange * priceChart.height);
            const closeY = priceChart.y + priceChart.height - ((data.close - minPrice) / priceRange * priceChart.height);
            const highY = priceChart.y + priceChart.height - ((data.high - minPrice) / priceRange * priceChart.height);
            const lowY = priceChart.y + priceChart.height - ((data.low - minPrice) / priceRange * priceChart.height);
            
            // Determine candle color
            const isGreen = data.close > data.open;
            this.ctx.strokeStyle = isGreen ? '#00ff00' : '#ff0000';
            this.ctx.fillStyle = isGreen ? '#00ff0040' : '#ff000040';
            
            // Draw high-low line
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + candleWidth/2, highY);
            this.ctx.lineTo(x + candleWidth/2, lowY);
            this.ctx.stroke();
            
            // Draw open-close rectangle
            const rectHeight = Math.abs(closeY - openY);
            this.ctx.fillRect(x, Math.min(openY, closeY), candleWidth, rectHeight);
            this.ctx.strokeRect(x, Math.min(openY, closeY), candleWidth, rectHeight);
        });
        
        // Draw price labels
        this.drawPriceLabels(minPrice, maxPrice, priceChart);
    }

    drawPriceLabels(minPrice, maxPrice, chart) {
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        
        for (let i = 0; i <= 5; i++) {
            const price = minPrice + (maxPrice - minPrice) * (i / 5);
            const y = chart.y + chart.height - (i * chart.height / 5);
            this.ctx.fillText(price.toFixed(4), chart.x - 10, y + 4);
        }
    }

    drawIndicators() {
        if (!this.indicators || !this.indicators.macd) return;
        
        const { indicatorChart } = this.layout;
        const visibleMacd = this.indicators.macd.macd.slice(this.viewportStart, this.viewportEnd + 1);
        const visibleSignal = this.indicators.macd.signal.slice(this.viewportStart, this.viewportEnd + 1);
        
        if (visibleMacd.length === 0) return;
        
        // Calculate MACD range
        const allValues = [...visibleMacd, ...visibleSignal].filter(v => !isNaN(v));
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        
        // Draw MACD line
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        visibleMacd.forEach((value, i) => {
            if (!isNaN(value)) {
                const x = indicatorChart.x + (i * indicatorChart.width / visibleMacd.length);
                const y = indicatorChart.y + indicatorChart.height - ((value - minValue) / valueRange * indicatorChart.height);
                
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();
        
        // Draw Signal line
        this.ctx.strokeStyle = '#ff6600';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        visibleSignal.forEach((value, i) => {
            if (!isNaN(value)) {
                const x = indicatorChart.x + (i * indicatorChart.width / visibleSignal.length);
                const y = indicatorChart.y + indicatorChart.height - ((value - minValue) / valueRange * indicatorChart.height);
                
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();
        
        // Draw zero line
        if (minValue < 0 && maxValue > 0) {
            const zeroY = indicatorChart.y + indicatorChart.height - ((-minValue) / valueRange * indicatorChart.height);
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(indicatorChart.x, zeroY);
            this.ctx.lineTo(indicatorChart.x + indicatorChart.width, zeroY);
            this.ctx.stroke();
        }
    }

    drawTrades() {
        if (!this.trades || this.trades.length === 0) return;
        
        const { priceChart } = this.layout;
        const visibleData = this.priceData.slice(this.viewportStart, this.viewportEnd + 1);
        
        if (visibleData.length === 0) return;
        
        const prices = visibleData.map(d => d.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        
        this.trades.forEach(trade => {
            const tradeIndex = this.priceData.findIndex(d => 
                Math.abs(d.timestamp - trade.timestamp) < 60000
            );
            
            if (tradeIndex >= this.viewportStart && tradeIndex <= this.viewportEnd) {
                const relativeIndex = tradeIndex - this.viewportStart;
                const x = priceChart.x + (relativeIndex * priceChart.width / visibleData.length);
                
                let y;
                if (trade.type === 'open') {
                    y = priceChart.y + priceChart.height - ((trade.price - minPrice) / priceRange * priceChart.height);
                } else {
                    y = priceChart.y + priceChart.height - ((trade.exit - minPrice) / priceRange * priceChart.height);
                }
                
                // Draw trade marker
                this.ctx.fillStyle = trade.type === 'open' ? 
                    (trade.direction === 'long' ? '#00ff00' : '#ff0000') :
                    (trade.pnl > 0 ? '#00ff00' : '#ff0000');
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Draw trade label
                this.ctx.fillStyle = this.options.textColor;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    trade.type === 'open' ? 
                        (trade.direction === 'long' ? 'B' : 'S') :
                        (trade.pnl > 0 ? '+' : '-'),
                    x, y - 10
                );
            }
        });
    }

    drawInfoPanel() {
        const { infoPanel } = this.layout;
        
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(infoPanel.x, infoPanel.y, infoPanel.width, infoPanel.height);
        
        this.ctx.strokeStyle = '#444444';
        this.ctx.strokeRect(infoPanel.x, infoPanel.y, infoPanel.width, infoPanel.height);
        
        // Draw info text
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = infoPanel.y + 25;
        const lineHeight = 20;
        
        // Account info
        this.ctx.fillText(`Balance: $${this.balance?.toFixed(2) || '0.00'}`, infoPanel.x + 10, y);
        y += lineHeight;
        
        this.ctx.fillText(`Open Positions: ${this.positions?.length || 0}`, infoPanel.x + 10, y);
        y += lineHeight;
        
        this.ctx.fillText(`Total Trades: ${this.trades?.length || 0}`, infoPanel.x + 10, y);
        y += lineHeight * 1.5;
        
        // Performance metrics
        if (this.performance) {
            this.ctx.fillText('Performance:', infoPanel.x + 10, y);
            y += lineHeight;
            
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Win Rate: ${(this.performance.winRate * 100).toFixed(1)}%`, infoPanel.x + 20, y);
            y += lineHeight;
            
            this.ctx.fillText(`Total Return: ${(this.performance.totalReturn * 100).toFixed(2)}%`, infoPanel.x + 20, y);
            y += lineHeight;
            
            this.ctx.fillText(`Max Drawdown: ${(this.performance.maxDrawdown * 100).toFixed(2)}%`, infoPanel.x + 20, y);
            y += lineHeight;
            
            this.ctx.fillText(`Sharpe Ratio: ${this.performance.sharpeRatio.toFixed(3)}`, infoPanel.x + 20, y);
            y += lineHeight * 1.5;
        }
        
        // Current indicators
        if (this.indicators && this.currentIndex > 0) {
            this.ctx.font = '14px Arial';
            this.ctx.fillText('Current Indicators:', infoPanel.x + 10, y);
            y += lineHeight;
            
            this.ctx.font = '12px Arial';
            
            if (this.indicators.macd) {
                const macd = this.indicators.macd.macd[this.currentIndex];
                const signal = this.indicators.macd.signal[this.currentIndex];
                this.ctx.fillText(`MACD: ${macd?.toFixed(4) || 'N/A'}`, infoPanel.x + 20, y);
                y += lineHeight;
                this.ctx.fillText(`Signal: ${signal?.toFixed(4) || 'N/A'}`, infoPanel.x + 20, y);
                y += lineHeight;
            }
            
            if (this.indicators.adx) {
                const adx = this.indicators.adx.adx[this.currentIndex];
                this.ctx.fillText(`ADX: ${adx?.toFixed(2) || 'N/A'}`, infoPanel.x + 20, y);
                y += lineHeight;
            }
        }
    }

    drawPerformanceChart() {
        const { performanceChart } = this.layout;
        
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(performanceChart.x, performanceChart.y, performanceChart.width, performanceChart.height);
        
        this.ctx.strokeStyle = '#444444';
        this.ctx.strokeRect(performanceChart.x, performanceChart.y, performanceChart.width, performanceChart.height);
        
        // Title
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Trade P&L Distribution', 
            performanceChart.x + performanceChart.width/2, 
            performanceChart.y + 20
        );
        
        if (!this.trades || this.trades.length === 0) return;
        
        // Create histogram of P&L
        const pnls = this.trades.map(t => t.pnl || 0).filter(p => p !== 0);
        if (pnls.length === 0) return;
        
        const minPnl = Math.min(...pnls);
        const maxPnl = Math.max(...pnls);
        const range = maxPnl - minPnl;
        
        const bins = 10;
        const binSize = range / bins;
        const histogram = new Array(bins).fill(0);
        
        pnls.forEach(pnl => {
            const binIndex = Math.min(Math.floor((pnl - minPnl) / binSize), bins - 1);
            histogram[binIndex]++;
        });
        
        const maxCount = Math.max(...histogram);
        const barWidth = (performanceChart.width - 40) / bins;
        
        histogram.forEach((count, i) => {
            const barHeight = (count / maxCount) * (performanceChart.height - 60);
            const x = performanceChart.x + 20 + i * barWidth;
            const y = performanceChart.y + performanceChart.height - 20 - barHeight;
            
            this.ctx.fillStyle = i < bins/2 ? '#ff4444' : '#44ff44';
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        });
    }

    drawEquityChart() {
        const { equityChart } = this.layout;
        
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(equityChart.x, equityChart.y, equityChart.width, equityChart.height);
        
        this.ctx.strokeStyle = '#444444';
        this.ctx.strokeRect(equityChart.x, equityChart.y, equityChart.width, equityChart.height);
        
        // Title
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Equity Curve', 
            equityChart.x + equityChart.width/2, 
            equityChart.y + 20
        );
        
        if (!this.trades || this.trades.length < 2) return;
        
        // Calculate running equity
        let runningBalance = 10000; // Initial balance
        const equityPoints = [runningBalance];
        
        this.trades.forEach(trade => {
            if (trade.pnl) {
                runningBalance += trade.pnl;
                equityPoints.push(runningBalance);
            }
        });
        
        if (equityPoints.length < 2) return;
        
        const minEquity = Math.min(...equityPoints);
        const maxEquity = Math.max(...equityPoints);
        const equityRange = maxEquity - minEquity;
        
        // Draw equity line
        this.ctx.strokeStyle = '#00aaff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        equityPoints.forEach((equity, i) => {
            const x = equityChart.x + 20 + (i * (equityChart.width - 40) / (equityPoints.length - 1));
            const y = equityChart.y + equityChart.height - 40 - ((equity - minEquity) / equityRange * (equityChart.height - 60));
            
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();
    }

    drawCurrentPosition() {
        if (this.currentIndex < this.viewportStart || this.currentIndex > this.viewportEnd) return;
        
        const { priceChart } = this.layout;
        const relativeIndex = this.currentIndex - this.viewportStart;
        const visibleData = this.priceData.slice(this.viewportStart, this.viewportEnd + 1);
        
        if (visibleData.length === 0) return;
        
        const x = priceChart.x + (relativeIndex * priceChart.width / visibleData.length);
        
        // Draw vertical line
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, priceChart.y);
        this.ctx.lineTo(x, priceChart.y + priceChart.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // Public methods for external control
    zoomIn() {
        const currentRange = this.viewportEnd - this.viewportStart;
        const newRange = Math.max(20, currentRange * 0.8);
        const center = (this.viewportStart + this.viewportEnd) / 2;
        
        this.viewportStart = Math.max(0, center - newRange / 2);
        this.viewportEnd = Math.min(this.priceData.length - 1, center + newRange / 2);
        this.render();
    }

    zoomOut() {
        const currentRange = this.viewportEnd - this.viewportStart;
        const newRange = Math.min(this.priceData.length, currentRange * 1.2);
        const center = (this.viewportStart + this.viewportEnd) / 2;
        
        this.viewportStart = Math.max(0, center - newRange / 2);
        this.viewportEnd = Math.min(this.priceData.length - 1, center + newRange / 2);
        this.render();
    }

    panLeft() {
        const range = this.viewportEnd - this.viewportStart;
        const panAmount = range * 0.1;
        
        this.viewportStart = Math.max(0, this.viewportStart - panAmount);
        this.viewportEnd = this.viewportStart + range;
        this.render();
    }

    panRight() {
        const range = this.viewportEnd - this.viewportStart;
        const panAmount = range * 0.1;
        
        this.viewportEnd = Math.min(this.priceData.length - 1, this.viewportEnd + panAmount);
        this.viewportStart = this.viewportEnd - range;
        this.render();
    }

    reset() {
        this.initializeData();
        this.render();
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingVisualizer;
} else if (typeof window !== 'undefined') {
    window.TradingVisualizer = TradingVisualizer;
}