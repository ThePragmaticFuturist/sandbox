import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch';

export class NetworkManager {
  static isConnected = false;
  static retryCount = 0;
  static maxRetryCount = 5;

  static initialize() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isConnected) {
        this.attemptReconnection();
      }
      this.isConnected = state.isConnected;
    });

    this.registerBackgroundFetch();
  }

  static async attemptReconnection() {
    if (this.isConnected) return;

    try {
      await this.connectToServer();
      this.isConnected = true;
      this.retryCount = 0;
      console.log('Reconnection successful');
    } catch (error) {
      console.log('Reconnection failed:', error);
      this.attemptReconnectionWithBackoff();
    }
  }

  static async connectToServer() {
    // Implement your server connection logic here
    // This is a placeholder implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      }, 1000);
    });
  }

  static attemptReconnectionWithBackoff() {
    if (this.retryCount >= this.maxRetryCount) {
      console.log('Max retry count reached');
      return;
    }

    const delay = Math.pow(2, this.retryCount) * 1000;
    setTimeout(() => {
      this.attemptReconnection();
      this.retryCount++;
    }, delay);
  }

  static async registerBackgroundFetch() {
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      await this.attemptReconnection();
      return BackgroundFetch.Result.NewData;
    });

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}