/**
 * Translation app developed by Miguel Martin
 * Recognizes the languaje spoken, translates it and says it through the speakers(if not muted) using  native speaker pronunciation
 * It can quickly switch between the two languajes being used at the moment with the press of a button and can be
 * used continously.
 * Is possible to edit the text manually when is not auto translating
 * The app can say the text tranlated at any time with it's native speaker pronunciation
 * 
 */

import React, { Component } from 'react';
import languages from './languages.js';
import SelectDropdown from 'react-native-select-dropdown'
import { LogBox } from 'react-native';

import {
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

//https://www.npmjs.com/package/google-translate-api-x
import translate from 'google-translate-api-x';
//https://www.npmjs.com/package/react-native-tts
import Tts from 'react-native-tts';
//https://www.npmjs.com/package/@react-native-voice/voice
import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

LogBox.ignoreLogs(['`new']);
Tts.setDefaultLanguage('es-ES');

type Props = {};
type State = {
  lastTranslation: string,
  mute: string,
  inputLan: string,
  inputLanFull: string,
  outputLan: string,
  outputLanFull: string,
  voiceLan: string,
  status: string,
  editableInput: boolean,
  original: string;
  tempOriginal: string;
  translation: string;
  recognized: string;
  isUnderstanding: boolean;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  //Says the name of the app on start to make up for tts taking a few seconds to start the first time 
  Tts.speak('Basic Translator')

const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView >
      <VoiceTest></VoiceTest>
    </SafeAreaView>
  );
}

class VoiceTest extends Component<Props, State> {

  state = {
    lastTranslation: '',
    mute: '🔊',
    inputLan: 'en',
    inputLanFull: 'English (English)',
    outputLan: 'es',
    outputLanFull: 'Español (Spanish)',
    voiceLan: 'en-US',
    status: '▶',
    editableInput: true,
    original: '',
    tempOriginal: '',
    translation: '',
    recognized: '',
    isUnderstanding: true,
    pitch: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
  };


  constructor(props: Props) {
    super(props);
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged;
  }

  //Capitalizes the first letter for aesthetics because neither the translator nor the voice recognizer does it
  Capitalize = (str: String) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  //Obtains the locale from the languaje list using the shortcut. Check languajes.js
  getLocaleByShortcut = (shortcut: String) => {
    const language = languages.find(lang => lang.shortcut === shortcut);
    return language ? language.locale : 'null';
  };

  //Switches the position of the languajes that are being used at the moment 
  reverse = () => {
    var tempInputLan = this.state.inputLan;
    var tempInputLanFull = this.state.inputLanFull;
    var tempOutputLan = this.state.outputLan;
    var tempOutputLanFull = this.state.outputLanFull;
    var tempOriginalR = this.state.tempOriginal;
    var tempTranslation = this.state.translation;

    this.setState({
      inputLan: tempOutputLan,
      inputLanFull: tempOutputLanFull,
      outputLan: tempInputLan,
      outputLanFull: tempInputLanFull,
      voiceLan: this.getLocaleByShortcut(tempOutputLan),
      original: tempTranslation,
      translation: tempOriginalR,
      tempOriginal: tempTranslation,
    });
    Tts.setDefaultLanguage(this.getLocaleByShortcut(tempInputLan));
  }

  //When the user touches outside the keyboard, hides it and translates and displays the translation. 
  //Displaying it as soon as a change is made slows down the app
  inputOver = async () => {
    Keyboard.dismiss();
    await translate(this.state.tempOriginal, { from: this.state.inputLan, to: this.state.outputLan })
      .then(res => {
        this.setState({
          original: this.state.tempOriginal,
          translation: res.text,
        });
      })
  }

  //Saves the text that is being written or changed by hand 
  inputEdited = async (newText: string) => {
    this.setState({
      tempOriginal: newText,
    });
  }

  //Plays throught the speakers the text translated if it is not translating a the moment or is muted
  repeat = () => {
    if (this.state.editableInput || this.state.mute == '🔇') {
      Tts.speak(this.state.translation)
    }
  }

  //Silences the auto speakers that says the sentences as soon as they are oraly identified and translated
  mute = () => {
    if (this.state.mute == '🔊') {
      this.setState({
        mute: '🔇',
      });
    } else {
      this.setState({
        mute: '🔊',
      });
    }
  }

  //Deletes the text detected and translated
  clear = () => {
    if (this.state.editableInput) {
      this.setState({
        original: '',
        tempOriginal: '',
        translation: '',
      });
    }
  }

  //Translates sentences detected oraly and displays the original and the translated version
  Translate = async (vox: string) => {
    //console.log(vox)
    await translate(vox, { from: this.state.inputLan, to: this.state.outputLan })
      .then(res => {
        if (vox.toLowerCase() != res.text.toLowerCase() || (this.state.inputLan == this.state.outputLan && this.state.lastTranslation.toLowerCase() != res.text.toLowerCase())) {
          //console.log(res.text)
          if (this.state.original == '') {
            this.setState({
              original: '• ' + this.Capitalize(vox),
              tempOriginal: '• ' + this.Capitalize(vox)
            });
          } else {
            this.setState({
              original: this.state.original + '\n• ' + this.Capitalize(vox),
              tempOriginal: this.state.original + '\n• ' + this.Capitalize(vox)
            });
          }
          if (this.state.translation == '') {
            this.setState({
              translation: '‣ ' + this.Capitalize(res.text),
            });
          } else {
            this.setState({
              translation: this.state.translation + '\n‣ ' + this.Capitalize(res.text),
            });
          }
          this.setState({
            lastTranslation: res.text,
          });
          if (this.state.mute == '🔊') {
            Tts.speak(res.text)
          }
        }
      })
  }

  //Belongs to the speech to text library
  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  //Belongs to the speech to text library
  onSpeechStart = (e: any) => {
    //console.log('onSpeechStart: ', e);
    this.setState({
      started: '√',
    });
  };

  //Belongs to the speech to text library
  onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    //console.log('onSpeechRecognized: ', e);
    this.setState({
      recognized: '√',
      isUnderstanding: true,
    });
  };

  //Belongs to the speech to text library
  onSpeechEnd = (e: any) => {
    //console.log('onSpeechEnd: ', e);
    this.setState({
      end: '√',
      isUnderstanding: true,
    })
    if (this.state.status == '■') {
      this._startRecognizing()
    }
  };

  //Belongs to the speech to text library
  onSpeechError = (e: SpeechErrorEvent) => {
    //console.log('onSpeechError: ', e);
    this._startRecognizing();
    this.setState({
      isUnderstanding: false,
      error: JSON.stringify(e.error),
    });
  };

  //Belongs to the speech to text library
  onSpeechResults = (e: SpeechResultsEvent) => {
    //console.log('onSpeechResults: ', e);
    this.setState({
      results: e.value!,

    })
    this.Translate(this.state.results[0]);
  };

  //Belongs to the speech to text library
  onSpeechPartialResults = (e: SpeechResultsEvent) => {
    //console.log('onSpeechPartialResults: ', e);
    this.setState({
      partialResults: e.value!,
    });
  };

  onSpeechVolumeChanged = (e: any) => {

  };

  //Starts or stops the auto translation
  _startStopButton = async () => {
    if (this.state.status == '▶') {
      this._startRecognizing();
    } else {
      this.setState({
        status: '▶',
        editableInput: true,
        isUnderstanding: true,
      });
      this._stopRecognizing()
      this._cancelRecognizing()
      this._destroyRecognizer();
    }
  }

  //Belongs to the speech to text library
  _startRecognizing = async () => {
    this.setState({
      status: '■',
      editableInput: false,
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',

    });

    try {
      await Voice.start(this.state.voiceLan);
    } catch (e) {
      console.error(e);
    }
  };

  //Belongs to the speech to text library
  _stopRecognizing = async () => {
    try {
      await Voice.stop()

    } catch (e) {
      console.error(e);
    }
  };

  //Belongs to the speech to text library
  _cancelRecognizing = async () => {
    try {
      await Voice.cancel();
    } catch (e) {
      console.error(e);
    }
  };

  //Belongs to the speech to text library
  _destroyRecognizer = async () => {
    try {
      await Voice.destroy();
    } catch (e) {
      console.error(e);
    }
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
    });
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.inputOver} accessible={false}>
        <View>
          <View style={{ flexDirection: 'row' }}>
            <SelectDropdown disabled={!this.state.editableInput} data={languages} onSelect={(selectedItem) => {
              this.setState({
                inputLan: selectedItem.shortcut,
                inputLanFull: selectedItem.name + ' (' + selectedItem.englishName + ')',
                voiceLan: selectedItem.locale,
                original: '',
                tempOriginal: '',
                translation: ''
              })
            }}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={styles.dropdownButtonStyle}>
                    <Text style={styles.dropdownButtonTxtStyle}>
                      {(selectedItem && this.state.inputLanFull) || this.state.inputLanFull}
                    </Text>
                  </View>
                );
              }}
              renderItem={(item, index, isSelected) => {
                return (
                  <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                    <Text style={styles.dropdownItemTxtStyle}>{item.name} ({item.englishName})</Text>
                  </View>
                );
              }}
            />
            {!this.state.isUnderstanding && (
              <View style={styles.confusionStyle}><Text style={styles.confusionTextStyle}>¿?</Text></View>
            )}
          </View>
          <Text style={styles.pencil} disabled={!this.state.editableInput}>✎</Text>
          <TextInput style={styles.inputStyle} editable={this.state.editableInput} defaultValue={this.state.original} onChangeText={this.inputEdited} multiline={true} />
          <Text style={styles.arrows}>⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓ ⇓</Text>
          <SelectDropdown disabled={!this.state.editableInput} data={languages} onSelect={(selectedItem) => {
            this.setState({
              outputLan: selectedItem.shortcut,
              outputLanFull: selectedItem.name + ' (' + selectedItem.englishName + ')',
              original: '',
              tempOriginal: '',
              translation: ''
            })
            Tts.setDefaultLanguage(this.getLocaleByShortcut(selectedItem.shortcut));
          }}
            renderButton={(selectedItem, isOpened) => {
              return (
                <View style={styles.dropdownButtonStyle}>
                  <Text style={styles.dropdownButtonTxtStyle}>
                    {(selectedItem && this.state.outputLanFull) || this.state.outputLanFull}
                  </Text>
                </View>
              );
            }}
            renderItem={(item, index, isSelected) => {
              return (
                <View style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                  <Text style={styles.dropdownItemTxtStyle}>{item.name} ({item.englishName})</Text>
                </View>
              );
            }}
          />
          <TextInput style={styles.inputStyle} editable={false} defaultValue={this.state.translation} multiline={true} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <Pressable disabled={!this.state.editableInput} onPress={this.clear} style={this.state.editableInput ? styles.secondaryButton : styles.secondaryButtonOff}>
              <Text style={styles.secondaryButtonTextSmall}>✕</Text>
            </Pressable>
            <Pressable onPress={this.reverse} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonTextSmallArrows}>⇅</Text>
            </Pressable>
            <Pressable onPress={this._startStopButton} style={styles.mainButton}>
              <Text style={styles.mainButtonText}>{this.state.status}</Text>
            </Pressable>
            <Pressable onPress={this.mute} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{this.state.mute}</Text>
            </Pressable>
            <Pressable disabled={!this.state.editableInput} onPress={this.repeat} style={this.state.editableInput ? styles.secondaryButton : styles.secondaryButtonOff}>
              <Text style={styles.secondaryButtonTextSmall}>X2</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  pencil: {
    fontSize: 30,
    position: 'absolute',
    top: '5.5%',
    right: '2%',
    transform: [{ rotate: '110deg' }]
  },
  confusionStyle: {
    alignSelf: 'center',
    left: '210%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confusionTextStyle: {
    backgroundColor: 'white',
    borderRadius: 100,
    borderColor: 'red',
    borderWidth: 2,
    width: 35,
    height: 35,
    color: 'black',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputStyle: {
    borderRadius: 10,
    margin: 2,
    fontSize: 24,
    borderColor: 'white',
    borderWidth: 1,
    height: '37.5%',
    color: 'white'
  },
  mainButtonText: {
    fontSize: 50,
    alignSelf: 'center',
    verticalAlign: 'middle',
    top: -6,
    left: 0,
    color: 'white'
  },
  mainButton: {
    top: '1%',
    backgroundColor: '#78b5ee',
    borderRadius: 100,
    width: 60,
    height: 60,
    alignSelf: 'center',
  },
  secondaryButtonText: {
    fontSize: 50,
    alignSelf: 'center',
    verticalAlign: 'middle',
    top: -5,
    left: 0,
  },
  secondaryButtonTextSmall: {
    fontSize: 40,
    alignSelf: 'center',
    verticalAlign: 'middle',
    top: 2,
    left: 0,
    color: 'black'
  },
  secondaryButtonTextSmallArrows: {
    fontSize: 57,
    alignSelf: 'center',
    verticalAlign: 'middle',
    top: -14,
    left: 0,
    color: 'black'
  },
  secondaryButton: {
    top: '1%',
    backgroundColor: '#ffffff',
    borderRadius: 100,
    width: 60,
    height: 60,
    alignSelf: 'center',
  },
  secondaryButtonOff: {
    top: '1%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 100,
    width: 60,
    height: 60,
    alignSelf: 'center',
  },
  arrows: {
    fontSize: 30,
    alignSelf: 'center',
  },
  dropdownButtonStyle: {
    borderRadius: 10,
    margin: 2,
    width: '60%',
    backgroundColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});

export default App;
