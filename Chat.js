import * as React from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { getDatabase, ref, set, push, update, get, child, onValue } from "firebase/database";

export default class Chat extends React.Component {
    state = {
        chatId: null,
        text: '',
        messages: []
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.getMessages();
    }


    getMessages() {
        const db = getDatabase();
        get(child(ref(db), 'users/' + this.props.route.params.myId + '/chats/' + this.props.route.params.personId)).then((snapshot) => {
            const chatId = snapshot.val();
            console.log('chatid: ' + chatId);
            if (chatId != null) {
                //get
                onValue(ref(db, 'chats/' + chatId), (snapshot) => {
                    const messages = [];
                    snapshot.forEach(object => {
                        messages.push(object.toJSON());
                    });
                    console.log('snapshot: '+snapshot.val());
                    this.setState({ messages: messages, chatId: chatId });
                });
            }
        });
    }

    async sendMessage(prevChatId) {
        const db = getDatabase();
        let newChatId = prevChatId;
        if (prevChatId == null) {
            await get(child(ref(db), 'users/' + this.props.route.params.myId + '/chats/' + this.props.route.params.personId))
                .then((snapshot) => {
                    const chatId = snapshot.val();
                    console.log('chatid: ' + chatId);
                    if (chatId != null) {
                        newChatId = chatId;
                        onValue(ref(db, 'chats/' + chatId), (snapshot) => {
                            const messages = [];
                            snapshot.forEach(object => {
                                messages.push(object.toJSON());
                            });
                            this.setState({ messages: messages, chatId: chatId });
                        })
                    }
                    else {
                        const myChatIdRef = ref(db, 'users/' + this.props.route.params.myId + '/chats/' + this.props.route.params.personId);
                        newChatId = push(myChatIdRef).key;
                        const personChatIdRef = ref(db, 'users/' + this.props.route.params.personId + '/chats/' + this.props.route.params.myId);
                        set(myChatIdRef, newChatId);
                        set(personChatIdRef, newChatId);
                        this.setState({ chatId: newChatId });
                    }
                });
        }
        const updates = {};
        const chatRef = ref(db, '/chats/' + newChatId)
        const messageKey = push(chatRef).key;
        console.log('new chat id: ' + newChatId);
        updates['/chats/' + newChatId + '/' + messageKey] = {
            'text': this.state.text,
            'personId': this.props.route.params.myId
        };
        update(ref(db), updates);
        if (prevChatId == null) {
            onValue(ref(db, 'chats/' + newChatId), (snapshot) => {
                const messages = [];
                snapshot.forEach(object => {
                    messages.push(object.toJSON());
                });
                this.setState({ messages: messages, chatId: newChatId });
            })
        }
        this.setState({ text: '' });
    }

    message = ({ item }) => {
        return (
            <Text style={{ padding: 10, flexDirection: 'row', margin: 5, backgroundColor: 'pink', textAlign: item.personId == this.props.route.params.myId ? 'right' : 'left' }}>
                {item.text}
            </Text>
        )
    }

    render() {
        return (
            <SafeAreaView style={{ flex: 1, paddingBottom: 20 }}>
                <FlatList
                    keyExtractor={(item, index) => String(index)}
                    data={this.state.messages}
                    renderItem={this.message}
                    style={{ flex: 1 }}
                />
                <View style={{ flexDirection: 'row', width: '100%' }}>
                    <TextInput
                        placeholder='type a message'
                        value={this.state.text}
                        onChange={(e) => this.setState({ 'text': e.nativeEvent.text })}
                        style={{ flex: 1, backgroundColor: 'yellow' }}
                        multiline
                        numberOfLines={3}
                    />
                    <TouchableOpacity style={{ padding: 10 }} onPress={() => this.sendMessage(this.state.chatId)}>
                        <Text>Post</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView >
        )
    }
}
