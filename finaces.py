import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# 1. Coletar Dados com `yfinance`
def collect_data(symbol, start, end):
    df = yf.download(symbol, start=start, end=end)
    return df

# 2. Pré-processar os Dados
def preprocess_data(df):
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df[['Close']].values)
    
    training_data_len = int(np.ceil(len(scaled_data) * .8))
    
    train_data = scaled_data[0:int(training_data_len), :]
    x_train, y_train = [], []
    
    for i in range(60, len(train_data)):
        x_train.append(train_data[i-60:i, 0])
        y_train.append(train_data[i, 0])
        
    x_train, y_train = np.array(x_train), np.array(y_train)
    x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))
    
    return x_train, y_train, scaler, training_data_len

# 3. Definir e Treinar o Modelo LSTM
def build_lstm_model():
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=(60, 1)))
    model.add(LSTM(units=50, return_sequences=False))
    model.add(Dense(units=25))
    model.add(Dense(units=1))
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

# 4. Fazer Previsões
def predict(model, df, scaler, training_data_len):
    test_data = df[training_data_len - 60:].values
    test_data = scaler.transform(test_data)
    
    x_test = []
    y_test = df[training_data_len:]['Close'].values
    
    for i in range(60, len(test_data)):
        x_test.append(test_data[i-60:i, 0])
        
    x_test = np.array(x_test)
    x_test = np.reshape(x_test, (x_test.shape[0], x_test.shape[1], 1))
    
    predictions = model.predict(x_test)
    predictions = scaler.inverse_transform(predictions)
    
    return predictions, y_test

# 5. Plotar Resultados
def plot_results(df, predictions, training_data_len):
    train = df[:training_data_len]
    valid = df[training_data_len:]
    valid['Predictions'] = predictions
    
    plt.figure(figsize=(16, 8))
    plt.title('Modelo LSTM - Previsão de Fechamento de Ações')
    plt.xlabel('Data')
    plt.ylabel('Preço de Fechamento em R$')
    plt.plot(train['Close'])
    plt.plot(valid[['Close', 'Predictions']])
    plt.legend(['Treino', 'Validação', 'Previsões'], loc='lower right')
    plt.show()

# Função Principal
def main():
    symbol = "PETR4.SA"  # Símbolo da Petrobras
    start = "2015-01-01"
    end = "2023-01-01"
    
    df = collect_data(symbol, start, end)
    
    x_train, y_train, scaler, training_data_len = preprocess_data(df)
    
    model = build_lstm_model()
    model.fit(x_train, y_train, batch_size=1, epochs=1)
    
    predictions, y_test = predict(model, df, scaler, training_data_len)
    
    plot_results(df, predictions, training_data_len)

if __name__ == "__main__":
    main()
