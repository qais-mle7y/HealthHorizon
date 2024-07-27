import React from 'react';
import { useChatbot } from './useChatbot';

const Chatbot = () => {
  const {
    isOpen,
    messages,
    inputValue,
    isTyping,
    toggleModal,
    handleInputChange,
    handleSubmit,
  } = useChatbot();

  return (
    <>
      <button className="chat-btn" onClick={toggleModal}>
        <p>💬</p>
      </button>

      {isOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={toggleModal}>&times;</span>
            <div className="chatbot">
              <div className="messages">
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.sender}`}>
                    {message.message}
                  </div>
                ))}
                {isTyping && <div className="loading">Loading...</div>}
              </div>
              <div className="input-area">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                />
                <button className="btn primary" onClick={handleSubmit}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
