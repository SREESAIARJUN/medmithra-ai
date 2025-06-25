import React, { useState, useRef, useEffect } from 'react';
import { Button, Icons } from './UIComponents';

export const SpeechToText = ({ onTranscript, placeholder = "Click to start recording...", className = "" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure speech recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const startRecording = () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    setError('');
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        <Icons.Microphone />
        Speech recognition not supported in this browser
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant={isRecording ? "error" : "secondary"}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        className={isRecording ? "recording-pulse" : ""}
      >
        <Icons.Microphone />
        {isRecording ? 'Recording...' : 'Dictate'}
      </Button>
      
      {error && (
        <span className="text-red-500 dark:text-red-400 text-sm">
          {error}
        </span>
      )}
      
      {isRecording && (
        <span className="text-primary-600 dark:text-primary-400 text-sm animate-pulse">
          Listening...
        </span>
      )}
    </div>
  );
};

export const VoiceCommand = ({ onCommand, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        onCommand(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setCommand('');
      recognitionRef.current.start();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant={isListening ? "primary" : "secondary"}
        size="sm"
        onClick={startListening}
        disabled={isListening}
        className={isListening ? "recording-pulse" : ""}
      >
        <Icons.Microphone />
        {isListening ? 'Listening...' : 'Voice Command'}
      </Button>
      
      {command && (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          "{command}"
        </span>
      )}
    </div>
  );
};