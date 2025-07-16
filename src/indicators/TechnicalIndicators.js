class TechnicalIndicators {
    // Indicadores de Tendência
    static calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = [prices[0]];
        
        for (let i = 1; i < prices.length; i++) {
            ema.push((prices[i] - ema[i-1]) * multiplier + ema[i-1]);
        }
        
        return ema;
    }

    static calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macd = ema12.map((v, i) => v - ema26[i]);
        const signal = this.calculateEMA(macd, 9);
        const histogram = macd.map((v, i) => v - signal[i]);
        
        return { macd, signal, histogram };
    }

    static calculateADX(high, low, close, period = 14) {
        // Cálculo do DMI (Directional Movement Index)
        const plusDM = [], minusDM = [];
        const trueRange = [];
        
        for (let i = 1; i < close.length; i++) {
            const highDiff = high[i] - high[i-1];
            const lowDiff = low[i-1] - low[i];
            
            plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
            minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
            
            trueRange.push(Math.max(
                high[i] - low[i],
                Math.abs(high[i] - close[i-1]),
                Math.abs(low[i] - close[i-1])
            ));
        }
        
        // Suavização
        const smoothPlusDM = this.calculateEMA(plusDM, period);
        const smoothMinusDM = this.calculateEMA(minusDM, period);
        const smoothTR = this.calculateEMA(trueRange, period);
        
        // Cálculo do +DI e -DI
        const plusDI = smoothPlusDM.map((v, i) => (v / smoothTR[i]) * 100);
        const minusDI = smoothMinusDM.map((v, i) => (v / smoothTR[i]) * 100);
        
        // Cálculo do ADX
        const dx = plusDI.map((v, i) => 
            Math.abs(v - minusDI[i]) / (v + minusDI[i]) * 100
        );
        
        return {
            adx: this.calculateEMA(dx, period),
            plusDI,
            minusDI
        };
    }

    // Indicadores de Momentum
    static calculateStochastic(high, low, close, period = 14, smoothK = 3, smoothD = 3) {
        const k = [];
        
        for (let i = period - 1; i < close.length; i++) {
            const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
            const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
            k.push(((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100);
        }
        
        const smoothedK = this.calculateEMA(k, smoothK);
        const d = this.calculateEMA(smoothedK, smoothD);
        
        return { k: smoothedK, d };
    }

    static calculateCCI(high, low, close, period = 20) {
        const tp = high.map((v, i) => (v + low[i] + close[i]) / 3);
        const sma = [];
        const meanDev = [];
        
        for (let i = period - 1; i < tp.length; i++) {
            const slice = tp.slice(i - period + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b) / period;
            sma.push(mean);
            
            const deviation = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
            meanDev.push(deviation);
        }
        
        return sma.map((v, i) => 
            (tp[i + period - 1] - v) / (0.015 * meanDev[i])
        );
    }

    // Indicadores de Volume
    static calculateOBV(close, volume) {
        const obv = [0];
        
        for (let i = 1; i < close.length; i++) {
            obv.push(
                obv[i-1] + (
                    close[i] > close[i-1] ? volume[i] :
                    close[i] < close[i-1] ? -volume[i] : 0
                )
            );
        }
        
        return obv;
    }

    static calculateMFI(high, low, close, volume, period = 14) {
        const tp = high.map((v, i) => (v + low[i] + close[i]) / 3);
        const mf = tp.map((v, i) => v * volume[i]);
        
        const positiveMF = [0];
        const negativeMF = [0];
        
        for (let i = 1; i < mf.length; i++) {
            if (tp[i] > tp[i-1]) {
                positiveMF.push(mf[i]);
                negativeMF.push(0);
            } else {
                positiveMF.push(0);
                negativeMF.push(mf[i]);
            }
        }
        
        const mfi = [];
        
        for (let i = period - 1; i < mf.length; i++) {
            const positiveSum = positiveMF.slice(i - period + 1, i + 1)
                .reduce((a, b) => a + b);
            const negativeSum = negativeMF.slice(i - period + 1, i + 1)
                .reduce((a, b) => a + b);
                
            mfi.push(100 - (100 / (1 + positiveSum / negativeSum)));
        }
        
        return mfi;
    }

    // Indicadores de Volatilidade
    static calculateATR(high, low, close, period = 14) {
        const tr = [high[0] - low[0]];
        
        for (let i = 1; i < close.length; i++) {
            tr.push(Math.max(
                high[i] - low[i],
                Math.abs(high[i] - close[i-1]),
                Math.abs(low[i] - close[i-1])
            ));
        }
        
        return this.calculateEMA(tr, period);
    }

    static calculateKeltnerChannels(high, low, close, period = 20, multiplier = 2) {
        const middle = this.calculateEMA(close, period);
        const atr = this.calculateATR(high, low, close, period);
        
        const upper = middle.map((v, i) => v + multiplier * atr[i]);
        const lower = middle.map((v, i) => v - multiplier * atr[i]);
        
        return { upper, middle, lower };
    }

    // Indicadores Personalizados
    static calculateMarketRegime(close, volume, period = 20) {
        const returns = close.slice(1).map((v, i) => (v - close[i]) / close[i]);
        const high = close; // Simplificado para este contexto
        const low = close;
        const volatility = this.calculateATR(high, low, close, period);
        const volumeChange = volume.slice(1).map((v, i) => (v - volume[i]) / volume[i]);
        
        // Combina indicadores para identificar regime
        return returns.map((r, i) => {
            const vol = volatility[i] || 0;
            const volChange = volumeChange[i] || 0;
            
            if (Math.abs(r) < 0.001 && vol < 0.002) return 'RANGE';
            if (r > 0 && volChange > 0) return 'UPTREND';
            if (r < 0 && volChange > 0) return 'DOWNTREND';
            if (vol > 0.003) return 'VOLATILE';
            return 'UNDEFINED';
        });
    }

    static calculatePricePatterns(high, low, close, period = 5) {
        const patterns = [];
        
        for (let i = period; i < close.length; i++) {
            const segment = {
                high: high.slice(i - period, i + 1),
                low: low.slice(i - period, i + 1),
                close: close.slice(i - period, i + 1)
            };
            
            if (this.isDoubleTops(segment)) patterns.push('DOUBLE_TOP');
            else if (this.isDoubleBottoms(segment)) patterns.push('DOUBLE_BOTTOM');
            else if (this.isHeadAndShoulders(segment)) patterns.push('HEAD_AND_SHOULDERS');
            else if (this.isTriangle(segment)) patterns.push('TRIANGLE');
            else patterns.push('NONE');
        }
        
        return patterns;
    }

    // Detectores de Padrões
    static isDoubleTops({ high }) {
        const peaks = this.findPeaks(high);
        return peaks.length === 2 && 
               Math.abs(high[peaks[0]] - high[peaks[1]]) < 0.001;
    }

    static isDoubleBottoms({ low }) {
        const troughs = this.findTroughs(low);
        return troughs.length === 2 && 
               Math.abs(low[troughs[0]] - low[troughs[1]]) < 0.001;
    }

    static isHeadAndShoulders({ high }) {
        const peaks = this.findPeaks(high);
        if (peaks.length !== 3) return false;
        
        const [left, head, right] = peaks.map(i => high[i]);
        return head > left && head > right && 
               Math.abs(left - right) < 0.001;
    }

    static isTriangle({ high, low }) {
        const highs = this.linearRegression(high);
        const lows = this.linearRegression(low);
        
        return Math.abs(highs.slope - lows.slope) < 0.0001;
    }

    // Funções Auxiliares
    static findPeaks(data) {
        const peaks = [];
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > data[i-1] && data[i] > data[i+1]) {
                peaks.push(i);
            }
        }
        return peaks;
    }

    static findTroughs(data) {
        const troughs = [];
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] < data[i-1] && data[i] < data[i+1]) {
                troughs.push(i);
            }
        }
        return troughs;
    }

    static linearRegression(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumX2 += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }
}

module.exports = TechnicalIndicators;