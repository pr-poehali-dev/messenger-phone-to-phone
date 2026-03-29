import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Authorization',
    'Access-Control-Max-Age': '86400',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(token):
    if not token:
        return None
    db = get_db()
    cur = db.cursor()
    cur.execute(
        "SELECT u.id, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    db.close()
    if not row:
        return None
    return {'id': row[0], 'name': row[1]}

def resp(status, body):
    return {'statusCode': status, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps(body, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    """Управление звонками: инициация, signaling (offer/answer/ice), завершение."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = event.get('headers', {}).get('x-auth-token') or event.get('headers', {}).get('X-Auth-Token') or ''
    user = get_user(token)
    if not user:
        return resp(401, {'error': 'Не авторизован'})

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    action = body.get('action', '')
    db = get_db()
    cur = db.cursor()

    if action == 'start':
        # Инициировать звонок
        chat_id = body.get('chat_id')
        callee_id = body.get('callee_id')
        call_type = body.get('call_type', 'audio')  # audio | video

        # Завершаем старые звонки из этого чата (если есть)
        cur.execute(
            "UPDATE calls SET status='ended', ended_at=NOW() WHERE chat_id=%s AND status IN ('ringing','active')",
            (chat_id,)
        )

        cur.execute(
            "INSERT INTO calls (chat_id, caller_id, callee_id, call_type, status) VALUES (%s,%s,%s,%s,'ringing') RETURNING id",
            (chat_id, user['id'], callee_id, call_type)
        )
        call_id = cur.fetchone()[0]
        db.commit()
        db.close()
        return resp(200, {'call_id': call_id, 'status': 'ringing'})

    elif action == 'answer':
        call_id = body.get('call_id')
        cur.execute(
            "UPDATE calls SET status='active', answered_at=NOW() WHERE id=%s AND callee_id=%s",
            (call_id, user['id'])
        )
        db.commit()
        db.close()
        return resp(200, {'ok': True})

    elif action == 'reject':
        call_id = body.get('call_id')
        cur.execute(
            "UPDATE calls SET status='rejected', ended_at=NOW() WHERE id=%s",
            (call_id,)
        )
        db.commit()
        db.close()
        return resp(200, {'ok': True})

    elif action == 'end':
        call_id = body.get('call_id')
        cur.execute(
            "UPDATE calls SET status='ended', ended_at=NOW() WHERE id=%s",
            (call_id,)
        )
        db.commit()
        db.close()
        return resp(200, {'ok': True})

    elif action == 'signal':
        # Отправить WebRTC сигнал (offer / answer / ice-candidate)
        call_id = body.get('call_id')
        to_user_id = body.get('to_user_id')
        signal_type = body.get('signal_type')  # offer | answer | ice-candidate
        payload = body.get('payload')

        cur.execute(
            "INSERT INTO call_signals (call_id, from_user_id, to_user_id, signal_type, payload) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (call_id, user['id'], to_user_id, signal_type, json.dumps(payload) if not isinstance(payload, str) else payload)
        )
        db.commit()
        db.close()
        return resp(200, {'ok': True})

    elif action == 'poll':
        # Получить входящие сигналы и статус звонка
        call_id = body.get('call_id')
        since_id = body.get('since_id', 0)

        # Получаем сигналы адресованные текущему пользователю
        cur.execute(
            "SELECT id, from_user_id, signal_type, payload FROM call_signals WHERE call_id=%s AND to_user_id=%s AND id>%s ORDER BY id ASC",
            (call_id, user['id'], since_id)
        )
        rows = cur.fetchall()
        signals = [{'id': r[0], 'from_user_id': r[1], 'signal_type': r[2], 'payload': r[3]} for r in rows]

        # Статус звонка
        cur.execute("SELECT status FROM calls WHERE id=%s", (call_id,))
        row = cur.fetchone()
        call_status = row[0] if row else 'ended'

        db.close()
        return resp(200, {'signals': signals, 'call_status': call_status})

    elif action == 'incoming':
        # Проверить входящий звонок для текущего пользователя
        cur.execute(
            """SELECT c.id, c.chat_id, c.caller_id, c.call_type, c.status, u.name as caller_name
               FROM calls c JOIN users u ON u.id=c.caller_id
               WHERE c.callee_id=%s AND c.status='ringing'
               ORDER BY c.created_at DESC LIMIT 1""",
            (user['id'],)
        )
        row = cur.fetchone()
        db.close()
        if row:
            return resp(200, {
                'call': {
                    'id': row[0], 'chat_id': row[1], 'caller_id': row[2],
                    'call_type': row[3], 'status': row[4], 'caller_name': row[5]
                }
            })
        return resp(200, {'call': None})

    db.close()
    return resp(400, {'error': 'Неизвестное действие'})
