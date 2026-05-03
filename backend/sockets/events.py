"""
Socket.io event handlers for real-time task management
"""
from socketio import AsyncServer, ASGIApp
from datetime import datetime
import json

# Create Socket.io instance with CORS enabled
sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:5173', 'http://localhost:3000', '*'],
    engineio_logger=False,
    logger=False
)

# Store active connections: {user_id: {socket_id: sid, project_ids: []}}
active_connections = {}

@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    print(f'Client connected: {sid}')
    print(f'Authentication: {auth}')
    return True

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f'Client disconnected: {sid}')
    # Clean up connections
    for user_id in list(active_connections.keys()):
        if user_id in active_connections and sid in [s for s in active_connections[user_id].keys()]:
            del active_connections[user_id][sid]
            if not active_connections[user_id]:
                del active_connections[user_id]

@sio.event
async def join_project(sid, data):
    """
    Join a project room for real-time updates
    data: {user_id, project_id}
    """
    user_id = data.get('user_id')
    project_id = data.get('project_id')
    
    if not user_id or not project_id:
        return {'status': 'error', 'message': 'Missing user_id or project_id'}
    
    # Register user connection
    if user_id not in active_connections:
        active_connections[user_id] = {}
    
    active_connections[user_id][sid] = {'project_ids': set()}
    
    # Join the project room
    await sio.enter_room(sid, f'project_{project_id}')
    active_connections[user_id][sid]['project_ids'].add(project_id)
    
    # Notify others that user joined
    await sio.emit(
        'user_joined',
        {
            'user_id': user_id,
            'project_id': project_id,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{project_id}',
        skip_sid=sid
    )
    
    return {'status': 'success', 'message': f'Joined project {project_id}'}

@sio.event
async def leave_project(sid, data):
    """
    Leave a project room
    data: {user_id, project_id}
    """
    user_id = data.get('user_id')
    project_id = data.get('project_id')
    
    if user_id in active_connections and sid in active_connections[user_id]:
        active_connections[user_id][sid]['project_ids'].discard(project_id)
    
    # Leave the project room
    await sio.leave_room(sid, f'project_{project_id}')
    
    # Notify others that user left
    await sio.emit(
        'user_left',
        {
            'user_id': user_id,
            'project_id': project_id,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{project_id}'
    )

@sio.event
async def task_created(sid, data):
    """
    Broadcast task creation event
    data: {project_id, task}
    """
    project_id = data.get('project_id')
    task = data.get('task')
    
    # Broadcast to all users in this project
    await sio.emit(
        'task_created',
        {
            'task': task,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{project_id}'
    )

@sio.event
async def task_updated(sid, data):
    """
    Broadcast task update event
    data: {project_id, task_id, updates}
    """
    project_id = data.get('project_id')
    task_id = data.get('task_id')
    updates = data.get('updates')
    
    # Broadcast to all users in this project
    await sio.emit(
        'task_updated',
        {
            'task_id': task_id,
            'updates': updates,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{project_id}'
    )

@sio.event
async def task_status_changed(sid, data):
    """
    Broadcast task status change (for Kanban drag-and-drop)
    data: {project_id, task_id, status}
    """
    project_id = data.get('project_id')
    task_id = data.get('task_id')
    status = data.get('status')
    
    # Broadcast to all users in this project
    await sio.emit(
        'task_status_changed',
        {
            'task_id': task_id,
            'status': status,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{project_id}'
    )

@sio.event
async def task_deleted(sid, data):
    """
    Broadcast task deletion event
    data: {project_id, task_id}
    """
    project_id = data.get('project_id')
    task_id = data.get('task_id')
    
    # Broadcast to all users in this project
    await sio.emit(
        'task_deleted',
        {
            'task_id': task_id,
            'timestamp': datetime.utcnow().isoformat()
        },
        room=f'project_{project_id}'
    )

@sio.event
async def cursor_position(sid, data):
    """
    Broadcast user's cursor position for real-time awareness
    data: {user_id, project_id, x, y}
    """
    project_id = data.get('project_id')
    user_id = data.get('user_id')
    x = data.get('x')
    y = data.get('y')
    
    # Broadcast to all other users in this project
    await sio.emit(
        'cursor_position',
        {
            'user_id': user_id,
            'x': x,
            'y': y
        },
        room=f'project_{project_id}',
        skip_sid=sid
    )

@sio.event
async def typing(sid, data):
    """
    Broadcast typing indicator
    data: {user_id, project_id, task_id}
    """
    project_id = data.get('project_id')
    user_id = data.get('user_id')
    task_id = data.get('task_id')
    
    # Broadcast to all other users in this project
    await sio.emit(
        'user_typing',
        {
            'user_id': user_id,
            'task_id': task_id
        },
        room=f'project_{project_id}',
        skip_sid=sid
    )

# Create ASGI app wrapper for Socket.io
socketio_app = ASGIApp(sio, static_files={})

# Function to get active users in a project
def get_project_users(project_id):
    """Get list of active users in a project"""
    users = []
    for user_id, connections in active_connections.items():
        for sid_data in connections.values():
            if project_id in sid_data.get('project_ids', set()):
                if user_id not in users:
                    users.append(user_id)
    return users
