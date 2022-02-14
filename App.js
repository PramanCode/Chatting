import * as React from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initializeApp } from 'firebase/app';
import { getAuth, FacebookAuthProvider, signInWithCredential, GoogleAuthProvider, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getDatabase, ref, set } from "firebase/database";
import * as Facebook from 'expo-facebook';
import ChatsList from './ChatsList';
import Chat from './Chat';
import AsyncStorageLib from '@react-native-async-storage/async-storage';
import * as GoogleSignIn from 'expo-google-sign-in';

const GOOGLE_EXPO_CLIENT_ID = process.env.GOOGLE_EXPO_CLIENT_ID;
const FB_APP_ID = process.env.FB_APP_ID;
const Stack = createNativeStackNavigator();

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loggedIn: false,
            isReady: false,
            userId: null
        };
        GoogleSignIn.initAsync({
            webClientId: GOOGLE_EXPO_CLIENT_ID
        });
    }

    componentDidMount() {
        const firebaseConfig = {
            apiKey: "AIzaSyCf1tmxlB1psWda53hTp8Y2OftP3FM9yag",
            authDomain: "fir-1cde2.firebaseapp.com",
            databaseURL: "https://fir-1cde2.firebaseio.com",
            projectId: "fir-1cde2",
            storageBucket: "fir-1cde2.appspot.com",
            messagingSenderId: "1026090597268",
            appId: "1:1026090597268:web:f6717d9eae7ddd7e1c6d81"
        };
        const app = initializeApp(firebaseConfig);
        this.fetchState();
    }

    async fetchState() {
        await AsyncStorageLib.getItem('user')
            .then(user => {
                if (user == null) {
                    this.setState({
                        loggedIn: false,
                        isReady: true
                    });
                }
                else {
                    this.setState({
                        loggedIn: false,
                        isReady: true,
                        userId: user
                    });
                }
            })
    }

    loginWithFacebook = async () => {
        this.setState({ isReady: false });
        const auth = getAuth();
        await Facebook.initializeAsync({ appId: FB_APP_ID });
        const { type, token } = await Facebook.logInWithReadPermissionsAsync({
            permissions: ['public_profile', 'email'],
        });

        if (type === 'success') {
            // Build Firebase credential with the Facebook access token.
            //const facebookAuthProvider = new FacebookAuthProvider();
            const credential = FacebookAuthProvider.credential(token);
            this.signIn(auth, credential);
        }
    }

    loginWithGoogle = async () => {
        try {
            const { type, user } = await GoogleSignIn.signInAsync({
            });
            if (type === 'success') {
                const auth = getAuth();
                const credential = GoogleAuthProvider.credential(user.auth.idToken);
                this.signIn(auth, credential);
            }
        } catch ({ message }) {
            Alert.alert('Google Login Error: ', message);
        }
    };

    signIn(auth, credential) {
        signInWithCredential(auth, credential)
            .then(result => {
                const db = getDatabase();
                fetchSignInMethodsForEmail(auth, result.user.email)
                    .then(signInMethods => {
                        if (signInMethods.length == 0) {
                            set(ref(db, 'users/' + result.user.uid), {
                                username: result.user.displayName,
                                id: result.user.uid,
                            });
                        }
                        AsyncStorageLib.setItem('user', result.user.uid)
                            .then(() => {
                                this.setState({
                                    loggedIn: true,
                                    userId: result.user.uid,
                                    isReady: true
                                })
                            })
                    });


            })
            .catch(error => {
                // Handle Errors here.
                console.log('eror: ' + error);
            });
    }

    render() {
        if (!this.state.isReady) {
            return (<View><ActivityIndicator /></View>)
        }
        return (
            <View style={{ flex: 1, backgroundColor: 'yellow' }}>
                {!this.state.loggedIn ?
                    <View style={{
                        flex: 1, alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Text>Sign In</Text>
                        <View>
                            <Button
                                onPress={() => this.loginWithFacebook()}
                                title="Facebook Login"
                                color="#841584"
                            />
                        </View>
                        <View>
                            <Button
                                onPress={() => this.loginWithGoogle()}
                                title="GoogleLogin"
                                color="#841584"
                            />
                        </View>
                    </View>
                    :
                    <NavigationContainer>
                        <Stack.Navigator>
                            <Stack.Screen name="ChatsList" component={ChatsList} initialParams={{ 'id': this.state.userId }} />
                            <Stack.Screen name="Chat" component={Chat} />
                        </Stack.Navigator>
                    </NavigationContainer>
                }
            </View >
        );
    }


}


