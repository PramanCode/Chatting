import * as React from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initializeApp } from 'firebase/app';
import { getAuth, FacebookAuthProvider, signInWithCredential, GoogleAuthProvider, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getDatabase, ref, set } from "firebase/database";
import * as Facebook from 'expo-facebook';
import ChatsList from './ChatsList';
import Chat from './Chat';
import AsyncStorageLib from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';

const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_EXPO_CLIENT_ID = process.env.GOOGLE_EXPO_CLIENT_ID;
const FB_APP_ID = process.env.FB_APP_ID;
const Stack = createNativeStackNavigator();
//624422366265-dg6s72v7ipas3kj0rsllkh7o91qf2495.apps.googleusercontent.com
function GoogleSignIn({ onReturn }) {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
        {
            clientId: GOOGLE_EXPO_CLIENT_ID,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID
        },
    );
    React.useEffect(() => {
        if (response?.type === 'success') {
            //console.log(JSON.stringify(response));
            const { id_token } = response.params;
            onReturn(id_token);
        }
    }, [response]);

    return (
        <Button
            onPress={() => {
                promptAsync();
            }}
            title="Google Signin"
            color="#841584"
            accessibilityLabel="Learn more about this purple button"
        />
    )
}

export default class App extends React.Component {

    state = {
        loggedIn: false,
        isReady: false,
        userId: null
    }

    componentDidMount() {

        const firebaseConfig = {
            apiKey: "AIzaSyCf1tmxlB1psWda53hTp8Y2OftP3FM9yag",
            authDomain: "fir-1cde2.firebaseapp.com",
            databaseURL: "https://fir-1cde2.firebaseio.com",
            projectId: "fir-1cde2",
            storageBucket: "fir-1cde2.appspot.com",
            messagingSenderId: "1026090597268",
            appId: "1:1026090597268:web:e9193de0f49bf2651c6d81"
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
                    console.log('user id: ' + JSON.stringify(user));
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
            console.log(credential);
            this.signIn(auth, credential);
        }
    }

    signIn(auth, credential) {
        signInWithCredential(auth, credential)
            .then(result => {
                //console.log('result: ' + JSON.stringify(result));
                const db = getDatabase();
                fetchSignInMethodsForEmail(auth, result.user.email)
                    .then(signInMethods => {
                        console.log(signInMethods);
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
                        <Text>Home Screen</Text>
                        <Button
                            onPress={() => this.loginWithFacebook()}
                            title="Learn More"
                            color="#841584"
                            accessibilityLabel="Learn more about this purple button"
                        />
                        <GoogleSignIn onReturn={async (id_token) => {
                            const auth = getAuth();
                            const credential = GoogleAuthProvider.credential(id_token);
                            this.signIn(auth, credential);
                        }} />
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


