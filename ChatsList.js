import * as React from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { getDatabase, ref, set, onValue, get, child } from "firebase/database";

export default class ChatsList extends React.Component {
    state = {
        users: []
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.getUsers();
    }

    getUsers() {
        const db = getDatabase();
        const users = ref(db, 'users/');
        const updatedUsers = [];
        get(child(ref(db), 'users/'))
            .then((snapshot) => {
                snapshot.forEach(object => {
                    if (object.val().id != this.props.route.params.id) {
                        updatedUsers.push(object.toJSON());
                    }
                });
                console.log('updated users: ' + JSON.stringify(updatedUsers));
                this.setState({ users: updatedUsers });
            })
            .catch(e => console.log(e));
    }

    chatHead = ({ item }) => {
        return (
            <TouchableOpacity style={{
                flex: 1,
                width: '100%',
                backgroundColor: 'yellow',
                justifyContent: 'center',
                padding: 20
            }}
                onPress={() => {
                    this.props.navigation.navigate('Chat', {
                        personId: item.id,
                        myId: this.props.route.params.id
                    })
                }}
            >
                <Text>{item.username}</Text>
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <SafeAreaView style={{ flex: 1, paddingBottom: 20 }}>
                <FlatList
                    keyExtractor={(item, index) => String(index)}
                    data={this.state.users}
                    renderItem={this.chatHead}
                    style={{ flex: 1 }}
                />
            </SafeAreaView >
        )
    }
}
