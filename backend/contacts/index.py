"""
Контакты: поиск пользователей по имени или телефону, обновление профиля.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p60083583_messenger_phone_to_p")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def auth(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    return {"id": row[0], "name": row[1]} if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers", {}) or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    conn = get_conn()
    user = auth(conn, token)
    if not user:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    uid = user["id"]

    # search — поиск пользователей
    if action == "search":
        q = (body.get("q") or "").strip()
        if len(q) < 2:
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": []})}

        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, phone, username, bio, online
            FROM {SCHEMA}.users
            WHERE id != {uid} AND (
                LOWER(name) LIKE LOWER(%s) OR
                phone LIKE %s OR
                LOWER(username) LIKE LOWER(%s)
            )
            LIMIT 20
        """, (f"%{q}%", f"%{q}%", f"%{q}%"))
        rows = cur.fetchall()
        users = [{"id": r[0], "name": r[1], "phone": r[2], "username": r[3], "bio": r[4], "online": r[5]} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

    # all — все пользователи кроме себя
    if action == "all":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, phone, username, online FROM {SCHEMA}.users WHERE id != {uid} ORDER BY name LIMIT 50
        """)
        rows = cur.fetchall()
        users = [{"id": r[0], "name": r[1], "phone": r[2], "username": r[3], "online": r[4]} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

    # profile — обновить профиль
    if action == "profile":
        name = (body.get("name") or "").strip()
        bio = (body.get("bio") or "").strip()
        username = (body.get("username") or "").strip() or None

        cur = conn.cursor()
        if name:
            cur.execute(f"UPDATE {SCHEMA}.users SET name = %s, bio = %s, username = %s WHERE id = %s",
                        (name, bio, username, uid))
            conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите action"})}