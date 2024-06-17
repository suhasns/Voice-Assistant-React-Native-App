import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import axios from 'axios';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = (error) => console.log('onSpeechError:', error);

    const checkAndroidPermission = async () => {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        console.log('hasPermission', hasPermission);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Permission denied');
          }
        }
      }
    };

    checkAndroidPermission();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = (event) => {
    console.log('recording Started...!!!', event);
  };

  const onSpeechEnd = () => {
    console.log('recording Ended.');
    setIsListening(false);
  };

  const onSpeechResults = (event) => {
    console.log('event for setting the text', event);
    const text = event.value[0];
    setRecognizedText(text);
  };

  const startListening = async () => {
    setIsListening(true);
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.log('Error in listening - Startlistening', error);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.log('Error in listening - Stoplistening', error);
      setIsListening(false);
    }
  };

  const getResponseFromAzureOpenAI = async (message) => {
  const apiKey = 'XYZ';
    const endpoint = 'XYZ';
    const deploymentId = 'XYZ';

    try {
      const response = await axios.post(
        `${endpoint}/openai/deployments/${deploymentId}/completions?api-version=2022-12-01`,
        {
          prompt: message,
          max_tokens: 150,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        }
      );
        console.log('response from the bot',response.data)
      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error('Error fetching response from Azure OpenAI:', error);
      return 'Sorry, I am unable to respond at the moment.';
    }
  };

  const sendMessage = async () => {
    if (recognizedText) {
      const newMessage = { text: recognizedText, sender: 'user' };
      setMessages([...messages, newMessage]);
      setRecognizedText('');

      const aiResponse = await getResponseFromAzureOpenAI(newMessage.text);
      setMessages((prevMessages) => [...prevMessages, { text: aiResponse, sender: 'bot' }]);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <ScrollView contentContainerStyle={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              {
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.sender === 'user' ? '#E1FFC7' : '#FFCDD2',
              },
            ]}
          >
            <Text style={[styles.messageText, { color: 'black' }]}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          value={recognizedText}
          onChangeText={(text) => setRecognizedText(text)}
        />
        <TouchableOpacity
          onPress={() => {
            isListening ? stopListening() : startListening();
          }}
          style={styles.voiceButton}
        >
          {isListening ? (
            <Text style={styles.voiceButtonText}>•••</Text>
          ) : (
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/4980/4980251.png',
              }}
              style={{ width: 45, height: 45 }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  messagesContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    color: 'black',
  },
  voiceButton: {
    marginLeft: 10,
    fontSize: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
  },
  voiceButtonText: {
    fontSize: 24,
    height: 45,
    color: 'black',
    backgroundColor: 'white',
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'blue',
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default App;
