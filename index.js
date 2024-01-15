// import { сonfig } from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'
import moment from 'moment-timezone'
import express from "express"


const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '6405761799:AAFRFOGnPZw0wMkdVJuxh3TCMkEWPI2HePY'
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY || 'e2a4dfe61c70e88c21fb341a59093b16'
const IPGEOLOCATION_API_KEY = process.env.IPGEOLOCATION_API_KEY || '060aaed1f37645fea51dc14997f537d5'
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

express().listen(PORT, () => console.log(`Listening on ${ PORT }`))
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const storage = {}
const MSG_END = "Please select weather or time in previous message and enter the city name again.\n \
If you don't see it, you can send /start to get this message again."

bot.on("polling_error", (msg) => console.log(msg));

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(
      chatId,
      'Hello! This bot can show you the weather and time for any city. To use it, please choose an option below:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '\u26C5 Get Weather', callback_data: 'get_weather' }],
            [{ text: '\u231A Get Time', callback_data: 'get_time' }],
          ],
        },
      }
    )
  })

  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id
    const data = callbackQuery.data

    switch (data) {
      case 'get_weather':
        const userDataWeather = getUserData(chatId)
        userDataWeather.waitingForCity = true
        userDataWeather.waitingForWeather = true
        bot.sendMessage(chatId, 'Please enter the name of the city or send /stop to cancel:')
        break
      case 'get_time':
        const userDataTime = getUserData(chatId)
        userDataTime.waitingForCity = true
        userDataTime.waitingForTime = true
        bot.sendMessage(chatId, 'Please enter the name of the city or send /stop to cancel:')
        break
      default:
        break
    }
})

function getUserData(chatId) {
    let userData = storage[chatId]
    if (!userData) {
      userData = {
        waitingForCity: false,
        waitingForWeather: false,
        waitingForTime: false,
      }
      storage[chatId] = userData
    }
    return userData
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text

  const userData = getUserData(chatId)

    if (userData && userData.waitingForCity) {
      const city = text
      let messageText = ''
      if (userData.waitingForWeather) {
        messageText = await getWeatherData(city)
      } else if (userData.waitingForTime) {
        messageText = await getTimeData(city)
      }
      bot.sendMessage(chatId, messageText)
      resetUserData(chatId)
      
    }
})

function resetUserData(chatId) {
  const userData = getUserData(chatId)
  userData.waitingForCity = false
  userData.waitingForWeather = false
  userData.waitingForTime = false
}

async function getWeatherData(city) {
  if (city === '/stop') {
    const messsageText = 'Thank you for using this bot. If you want to get any information about time and weather, send /start message'
    return messsageText
  }
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`
    )
    const weatherData = response.data
    const weatherDescription = weatherData.weather[0].description
    console.log(weatherDescription)
    const temperature = Math.round(weatherData.main.temp - 273.15)
    const messageText = `The weather in ${city} is currently ${weatherDescription} with a temperature of ${temperature}°C. ` + MSG_END
    return messageText 
  } catch(err) {
    console.log(err)
    const messageText = "Incorrect data. " + MSG_END
    return messageText
  }
}

async function getTimeData(city) {
  if (city === '/stop') {
    const messsageText = 'Thank you for using this bot. If you want to get any information about time and weather, send /start message'
    return messsageText
  }
  try {
    const response = await axios.get(
    ` https://api.ipgeolocation.io/timezone?apiKey=${IPGEOLOCATION_API_KEY}&location=${city}`
    )
    const data = response.data
    const localTime = data.time_24
    const messageText = `The current time in ${city} is ${localTime}. ` + MSG_END
    return messageText 
  } catch(err) {
    console.log(err)
    const messageText = "Incorrect data. " + MSG_END
    return messageText
  }
}

