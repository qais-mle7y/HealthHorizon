import { useState } from 'react';
import appDescription from './appDescription';

const API_KEY = 'sk-proj-8clcae7DaW2WQaSioSxVT3BlbkFJwbXksYAriNsp1FAtMVk4';
const MAX_RETRIES = 10;
const RETRY_DELAY_BASE = 1000;

export const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    {
      message: "Hi! How may I help you today?",
      sentTime: "just now",
      sender: "ChatGPT",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const toggleModal = () => setIsOpen(!isOpen);

  const handleInputChange = (event) => setInputValue(event.target.value);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      handleSendRequest(inputValue);
      setInputValue('');
    }
  };

  const handleSendRequest = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: 'user',
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setIsTyping(true);

    try {
      const response = await processMessageToChatGPT([...messages, newMessage]);
      if (response && response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        if (content) {
          const chatGPTResponse = {
            message: content,
            sender: 'ChatGPT',
          };
          setMessages((prevMessages) => [...prevMessages, chatGPTResponse]);
        }
      } else {
        console.error('Invalid response from API:', response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const processMessageToChatGPT = async (chatMessages, retryCount = 0) => {
    const apiMessages = chatMessages.map((messageObject) => {
      const role = messageObject.sender === 'ChatGPT' ? 'assistant' : 'user';
      return { role, content: messageObject.message };
    });

    const apiRequestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: appDescription },
        ...apiMessages,
      ],
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
      });

      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * RETRY_DELAY_BASE;
          console.warn(`Rate limit exceeded, retrying after ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return processMessageToChatGPT(chatMessages, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded. Max retries reached. Please add credits to your account.');
        }
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error in processMessageToChatGPT:', error);
      throw error;
    }
  };

  return {
    isOpen,
    messages,
    inputValue,
    isTyping,
    toggleModal,
    handleInputChange,
    handleSubmit,
  };
};
