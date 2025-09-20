document.addEventListener('DOMContentLoaded', function () {
    const userList = document.getElementById('user-list');
    const chatHeader = document.getElementById('chat-header');
    const messagesContainer = document.getElementById('messages-container');
    const messageFormContainer = document.getElementById('message-form-container');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');

    let currentUserId = null;
    let selectedUserId = null;
    let unsubscribe = null;

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadUserList();
        } else {
            // Handle user not logged in
        }
    });

    async function loadUserList() {
        const usersSnapshot = await firebase.firestore().collection('users').get();
        userList.innerHTML = '';
        usersSnapshot.forEach((doc) => {
            if (doc.id !== currentUserId) {
                const userData = doc.data();
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.dataset.userId = doc.id;
                userItem.dataset.userName = userData.name;
                userItem.innerHTML = `
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${doc.id}" alt="Avatar">
                    <span>${userData.name}</span>
                `;
                userItem.addEventListener('click', () => {
                    selectUser(doc.id, userData.name);
                });
                userList.appendChild(userItem);
            }
        });
    }

    function selectUser(userId, userName) {
        selectedUserId = userId;
        chatHeader.textContent = `Chat with ${userName}`;
        messageFormContainer.style.display = 'block';

        // Highlight selected user
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.user-item[data-user-id="${userId}"]`).classList.add('active');

        loadMessages();
    }

    function loadMessages() {
        if (unsubscribe) {
            unsubscribe();
        }

        messagesContainer.innerHTML = '';

        if (!selectedUserId) return;

        const chatId = [currentUserId, selectedUserId].sort().join('_');
        const messagesRef = firebase.firestore().collection('chats').doc(chatId).collection('messages').orderBy('timestamp');

        unsubscribe = messagesRef.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const messageData = change.doc.data();
                    displayMessage(messageData);
                }
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }

    function displayMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.senderId === currentUserId ? 'sent' : 'received'}`;
        messageElement.textContent = messageData.text;
        messagesContainer.appendChild(messageElement);
    }

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text && selectedUserId) {
            const chatId = [currentUserId, selectedUserId].sort().join('_');
            firebase.firestore().collection('chats').doc(chatId).collection('messages').add({
                text: text,
                senderId: currentUserId,
                receiverId: selectedUserId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            messageInput.value = '';
        }
    });
}); 