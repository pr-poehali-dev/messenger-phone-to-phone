"""
Аутентификация пользователей: регистрация (action=register), вход (action=login),
выход (action=logout), текущий пользователь (action=me).
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p60083583_messenger_phone_to_p")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.phone, u.username, u.bio FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "phone": row[2], "username": row[3], "bio": row[4]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers", {}) or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    conn = get_conn()

    # register
    if action == "register":
        name = (body.get("name") or "").strip()
        phone = (body.get("phone") or "").strip()
        password = body.get("password", "")

        if not name or not phone or not password:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}

        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Номер уже зарегистрирован"})}

        pwd_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, phone, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (name, phone, pwd_hash)
        )
        user_id = cur.fetchone()[0]
        new_token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, new_token))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "token": new_token,
            "user": {"id": user_id, "name": name, "phone": phone}
        })}

    # login
    if action == "login":
        phone = (body.get("phone") or "").strip()
        password = body.get("password", "")

        cur = conn.cursor()
        cur.execute(f"SELECT id, name, password_hash, username, bio FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        row = cur.fetchone()
        if not row or row[2] != hash_password(password):
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный номер или пароль"})}

        new_token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (row[0], new_token))
        cur.execute(f"UPDATE {SCHEMA}.users SET online = TRUE, last_seen = NOW() WHERE id = %s", (row[0],))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "token": new_token,
            "user": {"id": row[0], "name": row[1], "phone": phone, "username": row[3], "bio": row[4]}
        })}

    # me
    if action == "me":
        user = get_user_by_token(conn, token)
        conn.close()
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

    # logout
    if action == "logout":
        if token:
            cur = conn.cursor()
            cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE token = %s", (token,))
            row = cur.fetchone()
            if row:
                cur.execute(f"UPDATE {SCHEMA}.users SET online = FALSE, last_seen = NOW() WHERE id = %s", (row[0],))
                cur.execute(f"UPDATE {SCHEMA}.sessions SET token = '' WHERE token = %s", (token,))
            conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите action"})}
