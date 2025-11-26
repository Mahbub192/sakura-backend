# Messaging API Documentation

## Overview
The Messaging API provides real-time communication between users (Patients, Doctors, Admins, and Assistants) using REST endpoints and WebSocket connections.

## REST API Endpoints

### Base URL
All endpoints are prefixed with `/messages` and require JWT authentication.

### Authentication
Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### 1. Create or Get Thread
**POST** `/messages/threads`

Create a new message thread or retrieve an existing one with another user.

**Request Body:**
```json
{
  "participantId": 2
}
```

**Response:**
```json
{
  "id": 1,
  "threadId": "uuid-string",
  "participant1Id": 1,
  "participant2Id": 2,
  "lastMessage": "Hello!",
  "lastMessageAt": "2024-01-15T10:30:00Z",
  "unreadCount1": 0,
  "unreadCount2": 1,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### 2. Get All Threads
**GET** `/messages/threads?filter=all|unread|flagged`

Get all message threads for the current user.

**Query Parameters:**
- `filter` (optional): `all`, `unread`, or `flagged` (default: `all`)

**Response:**
```json
[
  {
    "id": 1,
    "threadId": "uuid-string",
    "participant1": { "id": 1, "firstName": "John", "lastName": "Doe" },
    "participant2": { "id": 2, "firstName": "Jane", "lastName": "Smith" },
    "lastMessage": "Hello!",
    "lastMessageAt": "2024-01-15T10:30:00Z",
    "unreadCount1": 0,
    "unreadCount2": 1
  }
]
```

#### 3. Get Thread Messages
**GET** `/messages/threads/:threadId/messages`

Get all messages in a specific thread.

**Response:**
```json
[
  {
    "id": 1,
    "threadId": "uuid-string",
    "senderId": 1,
    "recipientId": 2,
    "content": "Hello!",
    "subject": "Greeting",
    "type": "text",
    "channel": "In-App",
    "isRead": true,
    "readAt": "2024-01-15T10:31:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### 4. Mark Thread as Read
**POST** `/messages/threads/:threadId/read`

Mark all messages in a thread as read.

**Response:**
```json
{
  "message": "Messages marked as read"
}
```

#### 5. Send Message
**POST** `/messages/send`

Send a new message to another user.

**Request Body:**
```json
{
  "recipientId": 2,
  "content": "Hello, how are you?",
  "subject": "Greeting",
  "type": "text",
  "channel": "In-App",
  "attachmentUrl": null
}
```

**Response:**
```json
{
  "id": 1,
  "threadId": "uuid-string",
  "senderId": 1,
  "recipientId": 2,
  "content": "Hello, how are you?",
  "subject": "Greeting",
  "type": "text",
  "channel": "In-App",
  "isRead": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 6. Search Messages
**GET** `/messages/search?q=search+query`

Search messages by content or subject.

**Query Parameters:**
- `q` (required): Search query string

**Response:**
```json
[
  {
    "id": 1,
    "content": "Hello, how are you?",
    "subject": "Greeting",
    "sender": { "id": 1, "firstName": "John" },
    "recipient": { "id": 2, "firstName": "Jane" },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### 7. Get Unread Count
**GET** `/messages/unread-count`

Get the total number of unread messages for the current user.

**Response:**
```json
{
  "count": 5
}
```

## WebSocket API

### Connection
Connect to the WebSocket server at:
```
ws://localhost:3000/messages
```

### Authentication
Include the JWT token in the connection handshake:
```javascript
const socket = io('http://localhost:3000/messages', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Client → Server Events

##### 1. `send_message`
Send a new message via WebSocket.

**Payload:**
```json
{
  "recipientId": 2,
  "content": "Hello!",
  "subject": "Greeting",
  "type": "text",
  "channel": "In-App"
}
```

**Response:** Server emits `message_sent` event with the created message.

##### 2. `mark_read`
Mark messages in a thread as read.

**Payload:**
```json
{
  "threadId": "uuid-string"
}
```

**Response:** Server emits `marked_read` event.

##### 3. `typing`
Send typing indicator to the recipient.

**Payload:**
```json
{
  "threadId": "uuid-string",
  "isTyping": true
}
```

#### Server → Client Events

##### 1. `connected`
Emitted when client successfully connects.

**Payload:**
```json
{
  "userId": 1
}
```

##### 2. `new_message`
Emitted when a new message is received.

**Payload:**
```json
{
  "id": 1,
  "threadId": "uuid-string",
  "senderId": 2,
  "recipientId": 1,
  "content": "Hello!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

##### 3. `message_sent`
Emitted when a message is successfully sent (confirmation).

**Payload:** Same as `new_message` event.

##### 4. `thread_updated`
Emitted when a thread is updated (new message, read status change, etc.).

**Payload:**
```json
{
  "id": 1,
  "threadId": "uuid-string",
  "lastMessage": "Hello!",
  "lastMessageAt": "2024-01-15T10:30:00Z",
  "unreadCount1": 0,
  "unreadCount2": 1
}
```

##### 5. `marked_read`
Emitted when messages are marked as read.

**Payload:**
```json
{
  "threadId": "uuid-string"
}
```

##### 6. `user_typing`
Emitted when the other user is typing.

**Payload:**
```json
{
  "threadId": "uuid-string",
  "userId": 2,
  "isTyping": true
}
```

##### 7. `error`
Emitted when an error occurs.

**Payload:**
```json
{
  "message": "Error description"
}
```

## Usage Examples

### JavaScript/TypeScript Client Example

```typescript
import { io, Socket } from 'socket.io-client';

// Connect to WebSocket
const socket: Socket = io('http://localhost:3000/messages', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for connection
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('send_message', {
  recipientId: 2,
  content: 'Hello!',
  subject: 'Greeting',
  type: 'text',
  channel: 'In-App'
});

// Mark thread as read
socket.emit('mark_read', {
  threadId: 'uuid-string'
});

// Send typing indicator
socket.emit('typing', {
  threadId: 'uuid-string',
  isTyping: true
});
```

### REST API Example (using fetch)

```typescript
// Get all threads
const response = await fetch('http://localhost:3000/messages/threads', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const threads = await response.json();

// Send a message
const messageResponse = await fetch('http://localhost:3000/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientId: 2,
    content: 'Hello!',
    subject: 'Greeting'
  })
});
const message = await messageResponse.json();
```

## Access Control

All endpoints are accessible to authenticated users (Patients, Doctors, Admins, and Assistants). Users can only:
- View threads they are participants in
- Send messages to other users
- View messages in their own threads
- Mark their own messages as read

## Notes

- Threads are automatically created when the first message is sent
- Unread counts are automatically managed
- WebSocket connections require valid JWT tokens
- Messages support multiple channels (SMS, Email, In-App)
- File attachments can be included via `attachmentUrl`

